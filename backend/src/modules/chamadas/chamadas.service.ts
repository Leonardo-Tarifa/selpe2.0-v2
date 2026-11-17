import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow, getBrasiliaDateString } from '../../shared/utils/date.js';
import { UserPayload } from '../../shared/types/user.js';

interface CreateChamadaDTO {
  turmaId: string;
  data: string;
  presentes: string[];
  ausentes: string[];
  observacoes?: string;
}

interface SyncItemDTO {
  clientSyncId: string;
  turmaId: string;
  data: string;
  presentes: string[];
  ausentes: string[];
  observacoes?: string;
  dataHoraDispositivo: string;
}

export class ChamadasService {
  /**
   * Valida se o usuário tem permissão para registrar/consultar chamadas nesta turma
   */
  private async validateTurmaAccess(turmaId: string, user: UserPayload) {
    const turmaDoc = await firestore.collection('turmas').doc(turmaId).get();
    if (!turmaDoc.exists) {
      throw new AppError('Turma não encontrada', 404, 'NOT_FOUND');
    }
    const turma = turmaDoc.data()!;

    if (user.role === 'monitor') {
      if (turma.monitorId !== user.uid) {
        throw new AppError(
          'Acesso negado. Você só tem permissão para registrar chamadas das turmas atribuídas a você.',
          403,
          'FORBIDDEN'
        );
      }
    } else if (user.role === 'coordenador') {
      const modalidadeDoc = await firestore.collection('modalidades').doc(turma.modalidadeId).get();
      if (modalidadeDoc.exists && modalidadeDoc.data()!.associacaoId !== user.associacaoId) {
        throw new AppError(
          'Acesso negado. Esta turma pertence a outra associação parceira.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
    }

    return turma;
  }

  /**
   * Valida se os alunos marcados como presentes ou ausentes estão matriculados na turma
   */
  private async validateEnrolledStudents(turmaId: string, alunoIds: string[]) {
    if (!alunoIds.length) return;

    const matriculasSnap = await firestore
      .collection('matriculas')
      .where('turmaId', '==', turmaId)
      .where('status', '==', 'ativo')
      .get();

    const enrolledIds = new Set(matriculasSnap.docs.map((d) => d.data().alunoId));

    for (const id of alunoIds) {
      if (!enrolledIds.has(id)) {
        throw new AppError(
          `O aluno informado (${id}) não possui matrícula ativa nesta turma.`,
          400,
          'STUDENT_NOT_ENROLLED'
        );
      }
    }
  }

  async createChamada(dto: CreateChamadaDTO, user: UserPayload) {
    await this.validateTurmaAccess(dto.turmaId, user);

    // Validação Temporal: Não permite chamada em data futura
    const hoje = getBrasiliaDateString();
    if (dto.data > hoje) {
      throw new AppError(
        'Não é permitido registrar lista de chamada com data futura.',
        400,
        'FUTURE_DATE_NOT_ALLOWED'
      );
    }

    // Validação de Integridade: Alunos devem pertencer à turma
    const allAlunos = [...dto.presentes, ...dto.ausentes];
    await this.validateEnrolledStudents(dto.turmaId, allAlunos);

    const agora = getBrasiliaNow().toISOString();

    // Upsert inteligente: verifica se já existe chamada registrada para esta turma nesta data
    const existenteSnap = await firestore
      .collection('chamadas')
      .where('turmaId', '==', dto.turmaId)
      .where('data', '==', dto.data)
      .limit(1)
      .get();

    let ref: FirebaseFirestore.DocumentReference;
    let isUpdate = false;

    if (!existenteSnap.empty) {
      ref = existenteSnap.docs[0].ref;
      isUpdate = true;
    } else {
      ref = firestore.collection('chamadas').doc();
    }

    const payload = {
      id: ref.id,
      turmaId: dto.turmaId,
      data: dto.data,
      monitorId: user.uid,
      presentes: dto.presentes,
      ausentes: dto.ausentes,
      observacoes: dto.observacoes || null,
      fechadaEm: agora,
      dataHoraServidor: agora,
      sincronizadoOffline: false,
      atualizadoEm: isUpdate ? agora : undefined,
    };

    await ref.set(payload, { merge: true });
    return payload;
  }

  async syncBatch(items: SyncItemDTO[], user: UserPayload) {
    let novos = 0;
    let duplicados = 0;
    const ids: string[] = [];
    const agoraServidor = getBrasiliaNow().toISOString();
    const agoraMs = Date.now();
    const toleranciaMs = 5 * 60 * 1000; // 5 minutos de tolerância de relógio
    const limiteIdadeMs = 15 * 24 * 60 * 60 * 1000; // Máximo 15 dias para sincronizar registros offline

    for (const item of items) {
      // 1. Validação Temporal Anti-Adulteração de Relógio
      const dispTime = new Date(item.dataHoraDispositivo).getTime();
      if (isNaN(dispTime)) {
        throw new AppError(
          `Formato inválido de dataHoraDispositivo no item ${item.clientSyncId}.`,
          400,
          'INVALID_TIMESTAMP'
        );
      }

      if (dispTime > agoraMs + toleranciaMs) {
        throw new AppError(
          `Adulteração detectada: o timestamp do dispositivo (${item.dataHoraDispositivo}) está no futuro.`,
          400,
          'CLOCK_DRIFT_FUTURE'
        );
      }

      if (dispTime < agoraMs - limiteIdadeMs) {
        throw new AppError(
          `Registro expirado: o evento ocorrido em ${item.dataHoraDispositivo} ultrapassou o limite de 15 dias para sincronização offline.`,
          400,
          'SYNC_EXPIRED'
        );
      }

      // 2. Validação de Autorização da Turma
      await this.validateTurmaAccess(item.turmaId, user);

      // 3. Validação de integridade dos alunos da chamada
      const allAlunos = [...item.presentes, ...item.ausentes];
      await this.validateEnrolledStudents(item.turmaId, allAlunos);

      // 4. Idempotência e Unicidade por turmaId + data OU clientSyncId
      let existenteSnap = await firestore
        .collection('chamadas')
        .where('turmaId', '==', item.turmaId)
        .where('data', '==', item.data)
        .limit(1)
        .get();

      if (existenteSnap.empty && item.clientSyncId) {
        existenteSnap = await firestore
          .collection('chamadas')
          .where('clientSyncId', '==', item.clientSyncId)
          .limit(1)
          .get();
      }

      let ref: FirebaseFirestore.DocumentReference;
      if (!existenteSnap.empty) {
        ref = existenteSnap.docs[0].ref;
        duplicados++;
      } else {
        ref = firestore.collection('chamadas').doc();
        novos++;
      }

      // 5. Gravação segura (upsert)
      const payload = {
        id: ref.id,
        clientSyncId: item.clientSyncId,
        turmaId: item.turmaId,
        data: item.data,
        monitorId: user.uid,
        presentes: item.presentes,
        ausentes: item.ausentes,
        observacoes: item.observacoes || null,
        fechadaEm: item.dataHoraDispositivo,
        dataHoraDispositivo: item.dataHoraDispositivo,
        dataHoraServidor: agoraServidor,
        sincronizadoOffline: true,
      };

      await ref.set(payload, { merge: true });
      ids.push(ref.id);
    }

    return {
      processados: items.length,
      novos,
      duplicados,
      ids,
    };
  }

  async listChamadas(filters: { turmaId: string; dataInicio?: string; dataFim?: string }, user: UserPayload) {
    await this.validateTurmaAccess(filters.turmaId, user);

    let query: FirebaseFirestore.Query = firestore
      .collection('chamadas')
      .where('turmaId', '==', filters.turmaId);

    if (filters.dataInicio) {
      query = query.where('data', '>=', filters.dataInicio);
    }
    if (filters.dataFim) {
      query = query.where('data', '<=', filters.dataFim);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: d.id || doc.id,
        turmaId: d.turmaId,
        data: d.data || d.dataAula || '',
        monitorId: d.monitorId || user.uid,
        presentes: Array.isArray(d.presentes) ? d.presentes : (d.alunoId && d.presente ? [d.alunoId] : []),
        ausentes: Array.isArray(d.ausentes) ? d.ausentes : (d.alunoId && !d.presente ? [d.alunoId] : []),
        observacoes: d.observacoes || d.observacao || null,
        fechadaEm: d.fechadaEm || d.criadoEm || '',
        sincronizadoOffline: Boolean(d.sincronizadoOffline),
      };
    });
  }
}

export const chamadasService = new ChamadasService();
