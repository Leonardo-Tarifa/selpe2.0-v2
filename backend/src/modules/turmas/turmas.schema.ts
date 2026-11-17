import { z } from 'zod';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createTurmaSchema = {
  body: z.object({
    modalidadeId: z.string().min(1, 'Modalidade obrigatória').max(100),
    monitorId: z.string().min(1, 'Monitor responsável obrigatório').max(100),
    diasSemana: z
      .array(z.string().max(20))
      .min(1, 'Informe ao menos um dia da semana (ex: segunda, quarta)')
      .max(7, 'Máximo de 7 dias da semana permitidos'),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de horário deve ser HH:MM (ex: 08:00)'),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de horário deve ser HH:MM (ex: 09:30)'),
    capacidadeMax: z.number().int().positive('Capacidade deve ser positiva').max(500, 'Capacidade máxima de 500').default(30),
  }),
  response: {
    201: z.object({
      id: z.string(),
      modalidadeId: z.string(),
      monitorId: z.string(),
      diasSemana: z.array(z.string()),
      horarioInicio: z.string(),
      horarioFim: z.string(),
      capacidadeMax: z.number(),
      criadoEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const listTurmasSchema = {
  querystring: z.object({
    modalidadeId: z.string().max(100).optional(),
    monitorId: z.string().max(100).optional(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        modalidadeId: z.string(),
        monitorId: z.string(),
        diasSemana: z.array(z.string()),
        horarioInicio: z.string(),
        horarioFim: z.string(),
        capacidadeMax: z.number(),
        totalMatriculados: z.number().optional(),
        ativo: z.boolean().optional(),
        criadoEm: z.string().optional(),
      })
    ),
    500: standardErrorResponseSchema,
  },
};

export const getTurmaByIdSchema = {
  params: z.object({
    id: z.string().min(1).max(100),
  }),
  response: {
    200: z.object({
      id: z.string(),
      modalidadeId: z.string(),
      monitorId: z.string(),
      diasSemana: z.array(z.string()),
      horarioInicio: z.string(),
      horarioFim: z.string(),
      capacidadeMax: z.number(),
      ativo: z.boolean().optional(),
      criadoEm: z.string().optional(),
    }),
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const updateTurmaSchema = {
  params: z.object({
    id: z.string().min(1).max(100),
  }),
  body: z.object({
    monitorId: z.string().max(100).optional(),
    diasSemana: z.array(z.string().max(20)).max(7).optional(),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    capacidadeMax: z.number().int().positive().max(500).optional(),
    ativo: z.boolean().optional(),
  }),
  response: {
    200: z.object({
      id: z.string(),
      modalidadeId: z.string(),
      monitorId: z.string(),
      diasSemana: z.array(z.string()),
      horarioInicio: z.string(),
      horarioFim: z.string(),
      capacidadeMax: z.number(),
      ativo: z.boolean().optional(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
