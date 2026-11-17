import { z } from 'zod';
import { isValidCPF, cleanCPF } from '../../shared/utils/cpf.js';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createUserSchema = {
  body: z.object({
    nome: z
      .string()
      .min(3, 'Nome obrigatório')
      .max(100, 'Nome muito longo')
      .transform(sanitizeText),
    cpf: z
      .string()
      .max(20)
      .refine((val) => isValidCPF(val), { message: 'CPF inválido' })
      .transform((val) => cleanCPF(val)),
    email: z.string().email('E-mail inválido').max(100, 'E-mail muito longo'),
    password: z.string().min(6, 'Senha mínima de 6 caracteres').max(128, 'Senha muito longa'),
    telefone: z.string().min(8, 'Telefone obrigatório').max(20, 'Telefone inválido'),
    role: z.enum(['monitor', 'coordenador', 'secretaria']),
    associacaoId: z.string().max(100).optional(),
    endereco: z
      .string()
      .max(255, 'Endereço muito longo')
      .optional()
      .transform((v) => (v ? sanitizeText(v) : v)),
  }),
  response: {
    201: z.object({
      uid: z.string(),
      nome: z.string(),
      role: z.enum(['monitor', 'coordenador', 'secretaria']),
      cpf: z.string(),
      email: z.string(),
      associacaoId: z.string().optional(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    409: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const updateUserSchema = {
  params: z.object({
    id: z.string().min(1).max(100),
  }),
  body: z.object({
    nome: z.string().min(3).max(100).optional().transform((v) => (v ? sanitizeText(v) : v)),
    email: z.string().email().max(100).optional(),
    telefone: z.string().min(8).max(20).optional(),
    endereco: z.string().max(255).optional().transform((v) => (v ? sanitizeText(v) : v)),
    nomeResponsavel: z.string().max(100).optional().transform((v) => (v ? sanitizeText(v) : v)),
    telefoneEmergencia: z.string().min(8).max(20).optional(),
  }),
  response: {
    200: z.object({
      uid: z.string(),
      nome: z.string(),
      role: z.enum(['aluno', 'monitor', 'coordenador', 'secretaria']),
      cpf: z.string(),
      email: z.string().optional(),
      telefone: z.string().optional(),
      endereco: z.string().nullable().optional(),
      nomeResponsavel: z.string().nullable().optional(),
      telefoneEmergencia: z.string().nullable().optional(),
      fotoUrl: z.string().nullable().optional(),
      associacaoId: z.string().optional(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const uploadFotoSchema = {
  params: z.object({
    id: z.string().min(1).max(100),
  }),
  response: {
    200: z.object({
      fotoUrl: z.string(),
      message: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    413: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const listUsersSchema = {
  querystring: z.object({
    role: z.enum(['aluno', 'monitor', 'coordenador', 'secretaria']).optional(),
    associacaoId: z.string().max(100).optional(),
  }),
  response: {
    200: z.array(
      z.object({
        uid: z.string(),
        nome: z.string(),
        role: z.enum(['aluno', 'monitor', 'coordenador', 'secretaria']),
        cpf: z.string(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        associacaoId: z.string().optional(),
        numeroMatricula: z.string().optional(),
        fotoUrl: z.string().nullable().optional(),
        criadoEm: z.string().optional(),
      })
    ),
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const getUserParamsSchema = {
  params: z.object({
    id: z.string().min(1).max(100),
  }),
  response: {
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
