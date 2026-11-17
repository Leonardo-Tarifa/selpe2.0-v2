import { z } from 'zod';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createChamadaSchema = {
  body: z.object({
    turmaId: z.string().min(1, 'Turma obrigatória').max(100),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser YYYY-MM-DD'),
    presentes: z.array(z.string().max(100)).max(200, 'Máximo de 200 alunos por chamada').default([]),
    ausentes: z.array(z.string().max(100)).max(200, 'Máximo de 200 alunos por chamada').default([]),
    observacoes: z
      .string()
      .max(1000, 'Observações devem ter no máximo 1000 caracteres')
      .optional()
      .transform((v) => (v ? sanitizeText(v) : v)),
  }),
  response: {
    201: z.object({
      id: z.string(),
      turmaId: z.string(),
      data: z.string(),
      monitorId: z.string(),
      presentes: z.array(z.string()),
      ausentes: z.array(z.string()),
      observacoes: z.string().nullable().optional(),
      fechadaEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const syncChamadasSchema = {
  body: z.object({
    chamadas: z
      .array(
        z.object({
          clientSyncId: z.string().min(8, 'ID de sincronização deve ter ao menos 8 caracteres').max(100),
          turmaId: z.string().min(1, 'Turma obrigatória').max(100),
          data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
          presentes: z.array(z.string().max(100)).max(200).default([]),
          ausentes: z.array(z.string().max(100)).max(200).default([]),
          observacoes: z
            .string()
            .max(1000)
            .optional()
            .transform((v) => (v ? sanitizeText(v) : v)),
          dataHoraDispositivo: z.string().min(1, 'Data/hora do dispositivo obrigatória').max(50),
        })
      )
      .min(1, 'Envie ao menos uma chamada para sincronizar')
      .max(100, 'Máximo de 100 chamadas por lote de sincronização'),
  }),
  response: {
    200: z.object({
      processados: z.number(),
      novos: z.number(),
      duplicados: z.number(),
      ids: z.array(z.string()),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const listChamadasSchema = {
  querystring: z.object({
    turmaId: z.string().min(1, 'Turma obrigatória').max(100),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        turmaId: z.string(),
        data: z.string(),
        monitorId: z.string(),
        presentes: z.array(z.string()),
        ausentes: z.array(z.string()),
        observacoes: z.string().nullable().optional(),
        fechadaEm: z.string().optional(),
        sincronizadoOffline: z.boolean().optional(),
      })
    ),
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
