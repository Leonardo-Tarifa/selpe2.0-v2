import { z } from 'zod';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createAssociacaoSchema = {
  body: z.object({
    nome: z.string().min(2, 'Nome da associação obrigatório').max(100, 'Nome muito longo').transform(sanitizeText),
    cnpj: z.string().min(14, 'CNPJ obrigatório').max(20, 'CNPJ inválido'),
    endereco: z.string().min(5, 'Endereço obrigatório').max(255, 'Endereço muito longo').transform(sanitizeText),
    ativo: z.boolean().default(true),
  }),
  response: {
    201: z.object({
      id: z.string(),
      nome: z.string(),
      cnpj: z.string(),
      endereco: z.string(),
      ativo: z.boolean(),
      criadoEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const listAssociacoesSchema = {
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        nome: z.string(),
        cnpj: z.string(),
        endereco: z.string(),
        ativo: z.boolean(),
        criadoEm: z.string().optional(),
      })
    ),
    500: standardErrorResponseSchema,
  },
};
