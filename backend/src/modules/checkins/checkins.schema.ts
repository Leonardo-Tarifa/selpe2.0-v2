import { z } from 'zod';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createCheckinSchema = {
  body: z.object({
    localizacao: z.object({
      lat: z.number().min(-90).max(90, 'Latitude deve estar entre -90 e 90'),
      lng: z.number().min(-180).max(180, 'Longitude deve estar entre -180 e 180'),
      enderecoAproximado: z
        .string()
        .max(255, 'Endereço muito longo')
        .optional()
        .transform((v) => (v ? sanitizeText(v) : v)),
    }),
    observacoes: z
      .string()
      .max(1000, 'Observações devem ter no máximo 1000 caracteres')
      .optional()
      .transform((v) => (v ? sanitizeText(v) : v)),
  }),
  response: {
    201: z.object({
      id: z.string(),
      userId: z.string(),
      role: z.string(),
      localizacao: z.object({
        lat: z.number(),
        lng: z.number(),
        enderecoAproximado: z.string().nullable().optional(),
      }),
      observacoes: z.string().nullable().optional(),
      dataHoraDispositivo: z.string(),
      dataHoraServidor: z.string(),
      sincronizado: z.boolean(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const syncCheckinsSchema = {
  body: z.object({
    checkins: z
      .array(
        z.object({
          clientSyncId: z.string().min(8, 'ID de sincronização deve ter ao menos 8 caracteres').max(100),
          localizacao: z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            enderecoAproximado: z.string().max(255).optional(),
          }),
          observacoes: z.string().max(1000).optional(),
          dataHoraDispositivo: z.string().min(1, 'Data/hora do dispositivo obrigatória').max(50),
        })
      )
      .min(1, 'Envie ao menos um check-in para sincronizar')
      .max(100, 'Máximo de 100 check-ins por lote de sincronização'),
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
    500: standardErrorResponseSchema,
  },
};

export const listCheckinsSchema = {
  querystring: z.object({
    userId: z.string().max(100).optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        userId: z.string(),
        role: z.string(),
        localizacao: z.object({
          lat: z.number(),
          lng: z.number(),
          enderecoAproximado: z.string().nullable().optional(),
        }),
        observacoes: z.string().nullable().optional(),
        dataHoraDispositivo: z.string(),
        dataHoraServidor: z.string(),
        sincronizado: z.boolean(),
      })
    ),
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
