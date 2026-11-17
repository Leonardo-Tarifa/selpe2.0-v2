import { z } from 'zod';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createModalidadeSchema = {
  body: z.object({
    associacaoId: z.string().max(100).optional(),
    nome: z.string().min(2, 'Nome da modalidade obrigatório').max(100, 'Nome muito longo').transform(sanitizeText),
    coordenadorId: z.string().max(100).optional(),
    local: z.string().max(255).optional().transform((v) => (v ? sanitizeText(v) : v)),
    descricao: z.string().optional(),
  }),
  response: {
    201: z.object({
      id: z.string(),
      associacaoId: z.string().optional().nullable(),
      nome: z.string(),
      coordenadorId: z.string().optional().nullable(),
      local: z.string().optional().nullable(),
      criadoEm: z.string().optional().nullable(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const listModalidadesSchema = {
  querystring: z.object({
    associacaoId: z.string().max(100).optional(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        nome: z.string(),
        associacaoId: z.string().optional().nullable(),
        coordenadorId: z.string().optional().nullable(),
        local: z.string().optional().nullable(),
        descricao: z.string().optional().nullable(),
        faixaEtariaMinima: z.number().optional().nullable(),
        faixaEtariaMaxima: z.number().optional().nullable(),
        ativo: z.boolean().optional().nullable(),
        criadoEm: z.string().optional().nullable(),
      })
    ),
    500: standardErrorResponseSchema,
  },
};

