import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import { AppError } from '../errors/AppError.js';

let nsfwModel: nsfwjs.NSFWJS | null = null;

async function getNSFWModel(): Promise<nsfwjs.NSFWJS> {
  if (!nsfwModel) {
    nsfwModel = await nsfwjs.load();
  }
  return nsfwModel;
}

export interface SanitizedImageResult {
  sanitizedBuffer: Buffer;
  mimeType: string;
  extension: string;
}

/**
 * Pipeline completo de validação e sanitização de imagens:
 * 1. Magic Bytes: Sniffing do buffer real com file-type (Anti-Webshell / Anti-Script injection)
 * 2. MIME Spoofing: Checagem de coerência entre extensão declarada e binário
 * 3. Sharp Decompression: Verificação de corrupção, bomba de descompressão e dimensões (max 4000x4000)
 * 4. NSFW Detection: Classificação com nsfwjs / TensorFlow.js para barrar conteúdo explícito
 * 5. Sanitização & Conversão WebP: Remoção de metadados EXIF/GPS e padronização em 500x500 WebP
 */
export async function validateAndSanitizeImage(
  rawBuffer: Buffer,
  declaredMimeType?: string
): Promise<SanitizedImageResult> {
  // 1. Validação de Assinatura Binária (Magic Bytes)
  const detectedType = await fileTypeFromBuffer(rawBuffer);
  if (!detectedType) {
    throw new AppError(
      'Formato de arquivo inválido ou não reconhecido. O arquivo enviado não possui assinatura binária de imagem válida.',
      400,
      'INVALID_FILE_TYPE'
    );
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(detectedType.mime)) {
    throw new AppError(
      `Tipo de arquivo não permitido (${detectedType.mime}). Apenas imagens JPEG, PNG ou WebP são aceitas.`,
      400,
      'FORBIDDEN_FILE_TYPE'
    );
  }

  // 2. Detecção de MIME Spoofing
  if (declaredMimeType && declaredMimeType !== 'application/octet-stream') {
    const isEquivalent =
      (declaredMimeType === 'image/jpeg' && detectedType.mime === 'image/jpeg') ||
      (declaredMimeType === 'image/jpg' && detectedType.mime === 'image/jpeg') ||
      (declaredMimeType === 'image/png' && detectedType.mime === 'image/png') ||
      (declaredMimeType === 'image/webp' && detectedType.mime === 'image/webp');

    if (!isEquivalent) {
      throw new AppError(
        `Inconsistência detectada: o tipo declarado (${declaredMimeType}) não coincide com o conteúdo real do arquivo (${detectedType.mime}).`,
        400,
        'MIME_SPOOFING_DETECTED'
      );
    }
  }

  // 3. Inspeção com Sharp (Dimensões e integridade do buffer)
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(rawBuffer).metadata();
  } catch (err: any) {
    throw new AppError(
      'A imagem enviada está corrompida ou possui dados ilegíveis.',
      400,
      'CORRUPT_IMAGE'
    );
  }

  if (!metadata.width || !metadata.height || metadata.width > 4000 || metadata.height > 4000) {
    throw new AppError(
      'Dimensões excessivas: a imagem não pode ultrapassar 4000x4000 pixels.',
      400,
      'IMAGE_TOO_LARGE'
    );
  }

  // 4. Detecção de Conteúdo Impróprio / Explícito (NSFW)
  try {
    const model = await getNSFWModel();
    const { data, info } = await sharp(rawBuffer)
      .resize(224, 224)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const numChannels = 3;
    const numPixels = info.width * info.height;
    const values = new Int32Array(numPixels * numChannels);
    for (let i = 0; i < values.length; i++) {
      values[i] = data[i];
    }

    const imageTensor = tf.tensor3d(values, [info.height, info.width, numChannels], 'int32');
    const predictions = await model.classify(imageTensor as any);
    imageTensor.dispose();

    const pornPred = predictions.find((p) => p.className === 'Porn')?.probability || 0;
    const hentaiPred = predictions.find((p) => p.className === 'Hentai')?.probability || 0;
    const sexyPred = predictions.find((p) => p.className === 'Sexy')?.probability || 0;

    // Se houver probabilidade significativa de conteúdo sexualmente explícito, aborta
    if (pornPred > 0.4 || hentaiPred > 0.4 || sexyPred > 0.75) {
      throw new AppError(
        'Upload rejeitado: a imagem foi identificada pelo sistema de moderação como contendo conteúdo explícito ou impróprio (NSFW).',
        400,
        'NSFW_CONTENT_DETECTED',
        { porn: Math.round(pornPred * 100), hentai: Math.round(hentaiPred * 100), sexy: Math.round(sexyPred * 100) }
      );
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.warn('Aviso: Falha temporária no classificador NSFW, prosseguindo com sanitização segura:', err.message);
  }

  // 5. Sanitização final: strip de EXIF/GPS, redimensionamento proporcional e conversão para WebP
  const sanitizedBuffer = await sharp(rawBuffer)
    .rotate() // orienta a imagem corretamente antes de remover EXIF
    .resize(500, 500, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();

  return {
    sanitizedBuffer,
    mimeType: 'image/webp',
    extension: 'webp',
  };
}
