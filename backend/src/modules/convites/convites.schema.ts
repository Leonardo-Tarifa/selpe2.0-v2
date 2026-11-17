import { z } from 'zod';
import { isValidCPF, cleanCPF } from '../../shared/utils/cpf.js';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createConviteSchema = {
  body: z.object({
    role: z.enum(['coordenador', 'monitor', 'secretaria'], {
      errorMap: () => ({ message: 'Papel do convite inválido (deve ser coordenador, monitor ou secretaria)' }),
    }),
    associacaoId: z.string().min(1, 'Associação obrigatória').max(100),
    modalidadesIds: z.array(z.string()).default([]),
    observacoes: z.string().max(500).optional().transform((v) => (v ? sanitizeText(v) : v)),
  }),
  response: {
    201: z.object({
      token: z.string(),
      linkConvite: z.string(),
      role: z.enum(['coordenador', 'monitor', 'secretaria']),
      associacaoId: z.string(),
      modalidadesIds: z.array(z.string()),
      expiraEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const getConviteSchema = {
  params: z.object({
    token: z.string().min(10, 'Token inválido').max(128),
  }),
  response: {
    200: z.object({
      role: z.enum(['coordenador', 'monitor', 'secretaria']),
      associacaoId: z.string(),
      associacaoNome: z.string(),
      modalidades: z.array(
        z.object({
          id: z.string(),
          nome: z.string(),
        })
      ),
      expiraEm: z.string(),
      status: z.string(),
    }),
    400: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const aceitarConviteSchema = {
  params: z.object({
    token: z.string().min(10, 'Token inválido').max(128),
  }),
  body: z.object({
    nome: z
      .string()
      .min(3, 'Nome completo obrigatório')
      .max(100, 'Nome muito longo')
      .transform(sanitizeText),
    cpf: z
      .string()
      .max(20)
      .refine((v) => isValidCPF(v), { message: 'CPF inválido' })
      .transform((v) => cleanCPF(v)),
    email: z.string().email('E-mail inválido').max(100),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128),
    telefone: z.string().min(8, 'Telefone obrigatório').max(20),
    endereco: z
      .string()
      .min(5, 'Endereço obrigatório')
      .max(255)
      .transform(sanitizeText),
    fotoUrl: z.string().url('URL da foto inválida').optional(),
  }),
  response: {
    201: z.object({
      token: z.string(),
      user: z.object({
        uid: z.string(),
        nome: z.string(),
        role: z.enum(['coordenador', 'monitor', 'secretaria']),
        cpf: z.string(),
        email: z.string(),
        associacaoId: z.string().optional().nullable(),
      }),
    }),
    400: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    409: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
