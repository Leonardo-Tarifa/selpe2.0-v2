import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { UserPayload } from '../../shared/types/user.js';

interface CreateModalidadeDTO {
  associacaoId: string;
  nome: string;
  coordenadorId: string;
  local: string;
}

export class ModalidadesService {
  async create(dto: CreateModalidadeDTO, requestingUser: UserPayload) {
    let targetAssociacaoId = dto.associacaoId;
    let targetCoordenadorId = dto.coordenadorId;

    // Multitenancy: Coordenador só cadastra modalidades vinculadas à sua própria associação
    if (requestingUser.role === 'coordenador') {
      targetAssociacaoId = requestingUser.associacaoId!;
      targetCoordenadorId = requestingUser.uid;
    } else {
      // Valida se a associação existe
      const assocDoc = await firestore.collection('associacoes').doc(targetAssociacaoId).get();
      if (!assocDoc.exists) {
        throw new AppError('Associação parceira informada não foi encontrada', 404, 'NOT_FOUND');
      }
    }

    const ref = firestore.collection('modalidades').doc();
    const payload = {
      id: ref.id,
      associacaoId: targetAssociacaoId,
      nome: dto.nome,
      coordenadorId: targetCoordenadorId,
      local: dto.local,
      criadoEm: getBrasiliaNow().toISOString(),
    };
    await ref.set(payload);
    return payload;
  }

  async list(associacaoId?: string) {
    let query: FirebaseFirestore.Query = firestore.collection('modalidades');
    if (associacaoId) {
      query = query.where('associacaoId', '==', associacaoId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as any);
  }
}

export const modalidadesService = new ModalidadesService();
