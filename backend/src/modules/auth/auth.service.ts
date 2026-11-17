import crypto from 'node:crypto';
import { auth, firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { cleanCPF } from '../../shared/utils/cpf.js';
import { getBrasiliaNow, calculateAgeInBrasilia } from '../../shared/utils/date.js';
import { generateCarteirinhaHash } from '../../shared/utils/crypto.js';
import { env } from '../../config/env.js';

interface RegisterAlunoDTO {
  nome: string;
  cpf: string;
  email: string;
  password: string;
  telefone: string;
  endereco: string;
  nomeResponsavel: string;
  telefoneEmergencia: string;
  turmaId: string;
  dataNascimento: string;
  observacoes?: string;
  fotoUrl?: string;
  associacaoId?: string;
}

export class AuthService {
  /**
   * Autentica com CPF ou Email e Senha.
   */
  async login(identifier: string, password: string) {
    const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(identifier) || /^\d{11}$/.test(identifier);
    const cleaned = isCpf ? cleanCPF(identifier) : identifier.toLowerCase().trim();

    // 1. Localizar usuário no Firestore por login, cpf ou email
    const usersRef = firestore.collection('users');
    let snapshot = await usersRef.where('login', '==', cleaned).limit(1).get();

    if (snapshot.empty && isCpf) {
      snapshot = await usersRef.where('cpf', '==', cleaned).limit(1).get();
    }

    if (snapshot.empty) {
      snapshot = await usersRef.where('email', '==', cleaned).limit(1).get();
    }

    if (snapshot.empty) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.status === 'aguardando_responsavel') {
      throw new AppError(
        'Cadastro pendente de aprovação do responsável legal. Utilize o link enviado ao responsável para confirmar a inscrição.',
        403,
        'AGUARDANDO_RESPONSAVEL'
      );
    }

    const email = userData.email;

    if (!email) {
      throw new AppError('Usuário sem e-mail cadastrado no sistema', 400);
    }

    // 2. Valida a senha contra o Firebase Auth via Identity Toolkit REST
    try {
      const authHost = env.FIREBASE_AUTH_EMULATOR_HOST
        ? `http://${env.FIREBASE_AUTH_EMULATOR_HOST}`
        : 'https://identitytoolkit.googleapis.com';

      const apiKey = 'selpe-api-key';
      const verifyUrl = `${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      if (!res.ok) {
        throw new AppError('Credenciais inválidas', 401);
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Falha ao autenticar credenciais', 401);
    }

    return {
      uid: userDoc.id,
      nome: userData.nome,
      role: userData.role,
      cpf: userData.cpf,
      email: userData.email,
      associacaoId: userData.associacaoId,
      fotoUrl: userData.fotoUrl || null,
    };
  }

  /**
   * Registro público de Aluno via QR Code com geração imediata de Carteirinha.
   */
  async registerAluno(dto: RegisterAlunoDTO) {
    const cpfClean = cleanCPF(dto.cpf);

    // 1. Verificar se CPF já está cadastrado
    const existingCpf = await firestore
      .collection('users')
      .where('cpf', '==', cpfClean)
      .limit(1)
      .get();

    if (!existingCpf.empty) {
      throw new AppError('Este CPF já está cadastrado no sistema', 409);
    }

    const targetTurmaId = dto.turmaId;
    if (!targetTurmaId) {
      throw new AppError('Turma/horário obrigatório para realização da matrícula', 400, 'BAD_REQUEST');
    }

    const turmaDoc = await firestore.collection('turmas').doc(targetTurmaId).get();
    if (!turmaDoc.exists) {
      throw new AppError('A turma selecionada para inscrição não foi encontrada', 404, 'NOT_FOUND');
    }
    const turmaData = turmaDoc.data()!;
    const targetAssociacaoId = turmaData.associacaoId || dto.associacaoId || 'assoc-centro';

    // Verificar se a turma tem capacidade
    if (turmaData.capacidadeMax) {
      const ativas = await firestore
        .collection('matriculas')
        .where('turmaId', '==', targetTurmaId)
        .where('status', '==', 'ativo')
        .get();

      if (ativas.size >= turmaData.capacidadeMax) {
        throw new AppError('A capacidade máxima da turma selecionada já foi atingida', 400, 'BAD_REQUEST');
      }
    }

    let modalidadeNome = 'Esporte Geral';
    if (turmaData.modalidadeId) {
      const modalidadeDoc = await firestore
        .collection('modalidades')
        .doc(turmaData.modalidadeId)
        .get();
      if (modalidadeDoc.exists) {
        modalidadeNome = modalidadeDoc.data()?.nome || 'Esporte Geral';
      }
    }

    // 4. Criar usuário no Firebase Auth
    let fbUser;
    try {
      fbUser = await auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.nome,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new AppError('O e-mail informado já está cadastrado', 409);
      }
      throw new AppError(`Falha ao criar conta: ${err.message}`, 400);
    }

    // 5. Injetar Custom Claims no Firebase Auth
    await auth.setCustomUserClaims(fbUser.uid, {
      role: 'aluno',
      associacaoId: targetAssociacaoId,
    });

    // 6. Gerar número de matrícula (ex: 2026-XXXXXX)
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const numeroMatricula = `${year}-${randomSuffix}`;

    const agora = getBrasiliaNow().toISOString();
    const telefoneEmergencia = dto.telefoneEmergencia || dto.telefone || '';

    // Verifica se é menor de 18 anos
    const idade = calculateAgeInBrasilia(dto.dataNascimento);
    const isMenor = idade < 18;

    // 7. Salvar usuário no Firestore
    const userPayload = {
      uid: fbUser.uid,
      cpf: cpfClean,
      nome: dto.nome,
      email: dto.email,
      telefone: dto.telefone,
      dataNascimento: dto.dataNascimento,
      endereco: dto.endereco,
      role: 'aluno',
      status: isMenor ? 'aguardando_responsavel' : 'ativo',
      associacaoId: targetAssociacaoId,
      criadoEm: agora,
      nomeResponsavel: dto.nomeResponsavel,
      telefoneEmergencia,
      observacoes: dto.observacoes || null,
      fotoUrl: dto.fotoUrl || null,
      numeroMatricula,
    };

    await firestore.collection('users').doc(fbUser.uid).set(userPayload);

    // 8. Salvar Matrícula (ativa para maiores, pendente de confirmação para menores)
    const matriculaRef = firestore.collection('matriculas').doc();
    const matriculaPayload = {
      id: matriculaRef.id,
      alunoId: fbUser.uid,
      turmaId: turmaData.id || targetTurmaId,
      modalidadeId: turmaData.modalidadeId || 'mod-1',
      status: isMenor ? 'pendente_responsavel' : 'ativo',
      dataInscricao: agora,
    };
    await matriculaRef.set(matriculaPayload);

    if (isMenor) {
      const tokenRaw = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

      await firestore.collection('solicitacoes_menores').doc(tokenHash).set({
        id: tokenHash,
        tokenHash,
        alunoId: fbUser.uid,
        alunoNome: dto.nome,
        alunoCpf: cpfClean,
        alunoEmail: dto.email,
        turmaId: turmaData.id || targetTurmaId,
        modalidadeId: turmaData.modalidadeId || 'mod-1',
        modalidadeNome,
        poloNome: turmaData.nome || 'Polo SELPE',
        horarioInicio: turmaData.horarioInicio || '08:00',
        horarioFim: turmaData.horarioFim || '09:00',
        diasSemana: turmaData.diasSemana || [],
        nomeResponsavelDeclarado: dto.nomeResponsavel,
        telefoneEmergencia,
        status: 'pendente',
        criadoEm: agora,
        expiraEm: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      });

      return {
        isMenor: true as const,
        tokenResponsavel: tokenRaw,
        dadosMenor: {
          nome: dto.nome,
          cpfMascarado: `${cpfClean.slice(0, 3)}.***.***-${cpfClean.slice(-2)}`,
          modalidadeNome,
          diasSemana: turmaData?.diasSemana || [],
          horarioInicio: turmaData?.horarioInicio || '08:00',
          horarioFim: turmaData?.horarioFim || '09:00',
        },
      };
    }

    // 9. Gerar Hash de validação da carteirinha (para maiores)
    const qrValidationHash = generateCarteirinhaHash(fbUser.uid, numeroMatricula, targetAssociacaoId);

    const carteirinha = {
      numeroMatricula,
      nome: dto.nome,
      fotoUrl: dto.fotoUrl || null,
      modalidadeNome,
      diasSemana: turmaData?.diasSemana || [],
      horarioInicio: turmaData?.horarioInicio || '08:00',
      horarioFim: turmaData?.horarioFim || '09:00',
      telefoneEmergencia,
      qrValidationHash,
    };

    return {
      isMenor: false as const,
      user: {
        uid: fbUser.uid,
        nome: dto.nome,
        role: 'aluno' as const,
        cpf: cpfClean,
        numeroMatricula,
        associacaoId: targetAssociacaoId,
        fotoUrl: dto.fotoUrl || null,
      },
      carteirinha,
    };
  }

  /**
   * Permite ao próprio aluno autenticado inscrever-se em uma nova turma.
   */
  async createInscricao(alunoId: string, turmaId: string) {
    const alunoDoc = await firestore.collection('users').doc(alunoId).get();
    if (!alunoDoc.exists) {
      throw new AppError('Aluno não encontrado', 404, 'NOT_FOUND');
    }
    const aluno = alunoDoc.data()!;
    if (aluno.role !== 'aluno') {
      throw new AppError('Apenas alunos podem se inscrever em turmas', 403, 'FORBIDDEN');
    }

    // Limite de no máximo 5 inscrições ativas por aluno
    const ativasAluno = await firestore
      .collection('matriculas')
      .where('alunoId', '==', alunoId)
      .where('status', '==', 'ativo')
      .get();

    if (ativasAluno.size >= 5) {
      throw new AppError('Limite de no máximo 5 inscrições ativas por aluno atingido', 400, 'LIMIT_EXCEEDED');
    }

    // Verificar existência da turma
    const turmaDoc = await firestore.collection('turmas').doc(turmaId).get();
    if (!turmaDoc.exists) {
      throw new AppError('Turma não encontrada', 404, 'NOT_FOUND');
    }
    const turmaData = turmaDoc.data()!;

    const agora = getBrasiliaNow().toISOString();
    const matriculaRef = firestore.collection('matriculas').doc();

    const payload = await firestore.runTransaction(async (transaction) => {
      // 1. Verificar se já existe matrícula ativa nesta turma
      const existente = await transaction.get(
        firestore
          .collection('matriculas')
          .where('alunoId', '==', alunoId)
          .where('turmaId', '==', turmaId)
          .where('status', '==', 'ativo')
          .limit(1)
      );

      if (!existente.empty) {
        throw new AppError('Você já está matriculado nesta turma', 409, 'CONFLICT');
      }

      // 2. Verificar capacidade máxima
      if (turmaData.capacidadeMax) {
        const ativas = await transaction.get(
          firestore
            .collection('matriculas')
            .where('turmaId', '==', turmaId)
            .where('status', '==', 'ativo')
        );

        if (ativas.size >= turmaData.capacidadeMax) {
          throw new AppError('A capacidade máxima da turma já foi atingida', 400, 'BAD_REQUEST');
        }
      }

      const newPayload = {
        id: matriculaRef.id,
        alunoId,
        turmaId,
        modalidadeId: turmaData.modalidadeId || 'mod-geral',
        status: 'ativo' as const,
        dataInscricao: agora,
      };

      transaction.set(matriculaRef, newPayload);
      return newPayload;
    });

    return payload;
  }

  /**
   * Permite ao próprio aluno autenticado cancelar uma de suas inscrições.
   */
  async deleteInscricao(alunoId: string, matriculaId: string) {
    const matRef = firestore.collection('matriculas').doc(matriculaId);
    const matDoc = await matRef.get();

    if (!matDoc.exists) {
      throw new AppError('Inscrição não encontrada', 404, 'NOT_FOUND');
    }

    const matData = matDoc.data()!;
    if (matData.alunoId !== alunoId) {
      throw new AppError('Você não tem permissão para cancelar esta inscrição', 403, 'FORBIDDEN');
    }

    if (matData.status === 'cancelado') {
      throw new AppError('Esta inscrição já se encontra cancelada', 400, 'ALREADY_CANCELLED');
    }

    const agora = getBrasiliaNow().toISOString();
    await matRef.update({
      status: 'cancelado',
      dataCancelamento: agora,
    });

    return {
      message: 'Inscrição cancelada com sucesso',
      matriculaId,
      status: 'cancelado',
    };
  }

  /**
   * Retorna os dados completos do usuário autenticado.
   */
  async getMe(uid: string) {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new AppError('Usuário não encontrado', 404);
    }
    const data = userDoc.data()!;
    return {
      uid: userDoc.id,
      nome: data.nome,
      role: data.role,
      cpf: data.cpf,
      email: data.email,
      telefone: data.telefone || null,
      dataNascimento: data.dataNascimento || null,
      endereco: data.endereco || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      nomeResponsavel: data.nomeResponsavel || null,
      associacaoId: data.associacaoId || null,
      numeroMatricula: data.numeroMatricula || null,
      fotoUrl: data.fotoUrl || null,
      telefoneEmergencia: data.telefoneEmergencia || null,
      observacoes: data.observacoes || null,
      modalidades: data.modalidades || [],
    };
  }

  /**
   * Atualiza as modalidades selecionadas pelo aluno após o login.
   */
  async updateMeModalidades(uid: string, modalidades: string[]) {
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new AppError('Usuário não encontrado', 404);
    }

    await userRef.update({
      modalidades,
    });

    // Atualiza/Cria matrículas correspondentes às modalidades selecionadas
    const agora = getBrasiliaNow().toISOString();
    for (const modId of modalidades) {
      const existingMat = await firestore
        .collection('matriculas')
        .where('alunoId', '==', uid)
        .where('modalidadeId', '==', modId)
        .limit(1)
        .get();

      if (existingMat.empty) {
        // Encontrar uma turma ativa dessa modalidade
        const turmaSnap = await firestore
          .collection('turmas')
          .where('modalidadeId', '==', modId)
          .where('ativo', '==', true)
          .limit(1)
          .get();

        if (!turmaSnap.empty) {
          const turmaId = turmaSnap.docs[0].id;
          const matRef = firestore.collection('matriculas').doc();
          await matRef.set({
            id: matRef.id,
            alunoId: uid,
            turmaId,
            modalidadeId: modId,
            status: 'ativo',
            dataInscricao: agora,
          });
        }
      }
    }

    return {
      message: 'Modalidades atualizadas com sucesso',
      modalidades,
    };
  }
}

export const authService = new AuthService();

