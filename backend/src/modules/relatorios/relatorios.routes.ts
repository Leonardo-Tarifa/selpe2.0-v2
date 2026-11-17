import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { relatoriosController } from './relatorios.controller.js';
import {
  getFrequenciaReportSchema,
  getFrequenciaPdfSchema,
  getQuantitativoReportSchema,
  getQuantitativoPdfSchema,
} from './relatorios.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function relatoriosRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Monitores, Coordenadores e Secretaria consultam métricas de frequência da sua alçada
  typed.get(
    '/frequencia',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Calcula o percentual de frequência e assiduidade dos atletas por turma e período (presets ou custom)',
        tags: ['Relatórios'],
        security: [{ bearerAuth: [] }],
        ...getFrequenciaReportSchema,
      },
    },
    relatoriosController.getFrequencia
  );

  // Download do PDF oficial padronizado com cabeçalho de Peruíbe e observações
  typed.get(
    '/frequencia/pdf',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Gera e faz o download do relatório oficial em PDF formatado para impressão',
        tags: ['Relatórios'],
        security: [{ bearerAuth: [] }],
        ...getFrequenciaPdfSchema,
      },
    },
    relatoriosController.getPdf
  );

  // Relatório Quantitativo Executivo Global (exclusivo Secretaria)
  typed.get(
    '/quantitativo',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria'])],
      schema: {
        description: 'Consolida métricas executivas globais de atletas, modalidades, ocupação de turmas e presenças',
        tags: ['Relatórios'],
        security: [{ bearerAuth: [] }],
        ...getQuantitativoReportSchema,
      },
    },
    relatoriosController.getQuantitativo
  );

  typed.get(
    '/quantitativo/pdf',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria'])],
      schema: {
        description: 'Gera e faz download do PDF executivo do relatório quantitativo global da Secretaria',
        tags: ['Relatórios'],
        security: [{ bearerAuth: [] }],
        ...getQuantitativoPdfSchema,
      },
    },
    relatoriosController.getQuantitativoPdf
  );
}
