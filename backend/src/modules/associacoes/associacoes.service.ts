import { firestore } from '../../shared/firebase/admin.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';

interface CreateAssociacaoDTO {
  nome: string;
  cnpj: string;
  endereco: string;
  ativo?: boolean;
}

export class AssociacoesService {
  async create(dto: CreateAssociacaoDTO) {
    const ref = firestore.collection('associacoes').doc();
    const payload = {
      id: ref.id,
      nome: dto.nome,
      cnpj: dto.cnpj,
      endereco: dto.endereco,
      ativo: dto.ativo ?? true,
      criadoEm: getBrasiliaNow().toISOString(),
    };
    await ref.set(payload);
    return payload;
  }

  async list() {
    const snapshot = await firestore.collection('associacoes').get();
    return snapshot.docs.map((doc) => doc.data() as any);
  }
}

export const associacoesService = new AssociacoesService();
