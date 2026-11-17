import crypto from 'node:crypto';
import { auth, firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { UserPayload, UserRole } from '../../shared/types/user.js';

interface CreateConviteDTO {
  role: 'coordenador' | 'monitor' | 'secretaria';
  associacaoId: string;
  modalidadesIds: string[];
  observacoes?: string;
}

interface AceitarConviteDTO {
  nome: string;
  cpf: string;
  email: string;
  password: string;
  telefone: string;
  endereco: string;
  fotoUrl?: string;
}

export class ConvitesService {
  /**
   * Cria convite assinado e seguro de uso único para cadastro profissional.
   */
  async createConvite(dto: CreateConviteDTO, requestingUser: UserPayload) {
    // 1. Verificação rigorosa de autorização contra escalação de privilégios
    if (requestingUser.role === 'coordenador') {
      if (dto.role !== 'monitor') {
        throw new AppError(
          'Coordenadores possuem autorização apenas para convidar Monitores (professores/instrutores).',
          403,
          'FORBIDDEN'
        );
      }
      if (dto.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Coordenador só pode emitir convites vinculados à sua própria associação.',
          403,
          'FORBIDDEN'
        );
      }
    } else if (requestingUser.role !== 'secretaria') {
      throw new AppError(
        'Você não possui permissão para emitir convites profissionais.',
        403,
        'FORBIDDEN'
      );
    }

    // 2. Validar se a associação existe
    const assocDoc = await firestore.collection('associacoes').doc(dto.associacaoId).get();
    if (!assocDoc.exists) {
      throw new AppError('Associação informada não foi encontrada no sistema', 404, 'NOT_FOUND');
    }

    // 3. Gerar token criptográfico de 32 bytes
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

    const agora = getBrasiliaNow().toISOString();
    const expiraEm = new Date(Date.now() + 48 * 3600 * 1000).toISOString(); // 48h de validade

    await firestore.collection('convites_profissionais').doc(tokenHash).set({
      id: tokenHash,
      tokenHash,
      role: dto.role,
      associacaoId: dto.associacaoId,
      modalidadesIds: dto.modalidadesIds || [],
      observacoes: dto.observacoes || null,
      status: 'pendente',
      criadoPor: requestingUser.uid,
      criadoEm: agora,
      expiraEm,
    });

    return {
      token: tokenRaw,
      linkConvite: `/cadastro/profissional?token=${tokenRaw}`,
      role: dto.role,
      associacaoId: dto.associacaoId,
      modalidadesIds: dto.modalidadesIds || [],
      expiraEm,
    };
  }

  /**
   * Resolução pública do token de convite para preenchimento de cadastro no frontend.
   */
  async getConvite(tokenRaw: string) {
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const conviteDoc = await firestore.collection('convites_profissionais').doc(tokenHash).get();

    if (!conviteDoc.exists) {
      throw new AppError('Convite profissional não encontrado ou token inválido', 404, 'NOT_FOUND');
    }

    const convite = conviteDoc.data()!;

    if (convite.status !== 'pendente') {
      throw new AppError('Este convite já foi utilizado ou se encontra expirado', 400, 'ALREADY_USED');
    }

    if (new Date(convite.expiraEm) < new Date()) {
      throw new AppError(
        'Este convite expirou. Solicite um novo link à coordenação ou secretaria.',
        400,
        'EXPIRED_TOKEN'
      );
    }

    // Busca nome da associação
    let associacaoNome = 'Associação Esportiva';
    const assocDoc = await firestore.collection('associacoes').doc(convite.associacaoId).get();
    if (assocDoc.exists) {
      associacaoNome = assocDoc.data()?.nome || associacaoNome;
    }

    // Busca nomes das modalidades vinculadas
    const modalidades: { id: string; nome: string }[] = [];
    if (Array.isArray(convite.modalidadesIds) && convite.modalidadesIds.length > 0) {
      for (const modId of convite.modalidadesIds) {
        const modDoc = await firestore.collection('modalidades').doc(modId).get();
        if (modDoc.exists) {
          modalidades.push({ id: modId, nome: modDoc.data()?.nome || modId });
        }
      }
    }

    return {
      role: convite.role as 'coordenador' | 'monitor' | 'secretaria',
      associacaoId: convite.associacaoId,
      associacaoNome,
      modalidades,
      expiraEm: convite.expiraEm,
      status: convite.status,
    };
  }

  /**
   * Conclui o cadastro profissional utilizando o token de convite.
   */
  async aceitarConvite(tokenRaw: string, dto: AceitarConviteDTO) {
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const conviteRef = firestore.collection('convites_profissionais').doc(tokenHash);
    const conviteDoc = await conviteRef.get();

    if (!conviteDoc.exists) {
      throw new AppError('Convite não encontrado ou token inválido', 404, 'NOT_FOUND');
    }

    const convite = conviteDoc.data()!;

    if (convite.status !== 'pendente') {
      throw new AppError('Este convite já foi utilizado ou se encontra cancelado', 400, 'ALREADY_USED');
    }

    if (new Date(convite.expiraEm) < new Date()) {
      throw new AppError('Este convite expirou. Solicite um novo convite.', 400, 'EXPIRED_TOKEN');
    }

    // Verifica unicidade de CPF
    const existingCpf = await firestore
      .collection('users')
      .where('cpf', '==', dto.cpf)
      .limit(1)
      .get();

    if (!existingCpf.empty) {
      throw new AppError('Este CPF já está cadastrado no sistema', 409, 'CONFLICT');
    }

    // Cria conta no Firebase Auth
    let fbUser;
    try {
      fbUser = await auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.nome,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new AppError('O e-mail informado já está em uso no sistema', 409, 'EMAIL_ALREADY_EXISTS');
      }
      throw new AppError(`Falha ao registrar profissional: ${err.message}`, 400, 'BAD_REQUEST');
    }

    // Injeta Custom Claims com a role e associacaoId estritas do convite
    await auth.setCustomUserClaims(fbUser.uid, {
      role: convite.role,
      associacaoId: convite.associacaoId,
    });

    const agora = getBrasiliaNow().toISOString();

    const userPayload = {
      uid: fbUser.uid,
      nome: dto.nome,
      cpf: dto.cpf,
      email: dto.email,
      telefone: dto.telefone,
      endereco: dto.endereco,
      fotoUrl: dto.fotoUrl || null,
      role: convite.role,
      associacaoId: convite.associacaoId,
      modalidades: convite.modalidadesIds || [],
      status: 'ativo',
      criadoEm: agora,
      convidadoPor: convite.criadoPor,
    };

    await firestore.collection('users').doc(fbUser.uid).set(userPayload);

    // Invalida o token do convite
    await conviteRef.update({
      status: 'utilizado',
      utilizadoEm: agora,
      utilizadoPor: fbUser.uid,
    });

    return {
      user: {
        uid: fbUser.uid,
        nome: dto.nome,
        role: convite.role as 'coordenador' | 'monitor' | 'secretaria',
        cpf: dto.cpf,
        email: dto.email,
        associacaoId: convite.associacaoId,
      },
    };
  }
}

export const convitesService = new ConvitesService();
