import { FastifyRequest, FastifyReply } from 'fastify';
import { relatoriosService } from './relatorios.service.js';
import { generateFrequenciaPdf } from './relatorios.pdf.js';

export class RelatoriosController {
  async getFrequencia(request: FastifyRequest, reply: FastifyReply) {
    const report = await relatoriosService.getFrequenciaReport(request.query as any, request.user);
    return reply.send(report);
  }

  async getPdf(request: FastifyRequest, reply: FastifyReply) {
    const report = await relatoriosService.getFrequenciaReport(request.query as any, request.user);

    const doc = generateFrequenciaPdf(report, request.user);

    reply.raw.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="relatorio-frequencia-${report.modalidadeNome}.pdf"`,
    });

    doc.pipe(reply.raw);
  }

  async getQuantitativo(request: FastifyRequest, reply: FastifyReply) {
    const report = await relatoriosService.getQuantitativoReport(request.user);
    return reply.send(report);
  }

  async getQuantitativoPdf(request: FastifyRequest, reply: FastifyReply) {
    const buffer = await relatoriosService.generateQuantitativoPDF(request.user);

    reply.raw.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="relatorio-quantitativo-selpe.pdf"',
    });

    reply.raw.end(buffer);
  }
}

export const relatoriosController = new RelatoriosController();
