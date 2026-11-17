import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { UserPayload } from '../../shared/types/user.js';

interface CreateTurmaDTO {
  modalidadeId: string;
  monitorId: string;
  diasSemana: string[];
  horarioInicio: string;
  horarioFim: string;
  capacidadeMax: number;
}

interface UpdateTurmaDTO {
  monitorId?: string;
  diasSemana?: string[];
  horarioInicio?: string;
  horarioFim?: string;
  capacidadeMax?: number;
  ativo?: boolean;
}

export class TurmasService {
  async create(dto: CreateTurmaDTO, requestingUser: UserPayload) {
    // 1. Validar se a modalidade existe
    const modalidadeDoc = await firestore.collection('modalidades').doc(dto.modalidadeId).get();
    if (!modalidadeDoc.exists) {
      throw new AppError('Modalidade informada não existe', 404, 'NOT_FOUND');
    }
    const modalidade = modalidadeDoc.data()!;

    // 2. Validar se o monitor existe
    const monitorDoc = await firestore.collection('users').doc(dto.monitorId).get();
    if (!monitorDoc.exists) {
      throw new AppError('Monitor informado não existe', 404, 'NOT_FOUND');
    }
    const monitor = monitorDoc.data()!;

    // 3. Multitenancy / Anti-IDOR: Coordenador só pode criar turmas da sua própria associação
    if (requestingUser.role === 'coordenador') {
      if (modalidade.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Acesso negado. A modalidade informada não pertence à sua associação.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
      if (monitor.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Acesso negado. O monitor atribuído não pertence à sua associação.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }
    }

    const ref = firestore.collection('turmas').doc();
    const payload = {
      id: ref.id,
      modalidadeId: dto.modalidadeId,
      monitorId: dto.monitorId,
      diasSemana: dto.diasSemana,
      horarioInicio: dto.horarioInicio,
      horarioFim: dto.horarioFim,
      capacidadeMax: dto.capacidadeMax,
      ativo: true,
      criadoEm: getBrasiliaNow().toISOString(),
    };

    await ref.set(payload);
    return payload;
  }

  async list(filters: { modalidadeId?: string; monitorId?: string }) {
    let query: FirebaseFirestore.Query = firestore.collection('turmas');

    if (filters.modalidadeId) {
      query = query.where('modalidadeId', '==', filters.modalidadeId);
    }
    if (filters.monitorId) {
      query = query.where('monitorId', '==', filters.monitorId);
    }

    const snapshot = await query.get();
    const turmas = snapshot.docs.map((doc) => doc.data() as any);

    // Contabiliza matriculados ativos em cada turma
    for (const turma of turmas) {
      const matriculas = await firestore
        .collection('matriculas')
        .where('turmaId', '==', turma.id)
        .where('status', '==', 'ativo')
        .get();
      turma.totalMatriculados = matriculas.size;
    }

    return turmas;
  }

  async getById(id: string) {
    const doc = await firestore.collection('turmas').doc(id).get();
    if (!doc.exists) {
      throw new AppError('Turma não encontrada', 404, 'NOT_FOUND');
    }
    return doc.data() as any;
  }

  async update(id: string, dto: UpdateTurmaDTO, requestingUser: UserPayload) {
    const turmaRef = firestore.collection('turmas').doc(id);
    const doc = await turmaRef.get();
    if (!doc.exists) {
      throw new AppError('Turma não encontrada', 404, 'NOT_FOUND');
    }
    const turma = doc.data()!;

    // Multitenancy: Coordenador só altera turmas de modalidades da sua associação
    if (requestingUser.role === 'coordenador') {
      const modalidadeDoc = await firestore.collection('modalidades').doc(turma.modalidadeId).get();
      if (modalidadeDoc.exists && modalidadeDoc.data()!.associacaoId !== requestingUser.associacaoId) {
        throw new AppError(
          'Acesso negado. Esta turma pertence a outra associação parceira.',
          403,
          'TENANT_ACCESS_DENIED'
        );
      }

      if (dto.monitorId) {
        const monitorDoc = await firestore.collection('users').doc(dto.monitorId).get();
        if (monitorDoc.exists && monitorDoc.data()!.associacaoId !== requestingUser.associacaoId) {
          throw new AppError(
            'Acesso negado. O novo monitor atribuído pertence a outra associação.',
            403,
            'TENANT_ACCESS_DENIED'
          );
        }
      }
    }

    const updates: Record<string, any> = {};
    if (dto.monitorId !== undefined) updates.monitorId = dto.monitorId;
    if (dto.diasSemana !== undefined) updates.diasSemana = dto.diasSemana;
    if (dto.horarioInicio !== undefined) updates.horarioInicio = dto.horarioInicio;
    if (dto.horarioFim !== undefined) updates.horarioFim = dto.horarioFim;
    if (dto.capacidadeMax !== undefined) updates.capacidadeMax = dto.capacidadeMax;
    if (dto.ativo !== undefined) updates.ativo = dto.ativo;

    if (Object.keys(updates).length > 0) {
      updates.atualizadoEm = getBrasiliaNow().toISOString();
      await turmaRef.update(updates);
    }

    return { ...turma, ...updates };
  }
}

export const turmasService = new TurmasService();
