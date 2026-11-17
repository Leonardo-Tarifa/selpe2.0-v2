import PDFDocument from 'pdfkit';
import { formatBrasiliaDateTime, getBrasiliaNow } from '../../shared/utils/date.js';
import { UserPayload } from '../../shared/types/user.js';

interface ReportData {
  turmaId: string;
  modalidadeNome: string;
  local: string;
  monitorNome: string;
  periodo: {
    dataInicio: string;
    dataFim: string;
    label?: string;
  };
  observacoes?: string | null;
  totalAulas: number;
  frequenciaGeralPercentual: number;
  alunos: Array<{
    alunoId: string;
    nome: string;
    numeroMatricula: string;
    presencas: number;
    faltas: number;
    percentualFrequencia: number;
  }>;
}

export function generateFrequenciaPdf(data: ReportData, requestingUser?: UserPayload): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    info: {
      Title: `Relatorio_Frequencia_${data.modalidadeNome}_${data.periodo.dataInicio}_a_${data.periodo.dataFim}`,
      Author: 'SELPE - Secretaria de Esportes e Lazer de Peruíbe',
    },
  });

  // Cores do tema oficial
  const primaryColor = '#0F294A';
  const secondaryColor = '#2563EB';
  const textColor = '#1E293B';
  const mutedText = '#64748B';
  const tableHeaderBg = '#F1F5F9';
  const rowAltBg = '#F8FAFC';

  // Cabeçalho Municipal
  doc.rect(40, 40, doc.page.width - 80, 4).fill(secondaryColor);
  doc.moveDown(0.8);

  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('PREFEITURA MUNICIPAL DA ESTÂNCIA BALNEÁRIA DE PERUÍBE', { align: 'center' });

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text('SECRETARIA MUNICIPAL DE ESPORTES E LAZER - SELPE', { align: 'center' });

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .moveDown(0.5)
    .text('RELATÓRIO OFICIAL DE FREQUÊNCIA E ASSIDUIDADE DE TURMA', { align: 'center' });

  doc.moveDown(0.8);

  // Caixa de Informações Gerais
  const boxTop = doc.y;
  doc
    .rect(40, boxTop, doc.page.width - 80, 60)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc.fillColor(textColor).fontSize(9);
  const col1 = 50;
  const col2 = 230;
  const col3 = 400;

  doc.font('Helvetica-Bold').text('Modalidade:', col1, boxTop + 10);
  doc.font('Helvetica').text(data.modalidadeNome, col1 + 65, boxTop + 10);

  doc.font('Helvetica-Bold').text('Polo / Local:', col1, boxTop + 26);
  doc.font('Helvetica').text(data.local, col1 + 65, boxTop + 26);

  doc.font('Helvetica-Bold').text('Monitor:', col2, boxTop + 10);
  doc.font('Helvetica').text(data.monitorNome, col2 + 50, boxTop + 10);

  doc.font('Helvetica-Bold').text('Período:', col2, boxTop + 26);
  doc.font('Helvetica').text(data.periodo.label || `${data.periodo.dataInicio} a ${data.periodo.dataFim}`, col2 + 50, boxTop + 26);

  doc.font('Helvetica-Bold').text('Total de Aulas:', col3, boxTop + 10);
  doc.font('Helvetica').text(String(data.totalAulas), col3 + 75, boxTop + 10);

  doc.font('Helvetica-Bold').text('Assiduidade Geral:', col3, boxTop + 26);
  doc.font('Helvetica-Bold').fillColor(primaryColor).text(`${data.frequenciaGeralPercentual}%`, col3 + 95, boxTop + 26);

  doc.y = boxTop + 75;

  // Tabela de Alunos
  const tableTop = doc.y;
  const colMatricula = 50;
  const colNome = 150;
  const colPresencas = 370;
  const colFaltas = 440;
  const colPercent = 500;

  // Cabeçalho da Tabela
  doc
    .rect(40, tableTop, doc.page.width - 80, 22)
    .fill(tableHeaderBg);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(primaryColor);

  doc.text('Matrícula', colMatricula, tableTop + 6);
  doc.text('Nome do Aluno', colNome, tableTop + 6);
  doc.text('Presenças', colPresencas, tableTop + 6);
  doc.text('Faltas', colFaltas, tableTop + 6);
  doc.text('Assiduidade', colPercent, tableTop + 6);

  let currentY = tableTop + 22;

  data.alunos.forEach((aluno, index) => {
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 40;
    }

    if (index % 2 === 1) {
      doc.rect(40, currentY, doc.page.width - 80, 20).fill(rowAltBg);
    }

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(textColor);

    doc.text(aluno.numeroMatricula, colMatricula, currentY + 5);
    doc.text(aluno.nome.length > 35 ? aluno.nome.slice(0, 32) + '...' : aluno.nome, colNome, currentY + 5);
    doc.text(String(aluno.presencas), colPresencas + 10, currentY + 5);
    doc.text(String(aluno.faltas), colFaltas + 8, currentY + 5);

    const pctColor = aluno.percentualFrequencia >= 75 ? '#16A34A' : '#DC2626';
    doc.font('Helvetica-Bold').fillColor(pctColor).text(`${aluno.percentualFrequencia}%`, colPercent + 5, currentY + 5);

    currentY += 20;
  });

  // Seção de Observações / Ocorrências Pedagógicas
  currentY += 15;
  if (currentY > doc.page.height - 140) {
    doc.addPage();
    currentY = 40;
  }

  doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text('Observações Gerais / Ocorrências Pedagógicas:', 40, currentY);
  currentY += 16;

  if (data.observacoes && data.observacoes.trim().length > 0) {
    doc.font('Helvetica').fontSize(9).fillColor(textColor).text(data.observacoes, 40, currentY, {
      width: doc.page.width - 80,
    });
    currentY = doc.y + 15;
  } else {
    // Campo pautado para anotações manuais
    doc.lineWidth(0.5).strokeColor('#CBD5E1');
    doc.moveTo(40, currentY + 12).lineTo(doc.page.width - 40, currentY + 12).stroke();
    doc.moveTo(40, currentY + 28).lineTo(doc.page.width - 40, currentY + 28).stroke();
    currentY += 38;
  }

  // Linhas de Assinatura no final da página
  if (currentY > doc.page.height - 110) {
    doc.addPage();
    currentY = 40;
  }

  const sigY = Math.max(currentY + 20, doc.page.height - 90);

  doc.lineWidth(0.8).strokeColor('#94A3B8');

  const sigWidth = 140;
  const sig1 = 50;
  const sig2 = 225;
  const sig3 = 400;

  doc.moveTo(sig1, sigY).lineTo(sig1 + sigWidth, sigY).stroke();
  doc.moveTo(sig2, sigY).lineTo(sig2 + sigWidth, sigY).stroke();
  doc.moveTo(sig3, sigY).lineTo(sig3 + sigWidth, sigY).stroke();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(mutedText);

  doc.text('Monitor Responsável', sig1, sigY + 5, { width: sigWidth, align: 'center' });
  doc.text('Coordenador Técnico', sig2, sigY + 5, { width: sigWidth, align: 'center' });
  doc.text('Secretaria de Esportes', sig3, sigY + 5, { width: sigWidth, align: 'center' });

  // Rodapé com emissor e data/hora oficial de Brasília
  const emissorTexto = requestingUser
    ? `Emitido por: ${requestingUser.nome} (${requestingUser.role.toUpperCase()}) | `
    : '';

  doc
    .fontSize(7.5)
    .fillColor(mutedText)
    .text(
      `${emissorTexto}Documento emitido eletronicamente pelo SELPE em ${formatBrasiliaDateTime()} (Horário Oficial de Brasília)`,
      40,
      doc.page.height - 25,
      { align: 'center', width: doc.page.width - 80 }
    );

  doc.end();
  return doc;
}

export function generateQuantitativoPdf(data: any, requestingUser: UserPayload): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    info: {
      Title: 'Relatorio_Quantitativo_Geral_SELPE',
      Author: 'SELPE - Secretaria de Esportes e Lazer de Peruíbe',
    },
  });

  const primaryColor = '#0F294A';
  const secondaryColor = '#2563EB';
  const textColor = '#1E293B';
  const mutedText = '#64748B';
  const tableHeaderBg = '#F1F5F9';
  const rowAltBg = '#F8FAFC';

  // Cabeçalho Oficial
  doc.rect(40, 40, doc.page.width - 80, 4).fill(secondaryColor);
  doc.moveDown(0.8);

  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('PREFEITURA MUNICIPAL DA ESTÂNCIA BALNEÁRIA DE PERUÍBE', { align: 'center' });

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text('SECRETARIA MUNICIPAL DE ESPORTES E LAZER - SELPE', { align: 'center' });

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(textColor)
    .moveDown(0.5)
    .text('RELATÓRIO QUANTITATIVO EXECUTIVO - GESTÃO ESPORTIVA', { align: 'center' });

  doc.moveDown(1);

  // Painel de Indicadores Gerais
  const boxTop = doc.y;
  doc.rect(40, boxTop, doc.page.width - 80, 50).fillAndStroke('#F8FAFC', '#E2E8F0');

  doc.fillColor(textColor).fontSize(9);
  doc.font('Helvetica-Bold').text('Total de Alunos:', 50, boxTop + 10);
  doc.font('Helvetica').text(`${data.resumo.totalAlunosGeral} (${data.resumo.totalAlunosAtivos} ativos, ${data.resumo.totalAguardandoResponsavel} pendentes)`, 140, boxTop + 10);

  doc.font('Helvetica-Bold').text('Turmas Ativas:', 50, boxTop + 26);
  doc.font('Helvetica').text(String(data.resumo.totalTurmasAtivas), 140, boxTop + 26);

  doc.font('Helvetica-Bold').text('Atendimentos no Mês:', 320, boxTop + 10);
  doc.font('Helvetica').text(String(data.resumo.totalPresencasMesAtual), 430, boxTop + 10);

  doc.font('Helvetica-Bold').text('Chamadas Registradas:', 320, boxTop + 26);
  doc.font('Helvetica').text(String(data.resumo.totalChamadasMesAtual), 430, boxTop + 26);

  doc.y = boxTop + 65;

  // Tabela por Modalidade
  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('Distribuição por Modalidade Esportiva:');
  doc.moveDown(0.4);

  let currentY = doc.y;
  doc.rect(40, currentY, doc.page.width - 80, 20).fill(tableHeaderBg);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryColor);
  doc.text('Modalidade', 50, currentY + 5);
  doc.text('Turmas', 250, currentY + 5);
  doc.text('Matriculados', 320, currentY + 5);
  doc.text('Capacidade', 400, currentY + 5);
  doc.text('Ocupação', 480, currentY + 5);

  currentY += 20;

  data.modalidades.forEach((mod: any, index: number) => {
    if (index % 2 === 1) doc.rect(40, currentY, doc.page.width - 80, 18).fill(rowAltBg);
    doc.font('Helvetica').fontSize(8).fillColor(textColor);
    doc.text(mod.modalidadeNome, 50, currentY + 5);
    doc.text(String(mod.totalTurmas), 250, currentY + 5);
    doc.text(String(mod.totalAlunosMatriculados), 320, currentY + 5);
    doc.text(String(mod.capacidadeTotal), 400, currentY + 5);
    doc.font('Helvetica-Bold').text(`${mod.taxaOcupacaoPercentual}%`, 480, currentY + 5);
    currentY += 18;
  });

  // Tabela por Associação / Polo
  currentY += 15;
  if (currentY > doc.page.height - 180) {
    doc.addPage();
    currentY = 40;
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('Distribuição por Associação e Polo:', 40, currentY);
  currentY += 18;

  doc.rect(40, currentY, doc.page.width - 80, 20).fill(tableHeaderBg);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryColor);
  doc.text('Associação / Polo', 50, currentY + 5);
  doc.text('Turmas', 250, currentY + 5);
  doc.text('Matriculados', 320, currentY + 5);
  doc.text('Capacidade', 400, currentY + 5);
  doc.text('Ocupação', 480, currentY + 5);

  currentY += 20;

  data.associacoes.forEach((assoc: any, index: number) => {
    if (index % 2 === 1) doc.rect(40, currentY, doc.page.width - 80, 18).fill(rowAltBg);
    doc.font('Helvetica').fontSize(8).fillColor(textColor);
    doc.text(assoc.associacaoNome, 50, currentY + 5);
    doc.text(String(assoc.totalTurmas), 250, currentY + 5);
    doc.text(String(assoc.totalAlunosMatriculados), 320, currentY + 5);
    doc.text(String(assoc.capacidadeTotal), 400, currentY + 5);
    doc.font('Helvetica-Bold').text(`${assoc.taxaOcupacaoPercentual}%`, 480, currentY + 5);
    currentY += 18;
  });

  // Rodapé
  doc
    .fontSize(7.5)
    .fillColor(mutedText)
    .text(
      `Emitido por: ${requestingUser.nome} (SECRETARIA) | SELPE em ${formatBrasiliaDateTime()} (Horário Oficial de Brasília)`,
      40,
      doc.page.height - 25,
      { align: 'center', width: doc.page.width - 80 }
    );

  doc.end();
  return doc;
}
