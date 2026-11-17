import { firestore } from '../../shared/firebase/admin.js';
import { AppError } from '../../shared/errors/AppError.js';
import { getBrasiliaDateString, getBrasiliaNow } from '../../shared/utils/date.js';
import { resolvePeriodo, PeriodoPreset } from '../../shared/utils/periodo.js';
import { accessService } from '../../shared/services/access.service.js';
import { UserPayload } from '../../shared/types/user.js';
import { generateFrequenciaPdf, generateQuantitativoPdf } from './relatorios.pdf.js';

interface ReportFilters {
  turmaId: string;
  dataInicio?: string;
  dataFim?: string;
  periodoPreset?: PeriodoPreset;
  observacoes?: string;
}

export class RelatoriosService {
  async getFrequenciaReport(filters: ReportFilters, requestingUser: UserPayload) {
    // 1. Validação centralizada e rigorosa de acesso à turma (Monitor, Coordenador, Secretaria)
    const { turma } = await accessService.assertTurmaAccess(filters.turmaId, requestingUser);

    // 2. Obter modalidade
    const modalidadeDoc = await firestore.collection('modalidades').doc(turma.modalidadeId).get();
    const modalidade = modalidadeDoc.exists ? modalidadeDoc.data()! : {};

    // 3. Obter monitor
    let monitorNome = 'Não informado';
    if (turma.monitorId) {
      const monitorDoc = await firestore.collection('users').doc(turma.monitorId).get();
      if (monitorDoc.exists) {
        monitorNome = monitorDoc.data()?.nome || monitorNome;
      }
    }

    // 4. Resolver período de apuração
    const { dataInicio, dataFim, label: periodoLabel } = resolvePeriodo({
      periodoPreset: filters.periodoPreset,
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
    });

    // 5. Buscar chamadas no período
    let chamadasQuery: FirebaseFirestore.Query = firestore
      .collection('chamadas')
      .where('turmaId', '==', filters.turmaId)
      .where('data', '>=', dataInicio)
      .where('data', '<=', dataFim);

    const chamadasSnapshot = await chamadasQuery.get();
    const chamadas = chamadasSnapshot.docs.map((doc) => doc.data() as any);
    const totalAulas = chamadas.length;

    // 6. Buscar alunos matriculados ativos
    const matriculasSnap = await firestore
      .collection('matriculas')
      .where('turmaId', '==', filters.turmaId)
      .where('status', '==', 'ativo')
      .get();

    const alunosReport: any[] = [];
    let totalPresencasTurma = 0;

    for (const matDoc of matriculasSnap.docs) {
      const mat = matDoc.data();
      const alunoDoc = await firestore.collection('users').doc(mat.alunoId).get();
      const aluno = alunoDoc.exists ? alunoDoc.data()! : { nome: 'Aluno Desconhecido', numeroMatricula: '-' };

      let presencas = 0;
      let faltas = 0;

      for (const chamada of chamadas) {
        if (chamada.presentes && Array.isArray(chamada.presentes) && chamada.presentes.includes(mat.alunoId)) {
          presencas++;
        } else if (chamada.ausentes && Array.isArray(chamada.ausentes) && chamada.ausentes.includes(mat.alunoId)) {
          faltas++;
        }
      }

      totalPresencasTurma += presencas;

      const percentualFrequencia = totalAulas > 0
        ? Math.round(((presencas / totalAulas) * 100) * 10) / 10
        : 100;

      alunosReport.push({
        alunoId: mat.alunoId,
        nome: aluno.nome,
        numeroMatricula: aluno.numeroMatricula || 'SEM-MATRICULA',
        presencas,
        faltas,
        percentualFrequencia,
      });
    }

    // Ordenar alunos alfabeticamente
    alunosReport.sort((a, b) => a.nome.localeCompare(b.nome));

    const totalPossivel = alunosReport.length * totalAulas;
    const frequenciaGeralPercentual = totalPossivel > 0
      ? Math.round(((totalPresencasTurma / totalPossivel) * 100) * 10) / 10
      : 100;

    return {
      turmaId: filters.turmaId,
      modalidadeNome: modalidade.nome || 'Esporte Geral',
      local: modalidade.local || 'Polo Esportivo Municipal',
      monitorNome,
      periodo: {
        dataInicio,
        dataFim,
        label: periodoLabel,
      },
      observacoes: filters.observacoes || null,
      totalAulas,
      frequenciaGeralPercentual,
      alunos: alunosReport,
    };
  }

  /**
   * Gera documento PDF oficial timbrado da Prefeitura de Peruíbe / SELPE
   */
  async generateFrequenciaPDF(filters: ReportFilters, requestingUser: UserPayload): Promise<Buffer> {
    const data = await this.getFrequenciaReport(filters, requestingUser);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = generateFrequenciaPdf(data, requestingUser);
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });
  }

  /**
   * Consolida métricas executivas globais para a Secretaria de Esportes.
   */
  async getQuantitativoReport(requestingUser: UserPayload) {
    if (requestingUser.role !== 'secretaria') {
      throw new AppError(
        'Relatório quantitativo executivo restrito aos administradores da Secretaria de Esportes.',
        403,
        'FORBIDDEN'
      );
    }

    // 1. Alunos
    const alunosSnap = await firestore.collection('users').where('role', '==', 'aluno').get();
    let totalAlunosAtivos = 0;
    let totalAguardandoResponsavel = 0;

    for (const doc of alunosSnap.docs) {
      const status = doc.data().status;
      if (status === 'ativo') totalAlunosAtivos++;
      else if (status === 'aguardando_responsavel') totalAguardandoResponsavel++;
    }

    // 2. Turmas e Matrículas Ativas
    const turmasSnap = await firestore.collection('turmas').where('ativo', '==', true).get();
    const matriculasSnap = await firestore.collection('matriculas').where('status', '==', 'ativo').get();

    // 3. Chamadas e presenças no mês atual
    const now = getBrasiliaNow();
    const primeiroDiaMes = getBrasiliaDateString(new Date(now.getFullYear(), now.getMonth(), 1));
    const hojeStr = getBrasiliaDateString(now);

    const chamadasSnap = await firestore
      .collection('chamadas')
      .where('data', '>=', primeiroDiaMes)
      .where('data', '<=', hojeStr)
      .get();

    let totalPresencasMesAtual = 0;
    for (const doc of chamadasSnap.docs) {
      const presentes = doc.data().presentes;
      if (Array.isArray(presentes)) {
        totalPresencasMesAtual += presentes.length;
      }
    }

    // 4. Modalidades
    const modalidadesSnap = await firestore.collection('modalidades').get();
    const modalidadesReport: any[] = [];

    for (const modDoc of modalidadesSnap.docs) {
      const mod = modDoc.data();
      const turmasMod = turmasSnap.docs.filter((t) => t.data().modalidadeId === modDoc.id);
      const turmasIds = turmasMod.map((t) => t.id);

      const alunosMod = matriculasSnap.docs.filter((m) => turmasIds.includes(m.data().turmaId)).length;
      const capacidadeTotal = turmasMod.reduce((acc, t) => acc + (t.data().capacidadeMax || 30), 0);
      const taxaOcupacaoPercentual = capacidadeTotal > 0
        ? Math.round(((alunosMod / capacidadeTotal) * 100) * 10) / 10
        : 0;

      modalidadesReport.push({
        modalidadeId: modDoc.id,
        modalidadeNome: mod.nome || 'Modalidade',
        totalTurmas: turmasMod.length,
        totalAlunosMatriculados: alunosMod,
        capacidadeTotal,
        taxaOcupacaoPercentual,
      });
    }

    // 5. Associações
    const associacoesSnap = await firestore.collection('associacoes').get();
    const associacoesReport: any[] = [];

    for (const assocDoc of associacoesSnap.docs) {
      const assoc = assocDoc.data();
      const turmasAssoc = turmasSnap.docs.filter((t) => t.data().associacaoId === assocDoc.id);
      const turmasIds = turmasAssoc.map((t) => t.id);

      const alunosAssoc = matriculasSnap.docs.filter((m) => turmasIds.includes(m.data().turmaId)).length;
      const capacidadeTotal = turmasAssoc.reduce((acc, t) => acc + (t.data().capacidadeMax || 30), 0);
      const taxaOcupacaoPercentual = capacidadeTotal > 0
        ? Math.round(((alunosAssoc / capacidadeTotal) * 100) * 10) / 10
        : 0;

      associacoesReport.push({
        associacaoId: assocDoc.id,
        associacaoNome: assoc.nome || 'Associação',
        totalTurmas: turmasAssoc.length,
        totalAlunosMatriculados: alunosAssoc,
        capacidadeTotal,
        taxaOcupacaoPercentual,
      });
    }

    return {
      resumo: {
        totalAlunosGeral: alunosSnap.size,
        totalAlunosAtivos,
        totalAguardandoResponsavel,
        totalTurmasAtivas: turmasSnap.size,
        totalChamadasMesAtual: chamadasSnap.size,
        totalPresencasMesAtual,
      },
      modalidades: modalidadesReport,
      associacoes: associacoesReport,
      geradoEm: getBrasiliaNow().toISOString(),
    };
  }

  /**
   * Gera documento PDF executivo quantitativo para a Secretaria
   */
  async generateQuantitativoPDF(requestingUser: UserPayload): Promise<Buffer> {
    const data = await this.getQuantitativoReport(requestingUser);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = generateQuantitativoPdf(data, requestingUser);
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });
  }
}

export const relatoriosService = new RelatoriosService();
