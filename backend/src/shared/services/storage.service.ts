import { bucket } from '../firebase/admin.js';
import { env } from '../../config/env.js';
import { validateAndSanitizeImage } from '../utils/fileValidation.js';

export class StorageService {
  /**
   * Processa o upload seguro da foto de perfil:
   * 1. Valida Magic Bytes, sanitiza com Sharp (strip EXIF) e checa conteúdo NSFW
   * 2. Remove avatar anterior do bucket (evita lixo no Storage)
   * 3. Grava no Firebase Storage e retorna URL pública/acessível
   */
  async uploadProfilePicture(
    userId: string,
    rawBuffer: Buffer,
    declaredMimeType?: string,
    previousFotoUrl?: string | null
  ): Promise<string> {
    // 1. Executa pipeline de validação e sanitização
    const { sanitizedBuffer } = await validateAndSanitizeImage(rawBuffer, declaredMimeType);

    // 2. Se o usuário já possuía uma foto anterior no storage, deleta o arquivo antigo
    if (previousFotoUrl) {
      await this.deleteFileFromUrl(previousFotoUrl);
    }

    // 3. Grava no bucket do Firebase Storage
    const fileName = `avatars/${userId}_${Date.now()}.webp`;
    const file = bucket.file(fileName);

    await file.save(sanitizedBuffer, {
      metadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Torna o arquivo público para leitura no bucket
    try {
      await file.makePublic();
    } catch {
      // No emulador local makePublic pode ser no-op
    }

    // 4. Monta a URL de acesso
    let publicUrl: string;
    if (env.FIREBASE_STORAGE_EMULATOR_HOST) {
      // URL acessível via emulador local
      publicUrl = `http://localhost:9195/${env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
    } else {
      // URL padrão do Google Cloud Storage em produção
      publicUrl = `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
    }

    return publicUrl;
  }

  /**
   * Deleta um arquivo do Storage a partir de sua URL (limpeza de avatars antigos)
   */
  async deleteFileFromUrl(fileUrl: string): Promise<void> {
    try {
      // Extrai o caminho relativo (ex: avatars/user123_123456.webp)
      const parts = fileUrl.split(`${env.FIREBASE_STORAGE_BUCKET}/`);
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1].split('?')[0]);
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
        }
      }
    } catch (err: any) {
      console.warn('Aviso: Falha ao deletar arquivo antigo do Storage:', err.message);
    }
  }
}

export const storageService = new StorageService();
