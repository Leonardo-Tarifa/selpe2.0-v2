import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { UserPayload } from '../../shared/types/user.js';

interface CreateCheckinDTO {
  localizacao: {
    lat: number;
    lng: number;
    enderecoAproximado?: string;
  };
  observacoes?: string;
}

interface SyncCheckinDTO {
  clientSyncId: string;
  localizacao: {
    lat: number;
    lng: number;
    enderecoAproximado?: string;
  };
  observacoes?: string;
  dataHoraDispositivo: string;
}

export class CheckinsService {
  private validateCoordinates(lat: number, lng: number) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new AppError(
        'Coordenadas geográficas inválidas. Latitude deve estar entre -90 e 90, e Longitude entre -180 e 180.',
        400,
        'INVALID_COORDINATES'
      );
    }
  }

  async createCheckin(dto: CreateCheckinDTO, user: UserPayload) {
    this.validateCoordinates(dto.localizacao.lat, dto.localizacao.lng);

    const agora = getBrasiliaNow().toISOString();
    const ref = firestore.collection('checkins_profissionais').doc();

    const payload = {
      id: ref.id,
      userId: user.uid,
      role: user.role,
      associacaoId: user.associacaoId || null,
      localizacao: {
        lat: dto.localizacao.lat,
        lng: dto.localizacao.lng,
        enderecoAproximado: dto.localizacao.enderecoAproximado || null,
      },
      observacoes: dto.observacoes || null,
      dataHoraDispositivo: agora,
      dataHoraServidor: agora,
      sincronizado: true,
    };

    await ref.set(payload);
    return payload;
  }

  async syncBatch(items: SyncCheckinDTO[], user: UserPayload) {
    let novos = 0;
    let duplicados = 0;
    const ids: string[] = [];
    const agoraServidor = getBrasiliaNow().toISOString();
    const agoraMs = Date.now();
    const toleranciaMs = 5 * 60 * 1000;
    const limiteIdadeMs = 15 * 24 * 60 * 60 * 1000;

    for (const item of items) {
      this.validateCoordinates(item.localizacao.lat, item.localizacao.lng);

      const dispTime = new Date(item.dataHoraDispositivo).getTime();
      if (isNaN(dispTime)) {
        throw new AppError(
          `Formato inválido de dataHoraDispositivo no check-in ${item.clientSyncId}.`,
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
          `Check-in expirado: o registro realizado em ${item.dataHoraDispositivo} ultrapassou o limite de 15 dias para sincronização offline.`,
          400,
          'SYNC_EXPIRED'
        );
      }

      // Idempotência por clientSyncId
      const existente = await firestore
        .collection('checkins_profissionais')
        .where('clientSyncId', '==', item.clientSyncId)
        .limit(1)
        .get();

      if (!existente.empty) {
        duplicados++;
        ids.push(existente.docs[0].id);
        continue;
      }

      const ref = firestore.collection('checkins_profissionais').doc();
      const payload = {
        id: ref.id,
        clientSyncId: item.clientSyncId,
        userId: user.uid,
        role: user.role,
        associacaoId: user.associacaoId || null,
        localizacao: {
          lat: item.localizacao.lat,
          lng: item.localizacao.lng,
          enderecoAproximado: item.localizacao.enderecoAproximado || null,
        },
        observacoes: item.observacoes || null,
        dataHoraDispositivo: item.dataHoraDispositivo,
        dataHoraServidor: agoraServidor,
        sincronizado: true,
      };

      await ref.set(payload);
      novos++;
      ids.push(ref.id);
    }

    return {
      processados: items.length,
      novos,
      duplicados,
      ids,
    };
  }

  async listCheckins(filters: { userId?: string; dataInicio?: string; dataFim?: string }, user: UserPayload) {
    let targetUserId = filters.userId;

    // Se for monitor, só pode ver seu próprio histórico de check-ins
    if (user.role === 'monitor') {
      targetUserId = user.uid;
    }

    // Se for coordenador, restringe para a sua associação
    if (user.role === 'coordenador') {
      if (targetUserId) {
        const targetUserDoc = await firestore.collection('users').doc(targetUserId).get();
        if (targetUserDoc.exists && targetUserDoc.data()!.associacaoId !== user.associacaoId) {
          throw new AppError(
            'Acesso negado. Este profissional pertence a outra associação parceira.',
            403,
            'TENANT_ACCESS_DENIED'
          );
        }
      }
    }

    let query: FirebaseFirestore.Query = firestore.collection('checkins_profissionais');

    if (targetUserId) {
      query = query.where('userId', '==', targetUserId);
    } else if (user.role === 'coordenador' && user.associacaoId) {
      query = query.where('associacaoId', '==', user.associacaoId);
    }

    if (filters.dataInicio) {
      query = query.where('dataHoraServidor', '>=', filters.dataInicio);
    }
    if (filters.dataFim) {
      query = query.where('dataHoraServidor', '<=', filters.dataFim);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as any);
  }
}

export const checkinsService = new CheckinsService();
