import { firestore } from '../firebase/admin.js';
import { AppError } from '../errors/AppError.js';
import { UserPayload } from '../types/user.js';

export class AccessService {
  /**
   * Valida se o usuário autenticado tem permissão para visualizar/gerenciar a turma especificada.
   * Lança AppError 404 se a turma não existir e 403 se o usuário não tiver permissão.
   */
  async assertTurmaAccess(turmaId: string, user: UserPayload) {
    const turmaDoc = await firestore.collection('turmas').doc(turmaId).get();
    if (!turmaDoc.exists) {
      throw new AppError('Turma informada não foi encontrada', 404, 'NOT_FOUND');
    }
    const turma = turmaDoc.data()!;

    let modalidade: any = null;
    if (turma.modalidadeId) {
      const modalidadeDoc = await firestore.collection('modalidades').doc(turma.modalidadeId).get();
      if (modalidadeDoc.exists) {
        modalidade = modalidadeDoc.data()!;
      }
    }

    if (user.role === 'secretaria') {
      return { turma, modalidade };
    }

    if (user.role === 'coordenador') {
      const turmaAssocId = turma.associacaoId || modalidade?.associacaoId;
      if (!turmaAssocId || turmaAssocId !== user.associacaoId) {
        throw new AppError(
          'Acesso negado. Esta turma pertence a outra associação parceira.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
      return { turma, modalidade };
    }

    if (user.role === 'monitor') {
      if (turma.monitorId !== user.uid) {
        throw new AppError(
          'Acesso negado. Você só possui permissão para atuar sobre suas próprias turmas.',
          403,
          'FORBIDDEN'
        );
      }
      return { turma, modalidade };
    }

    if (user.role === 'aluno') {
      const matriculaSnap = await firestore
        .collection('matriculas')
        .where('alunoId', '==', user.uid)
        .where('turmaId', '==', turmaId)
        .where('status', '==', 'ativo')
        .limit(1)
        .get();

      if (matriculaSnap.empty) {
        throw new AppError(
          'Acesso negado. Você não está matriculado nesta turma.',
          403,
          'FORBIDDEN'
        );
      }
      return { turma, modalidade };
    }

    throw new AppError('Acesso não autorizado para este perfil', 403, 'FORBIDDEN');
  }

  /**
   * Retorna a lista de IDs de turmas permitidas para o usuário filtrar listagens.
   * Retorna null caso o usuário tenha permissão global irrestrita (Secretaria).
   */
  async getScopedTurmaIds(user: UserPayload): Promise<string[] | null> {
    if (user.role === 'secretaria') {
      return null; // Acesso global
    }

    if (user.role === 'monitor') {
      const snap = await firestore
        .collection('turmas')
        .where('monitorId', '==', user.uid)
        .get();
      return snap.docs.map((doc) => doc.id);
    }

    if (user.role === 'coordenador') {
      if (!user.associacaoId) return [];

      // 1. Turmas com associacaoId direto
      const turmasDirectSnap = await firestore
        .collection('turmas')
        .where('associacaoId', '==', user.associacaoId)
        .get();

      const ids = new Set<string>(turmasDirectSnap.docs.map((d) => d.id));

      // 2. Turmas vinculadas através das modalidades da associação
      const modSnap = await firestore
        .collection('modalidades')
        .where('associacaoId', '==', user.associacaoId)
        .get();

      const modIds = modSnap.docs.map((d) => d.id);
      if (modIds.length > 0) {
        // Firestore limita 'in' queries a 30 elementos
        for (let i = 0; i < modIds.length; i += 30) {
          const chunk = modIds.slice(i, i + 30);
          const chunkSnap = await firestore
            .collection('turmas')
            .where('modalidadeId', 'in', chunk)
            .get();
          chunkSnap.docs.forEach((d) => ids.add(d.id));
        }
      }

      return Array.from(ids);
    }

    if (user.role === 'aluno') {
      const snap = await firestore
        .collection('matriculas')
        .where('alunoId', '==', user.uid)
        .where('status', '==', 'ativo')
        .get();
      return snap.docs.map((doc) => doc.data().turmaId).filter(Boolean);
    }

    return [];
  }

  /**
   * Garante que o solicitante tenha permissão para acessar os dados sensíveis do aluno.
   */
  async assertAlunoAccess(alunoId: string, user: UserPayload) {
    if (user.role === 'aluno') {
      if (user.uid !== alunoId) {
        throw new AppError(
          'Acesso negado. Você só tem permissão para visualizar seus próprios dados.',
          403,
          'FORBIDDEN'
        );
      }
      return;
    }

    if (user.role === 'secretaria') {
      return;
    }

    const alunoDoc = await firestore.collection('users').doc(alunoId).get();
    if (!alunoDoc.exists) {
      throw new AppError('Aluno não encontrado', 404, 'NOT_FOUND');
    }
    const aluno = alunoDoc.data()!;

    if (user.role === 'coordenador') {
      // Coordenador pode acessar se aluno for da mesma associacao
      if (aluno.associacaoId && aluno.associacaoId === user.associacaoId) {
        return;
      }
      // Ou se o aluno tiver matrícula em alguma turma da associação
      const scopedTurmas = await this.getScopedTurmaIds(user);
      if (scopedTurmas && scopedTurmas.length > 0) {
        const matSnap = await firestore
          .collection('matriculas')
          .where('alunoId', '==', alunoId)
          .where('status', '==', 'ativo')
          .get();

        const temMatricula = matSnap.docs.some((d) => scopedTurmas.includes(d.data().turmaId));
        if (temMatricula) return;
      }

      throw new AppError(
        'Acesso negado. Este atleta não pertence ao escopo da sua associação.',
        403,
        'TENANT_ACCESS_DENIED'
      );
    }

    if (user.role === 'monitor') {
      // Monitor só pode acessar se o aluno tiver matrícula ativa em uma das turmas do monitor
      const monitorTurmas = await this.getScopedTurmaIds(user);
      if (monitorTurmas && monitorTurmas.length > 0) {
        const matSnap = await firestore
          .collection('matriculas')
          .where('alunoId', '==', alunoId)
          .where('status', '==', 'ativo')
          .get();

        const temMatricula = matSnap.docs.some((d) => monitorTurmas.includes(d.data().turmaId));
        if (temMatricula) return;
      }

      throw new AppError(
        'Acesso negado. O atleta não está matriculado em nenhuma turma sob sua orientação.',
        403,
        'FORBIDDEN'
      );
    }
  }
}

export const accessService = new AccessService();
