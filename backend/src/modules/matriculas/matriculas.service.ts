import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { UserPayload } from '../../shared/types/user.js';
import { generateCarteirinhaHash, timingSafeStringCompare } from '../../shared/utils/crypto.js';
import { accessService } from '../../shared/services/access.service.js';

export class MatriculasService {
  async createMatricula(alunoId: string, turmaId: string, requestingUser: UserPayload) {
    const alunoDoc = await firestore.collection('users').doc(alunoId).get();
    if (!alunoDoc.exists) {
      throw new AppError('Aluno não encontrado', 404, 'NOT_FOUND');
    }

    // Valida permissão do usuário solicitante para operar na turma
    const { turma: turmaData } = await accessService.assertTurmaAccess(turmaId, requestingUser);

    // Executa em transação para evitar condição de corrida na capacidade máxima
    const agora = getBrasiliaNow().toISOString();
    const matriculaRef = firestore.collection('matriculas').doc();

    const payload = await firestore.runTransaction(async (transaction) => {
      // 1. Verificar se já existe matrícula ativa
      const existente = await transaction.get(
        firestore
          .collection('matriculas')
          .where('alunoId', '==', alunoId)
          .where('turmaId', '==', turmaId)
          .where('status', '==', 'ativo')
          .limit(1)
      );

      if (!existente.empty) {
        throw new AppError('Aluno já está matriculado nesta turma', 409, 'CONFLICT');
      }

      // 2. Verificar capacidade
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
        modalidadeId: turmaData.modalidadeId,
        status: 'ativo' as const,
        dataInscricao: agora,
      };

      transaction.set(matriculaRef, newPayload);
      return newPayload;
    });

    return payload;
  }

  async getCarteirinha(alunoId: string, requestingUser: UserPayload) {
    // Escopo de acesso seguro: aluno só vê a sua; coordenador e monitor só alunos em seu escopo
    await accessService.assertAlunoAccess(alunoId, requestingUser);

    // 1. Obter dados do aluno
    const alunoDoc = await firestore.collection('users').doc(alunoId).get();
    if (!alunoDoc.exists) {
      throw new AppError('Aluno não encontrado', 404, 'NOT_FOUND');
    }
    const aluno = alunoDoc.data()!;

    // 2. Obter matrícula ativa
    const matriculaSnap = await firestore
      .collection('matriculas')
      .where('alunoId', '==', alunoId)
      .where('status', '==', 'ativo')
      .limit(1)
      .get();

    let matricula: any = {};
    let turma: any = {};
    let modalidade: any = {};

    if (!matriculaSnap.empty) {
      matricula = matriculaSnap.docs[0].data();
      // 3. Obter dados da turma
      const turmaDoc = await firestore.collection('turmas').doc(matricula.turmaId).get();
      if (turmaDoc.exists) turma = turmaDoc.data()!;

      // 4. Obter dados da modalidade
      const modalidadeDoc = await firestore.collection('modalidades').doc(matricula.modalidadeId).get();
      if (modalidadeDoc.exists) modalidade = modalidadeDoc.data()!;
    }

    // 5. Obter associação
    let associacaoNome = 'Prefeitura Municipal de Peruíbe';
    if (aluno.associacaoId) {
      const assocDoc = await firestore.collection('associacoes').doc(aluno.associacaoId).get();
      if (assocDoc.exists) {
        associacaoNome = assocDoc.data()?.nome || associacaoNome;
      }
    }

    const qrValidationHash = generateCarteirinhaHash(
      alunoId,
      aluno.numeroMatricula || 'SEM-MATRICULA',
      aluno.associacaoId || 'SELPE'
    );

    return {
      numeroMatricula: aluno.numeroMatricula || 'SEM-MATRICULA',
      nome: aluno.nome,
      cpf: aluno.cpf,
      fotoUrl: aluno.fotoUrl || null,
      modalidadeNome: modalidade.nome || 'Esporte Geral',
      local: modalidade.local || 'Polo Esportivo Municipal',
      diasSemana: turma.diasSemana || [],
      horarioInicio: turma.horarioInicio || '08:00',
      horarioFim: turma.horarioFim || '09:30',
      telefoneEmergencia: aluno.telefoneEmergencia || '',
      nomeResponsavel: aluno.nomeResponsavel || null,
      associacaoNome,
      status: matricula.status || 'ativo',
      qrValidationHash,
      validadoEm: getBrasiliaNow().toISOString(),
    };
  }

  /**
   * Valida a autenticidade física/digital do QR Code da carteirinha usando
   * comparação em tempo constante contra Timing Attacks.
   */
  async validarCarteirinha(alunoId?: string, qrValidationHash?: string, matricula?: string) {
    if (!qrValidationHash) {
      throw new AppError('Hash de validação obrigatório', 400, 'BAD_REQUEST');
    }

    let targetAlunoId = alunoId;
    if (!targetAlunoId && matricula) {
      const snap = await firestore
        .collection('users')
        .where('numeroMatricula', '==', matricula)
        .limit(1)
        .get();
      if (!snap.empty) {
        targetAlunoId = snap.docs[0].id;
      }
    }

    if (!targetAlunoId) {
      throw new AppError('Aluno não identificado para validação.', 404, 'NOT_FOUND');
    }

    const alunoDoc = await firestore.collection('users').doc(targetAlunoId).get();
    if (!alunoDoc.exists) {
      throw new AppError('Aluno não encontrado', 404, 'NOT_FOUND');
    }
    const aluno = alunoDoc.data()!;

    const expectedHash = generateCarteirinhaHash(
      targetAlunoId,
      aluno.numeroMatricula || 'SEM-MATRICULA',
      aluno.associacaoId || 'SELPE'
    );

    // Comparação imune a ataques de temporização (Timing Attacks)
    const isValido = timingSafeStringCompare(qrValidationHash, expectedHash);
    if (!isValido) {
      throw new AppError(
        'Carteirinha digital inválida ou falsificada. O hash de validação não corresponde ao cadastro oficial.',
        400,
        'INVALID_CARTEIRINHA_HASH'
      );
    }

    const maskedCpf = aluno.cpf
      ? aluno.cpf.replace(/(\d{3})\d{6}(\d{2})/, '$1.***.***-$2')
      : '***.***.***-**';

    return {
      valido: true,
      aluno: {
        alunoId: targetAlunoId,
        nome: aluno.nome,
        numeroMatricula: aluno.numeroMatricula,
        cpf: maskedCpf,
        fotoUrl: aluno.fotoUrl || null,
        associacaoId: aluno.associacaoId,
      },
      validadoEm: getBrasiliaNow().toISOString(),
    };
  }

  /**
   * Lista matrículas com filtros opcionais por turma e por aluno, respeitando rigorosamente o escopo multitenant.
   */
  async listMatriculas(turmaId?: string, alunoId?: string, requestingUser?: UserPayload) {
    if (requestingUser) {
      if (turmaId) {
        await accessService.assertTurmaAccess(turmaId, requestingUser);
      }
      if (alunoId) {
        await accessService.assertAlunoAccess(alunoId, requestingUser);
      }
    }

    let targetAlunoId = alunoId;
    if (requestingUser?.role === 'aluno') {
      targetAlunoId = requestingUser.uid;
    }

    let matriculas: any[] = [];

    if (turmaId) {
      let query: FirebaseFirestore.Query = firestore.collection('matriculas').where('turmaId', '==', turmaId);
      if (targetAlunoId) query = query.where('alunoId', '==', targetAlunoId);
      const snapshot = await query.get();
      matriculas = snapshot.docs.map((doc) => doc.data() as any);
    } else if (targetAlunoId) {
      const snapshot = await firestore
        .collection('matriculas')
        .where('alunoId', '==', targetAlunoId)
        .get();
      matriculas = snapshot.docs.map((doc) => doc.data() as any);
    } else {
      // Sem filtro específico: aplica escopo estrito do perfil do solicitante
      if (requestingUser) {
        const scopedTurmaIds = await accessService.getScopedTurmaIds(requestingUser);
        if (scopedTurmaIds !== null) {
          if (scopedTurmaIds.length === 0) {
            return [];
          }
          // Chunking de 30 para o limite de 'in' do Firestore
          for (let i = 0; i < scopedTurmaIds.length; i += 30) {
            const chunk = scopedTurmaIds.slice(i, i + 30);
            const chunkSnap = await firestore
              .collection('matriculas')
              .where('turmaId', 'in', chunk)
              .get();
            matriculas.push(...chunkSnap.docs.map((doc) => doc.data() as any));
          }
        } else {
          // Secretaria: acesso global
          const snapshot = await firestore.collection('matriculas').get();
          matriculas = snapshot.docs.map((doc) => doc.data() as any);
        }
      } else {
        const snapshot = await firestore.collection('matriculas').get();
        matriculas = snapshot.docs.map((doc) => doc.data() as any);
      }
    }

    // Enriquecimento seguro com dados do atleta
    const enriquecidas = await Promise.all(
      matriculas.map(async (m) => {
        const alunoDoc = await firestore.collection('users').doc(m.alunoId).get();
        const aluno = alunoDoc.exists ? alunoDoc.data() : null;
        return {
          ...m,
          aluno: aluno
            ? {
                nome: aluno.nome,
                cpf: aluno.cpf,
                numeroMatricula: aluno.numeroMatricula,
                fotoUrl: aluno.fotoUrl || null,
              }
            : null,
        };
      })
    );

    return enriquecidas;
  }

  /**
   * Cancela uma matrícula com justificativa administrativa e controle multitenant
   */
  async cancelarMatricula(matriculaId: string, motivo: string | undefined, requestingUser: UserPayload) {
    const matriculaRef = firestore.collection('matriculas').doc(matriculaId);
    const doc = await matriculaRef.get();
    if (!doc.exists) {
      throw new AppError('Matrícula não encontrada', 404, 'NOT_FOUND');
    }
    const matricula = doc.data() as any;

    // Valida permissão na turma da matrícula
    await accessService.assertTurmaAccess(matricula.turmaId, requestingUser);

    const agora = getBrasiliaNow().toISOString();
    const motivoFinal = motivo || 'Cancelamento solicitado pela administração';
    await matriculaRef.update({
      status: 'cancelado',
      dataCancelamento: agora,
      motivoCancelamento: motivoFinal,
      canceladoPor: requestingUser.uid,
    });

    return {
      ...matricula,
      status: 'cancelado',
      dataCancelamento: agora,
      motivoCancelamento: motivoFinal,
      canceladoPor: requestingUser.uid,
    };
  }
}

export const matriculasService = new MatriculasService();
