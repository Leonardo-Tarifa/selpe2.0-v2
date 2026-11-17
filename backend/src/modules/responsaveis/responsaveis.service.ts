import crypto from 'node:crypto';
import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaNow } from '../../shared/utils/date.js';
import { generateCarteirinhaHash } from '../../shared/utils/crypto.js';

interface ConfirmarDTO {
  token: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefoneResponsavel: string;
  parentesco: 'mae' | 'pai' | 'tutor_legal' | 'outro';
  termoAceito: true;
}

export class ResponsaveisService {
  /**
   * Consulta pública sanitizada dos dados do menor para o responsável confirmar.
   */
  async getConvite(tokenRaw: string) {
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const solicitacaoDoc = await firestore.collection('solicitacoes_menores').doc(tokenHash).get();

    if (!solicitacaoDoc.exists) {
      throw new AppError('Link de confirmação inválido ou não encontrado', 404, 'NOT_FOUND');
    }

    const data = solicitacaoDoc.data()!;

    if (data.status !== 'pendente') {
      throw new AppError('Este link de confirmação já foi utilizado anteriormente', 400, 'ALREADY_USED');
    }

    const agora = new Date();
    if (new Date(data.expiraEm) < agora) {
      throw new AppError('Este link de confirmação expirou. Solicite a realização de um novo cadastro.', 400, 'EXPIRED_TOKEN');
    }

    const parts = (data.alunoNome || '').trim().split(/\s+/);
    const alunoPrimeiroNome = parts[0] || 'Aluno';
    const alunoNomeSanitizado = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

    return {
      alunoNome: alunoNomeSanitizado,
      alunoPrimeiroNome,
      modalidadeNome: data.modalidadeNome || 'Esporte Geral',
      poloNome: data.poloNome || 'Polo SELPE',
      diasSemana: data.diasSemana || [],
      horarioInicio: data.horarioInicio || '08:00',
      horarioFim: data.horarioFim || '09:00',
      status: data.status,
      expiraEm: data.expiraEm,
    };
  }

  /**
   * Valida os dados do responsável e ativa definitivamente o aluno e sua matrícula.
   */
  async confirmar(dto: ConfirmarDTO, clientIp: string) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const solicitacaoRef = firestore.collection('solicitacoes_menores').doc(tokenHash);
    const solicitacaoDoc = await solicitacaoRef.get();

    if (!solicitacaoDoc.exists) {
      throw new AppError('Link de confirmação inválido ou não encontrado', 404, 'NOT_FOUND');
    }

    const solicitacao = solicitacaoDoc.data()!;

    if (solicitacao.status !== 'pendente') {
      throw new AppError('Este link de confirmação já foi utilizado anteriormente', 400, 'ALREADY_USED');
    }

    const agoraDate = new Date();
    if (new Date(solicitacao.expiraEm) < agoraDate) {
      throw new AppError('Este link de confirmação expirou. É necessário realizar um novo cadastro.', 400, 'EXPIRED_TOKEN');
    }

    if (dto.cpfResponsavel === solicitacao.alunoCpf) {
      throw new AppError('O CPF do responsável legal não pode ser idêntico ao CPF do menor', 400, 'INVALID_RESPONSAVEL_CPF');
    }

    const agora = getBrasiliaNow().toISOString();
    const alunoRef = firestore.collection('users').doc(solicitacao.alunoId);

    // Executa a confirmação em transação para garantir integridade atômica
    const result = await firestore.runTransaction(async (transaction) => {
      // 1. Executa todas as leituras da transação primeiro
      const alunoDoc = await transaction.get(alunoRef);
      if (!alunoDoc.exists) {
        throw new AppError('Cadastro do aluno não foi localizado', 404, 'NOT_FOUND');
      }

      const matriculasSnap = await transaction.get(
        firestore
          .collection('matriculas')
          .where('alunoId', '==', solicitacao.alunoId)
          .where('status', '==', 'pendente_responsavel')
      );

      const alunoData = alunoDoc.data()!;

      // 2. Executa as escritas na sequência
      transaction.update(alunoRef, {
        status: 'ativo',
        nomeResponsavel: dto.nomeResponsavel,
        cpfResponsavel: dto.cpfResponsavel,
        telefoneResponsavel: dto.telefoneResponsavel,
        telefoneEmergencia: dto.telefoneResponsavel,
        parentescoResponsavel: dto.parentesco,
        confirmadoEm: agora,
      });

      for (const doc of matriculasSnap.docs) {
        transaction.update(doc.ref, {
          status: 'ativo',
          confirmadoEm: agora,
        });
      }

      transaction.update(solicitacaoRef, {
        status: 'confirmado',
        utilizadoEm: agora,
        responsavelCpf: dto.cpfResponsavel,
        responsavelNome: dto.nomeResponsavel,
        ipConfirmacao: clientIp,
      });

      // 4. Registro de auditoria LGPD
      const auditRef = firestore.collection('audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        acao: 'CONFIRMACAO_RESPONSAVEL_MENOR',
        alunoId: solicitacao.alunoId,
        cpfAluno: solicitacao.alunoCpf,
        cpfResponsavel: dto.cpfResponsavel,
        nomeResponsavel: dto.nomeResponsavel,
        parentesco: dto.parentesco,
        timestamp: agora,
        ip: clientIp,
      });

      return {
        alunoId: solicitacao.alunoId,
        numeroMatricula: alunoData.numeroMatricula,
        nome: alunoData.nome,
        fotoUrl: alunoData.fotoUrl || null,
        associacaoId: alunoData.associacaoId || 'assoc-centro',
      };
    });

    const qrValidationHash = generateCarteirinhaHash(
      result.alunoId,
      result.numeroMatricula,
      result.associacaoId
    );

    const carteirinha = {
      numeroMatricula: result.numeroMatricula,
      nome: result.nome,
      fotoUrl: result.fotoUrl,
      modalidadeNome: solicitacao.modalidadeNome || 'Esporte Geral',
      diasSemana: solicitacao.diasSemana || [],
      horarioInicio: solicitacao.horarioInicio || '08:00',
      horarioFim: solicitacao.horarioFim || '09:00',
      telefoneEmergencia: dto.telefoneResponsavel,
      qrValidationHash,
    };

    return {
      message: 'Inscrição e matrícula do menor confirmadas com sucesso pelo responsável!',
      alunoId: result.alunoId,
      numeroMatricula: result.numeroMatricula,
      carteirinha,
    };
  }
}

export const responsaveisService = new ResponsaveisService();
