import { z } from 'zod';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const getFrequenciaReportSchema = {
  querystring: z.object({
    turmaId: z.string().min(1, 'Turma obrigatória').max(100),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial deve ser YYYY-MM-DD').optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final deve ser YYYY-MM-DD').optional(),
    periodoPreset: z.enum(['diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual']).optional(),
    observacoes: z.string().max(1000).optional(),
  }),
  response: {
    200: z.object({
      turmaId: z.string(),
      modalidadeNome: z.string(),
      local: z.string(),
      monitorNome: z.string(),
      periodo: z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
        label: z.string().optional(),
      }),
      observacoes: z.string().nullable().optional(),
      totalAulas: z.number(),
      frequenciaGeralPercentual: z.number(),
      alunos: z.array(
        z.object({
          alunoId: z.string(),
          nome: z.string(),
          numeroMatricula: z.string(),
          presencas: z.number(),
          faltas: z.number(),
          percentualFrequencia: z.number(),
        })
      ),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const getFrequenciaPdfSchema = {
  querystring: z.object({
    turmaId: z.string().min(1, 'Turma obrigatória').max(100),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial deve ser YYYY-MM-DD').optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final deve ser YYYY-MM-DD').optional(),
    periodoPreset: z.enum(['diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual']).optional(),
    observacoes: z.string().max(1000).optional(),
  }),
  response: {
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const getQuantitativoReportSchema = {
  response: {
    200: z.object({
      resumo: z.object({
        totalAlunosGeral: z.number(),
        totalAlunosAtivos: z.number(),
        totalAguardandoResponsavel: z.number(),
        totalTurmasAtivas: z.number(),
        totalChamadasMesAtual: z.number(),
        totalPresencasMesAtual: z.number(),
      }),
      modalidades: z.array(
        z.object({
          modalidadeId: z.string(),
          modalidadeNome: z.string(),
          totalTurmas: z.number(),
          totalAlunosMatriculados: z.number(),
          capacidadeTotal: z.number(),
          taxaOcupacaoPercentual: z.number(),
        })
      ),
      associacoes: z.array(
        z.object({
          associacaoId: z.string(),
          associacaoNome: z.string(),
          totalTurmas: z.number(),
          totalAlunosMatriculados: z.number(),
          capacidadeTotal: z.number(),
          taxaOcupacaoPercentual: z.number(),
        })
      ),
      geradoEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const getQuantitativoPdfSchema = {
  response: {
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
