import { auth, firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { cleanCPF } from '../../shared/utils/cpf.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { UserRole, UserPayload } from '../../shared/types/user.js';
import { storageService } from '../../shared/services/storage.service.js';

interface CreateProfessionalDTO {
  nome: string;
  cpf: string;
  email: string;
  password: string;
  telefone: string;
  role: 'monitor' | 'coordenador' | 'secretaria';
  associacaoId?: string;
  endereco?: string;
}

interface UpdateUserDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  nomeResponsavel?: string;
  telefoneEmergencia?: string;
}

export class UsersService {
  async createUser(dto: CreateProfessionalDTO, requestingUser: UserPayload) {
    // Mitigação de Elevação de Privilégios (Anti-Privilege Escalation)
    if (requestingUser.role === 'coordenador') {
      if (dto.role === 'secretaria') {
        throw new AppError(
          'Acesso negado. Coordenadores não possuem autorização para criar administradores da Secretaria.',
          403,
          'FORBIDDEN'
        );
      }
      // Força o vínculo com a associação do coordenador
      dto.associacaoId = requestingUser.associacaoId;
    }

    const cpfClean = cleanCPF(dto.cpf);

    // Valida unicidade de CPF
    const existing = await firestore
      .collection('users')
      .where('cpf', '==', cpfClean)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new AppError('Este CPF já está cadastrado no sistema', 409, 'CONFLICT');
    }

    // Criação no Firebase Auth
    let fbUser;
    try {
      fbUser = await auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.nome,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new AppError('O e-mail informado já está cadastrado', 409, 'EMAIL_ALREADY_EXISTS');
      }
      throw new AppError(`Erro ao criar usuário: ${err.message}`, 400, 'BAD_REQUEST');
    }

    // Injeção de Custom Claims
    await auth.setCustomUserClaims(fbUser.uid, {
      role: dto.role,
      associacaoId: dto.associacaoId || null,
    });

    const agora = getBrasiliaNow().toISOString();

    const userDoc = {
      uid: fbUser.uid,
      cpf: cpfClean,
      nome: dto.nome,
      email: dto.email,
      telefone: dto.telefone,
      endereco: dto.endereco || null,
      role: dto.role,
      associacaoId: dto.associacaoId || null,
      fotoUrl: null,
      criadoEm: agora,
    };

    await firestore.collection('users').doc(fbUser.uid).set(userDoc);

    return userDoc;
  }

  async listUsers(filters: { role?: UserRole; associacaoId?: string }, requestingUser: UserPayload) {
    let query: FirebaseFirestore.Query = firestore.collection('users');

    // Multitenancy: Coordenador só pode listar usuários da sua própria associação
    let targetAssociacaoId = filters.associacaoId;
    if (requestingUser.role === 'coordenador') {
      targetAssociacaoId = requestingUser.associacaoId;
    }

    if (filters.role) {
      query = query.where('role', '==', filters.role);
    }
    if (targetAssociacaoId) {
      query = query.where('associacaoId', '==', targetAssociacaoId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as any);
  }

  async getUserById(id: string, requestingUser: UserPayload) {
    // Anti-IDOR: Aluno só pode consultar seu próprio perfil
    if (requestingUser.role === 'aluno' && requestingUser.uid !== id) {
      throw new AppError(
        'Acesso negado. Você só tem permissão para consultar os seus próprios dados de perfil.',
        403,
        'FORBIDDEN'
      );
    }

    const doc = await firestore.collection('users').doc(id).get();
    if (!doc.exists) {
      throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');
    }
    const data = doc.data() as any;

    // Multitenancy: Coordenador só pode consultar usuários da sua associação
    if (requestingUser.role === 'coordenador') {
      if (data.associacaoId && data.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Acesso negado. Este usuário pertence a outra associação parceira.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
    }

    return data;
  }

  async updateUser(id: string, dto: UpdateUserDTO, requestingUser: UserPayload) {
    // Anti-IDOR: Aluno só pode editar o próprio perfil
    if (requestingUser.role === 'aluno' && requestingUser.uid !== id) {
      throw new AppError(
        'Acesso negado. Você só tem permissão para atualizar os dados do seu próprio perfil.',
        403,
        'FORBIDDEN'
      );
    }

    const userRef = firestore.collection('users').doc(id);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');
    }
    const currentData = doc.data() as any;

    // Multitenancy: Coordenador só edita usuários da sua associação
    if (requestingUser.role === 'coordenador') {
      if (currentData.associacaoId && currentData.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Acesso negado. Este usuário não pertence à sua associação parceira.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
    }

    const updates: Record<string, any> = {};
    if (dto.nome !== undefined) updates.nome = dto.nome;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.telefone !== undefined) updates.telefone = dto.telefone;
    if (dto.endereco !== undefined) updates.endereco = dto.endereco;
    if (dto.nomeResponsavel !== undefined) updates.nomeResponsavel = dto.nomeResponsavel;
    if (dto.telefoneEmergencia !== undefined) updates.telefoneEmergencia = dto.telefoneEmergencia;

    if (Object.keys(updates).length > 0) {
      updates.atualizadoEm = getBrasiliaNow().toISOString();
      await userRef.update(updates);
    }

    return { ...currentData, ...updates };
  }

  async updateFotoPerfil(
    id: string,
    fileBuffer: Buffer,
    declaredMimeType: string | undefined,
    requestingUser: UserPayload
  ) {
    // Anti-IDOR: Aluno só pode atualizar sua própria foto
    if (requestingUser.role === 'aluno' && requestingUser.uid !== id) {
      throw new AppError(
        'Acesso negado. Você só tem permissão para atualizar a foto do seu próprio perfil.',
        403,
        'FORBIDDEN'
      );
    }

    const userRef = firestore.collection('users').doc(id);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');
    }
    const currentData = doc.data() as any;

    // Multitenancy: Coordenador só edita usuários da sua associação
    if (requestingUser.role === 'coordenador') {
      if (currentData.associacaoId && currentData.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Acesso negado. Este usuário não pertence à sua associação parceira.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
    }

    // Processa upload seguro no Storage com Magic Bytes, Sharp e NSFW
    const newFotoUrl = await storageService.uploadProfilePicture(
      id,
      fileBuffer,
      declaredMimeType,
      currentData.fotoUrl
    );

    // Atualiza fotoUrl no cadastro do usuário
    await userRef.update({
      fotoUrl: newFotoUrl,
      atualizadoEm: getBrasiliaNow().toISOString(),
    });

    return {
      fotoUrl: newFotoUrl,
      message: 'Foto de perfil atualizada com sucesso no cadastro e na Carteirinha Digital.',
    };
  }
}

export const usersService = new UsersService();
