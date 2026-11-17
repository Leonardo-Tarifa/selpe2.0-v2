import { z } from 'zod';
import { isValidCPF, cleanCPF } from '../../shared/utils/cpf.js';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const loginSchema = {
  body: z.object({
    identifier: z.string().min(3, 'Informe seu CPF ou E-mail').max(100, 'Identificador muito longo'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(128, 'Senha muito longa'),
  }),
  response: {
    200: z.object({
      token: z.string(),
      user: z.object({
        uid: z.string(),
        nome: z.string(),
        role: z.enum(['aluno', 'monitor', 'coordenador', 'secretaria']),
        cpf: z.string(),
        email: z.string().optional(),
        associacaoId: z.string().optional(),
        fotoUrl: z.string().nullable().optional(),
      }),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    429: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const registerAlunoSchema = {
  body: z.object({
    nome: z
      .string()
      .min(3, 'Nome completo obrigatório')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .transform(sanitizeText),
    cpf: z
      .string()
      .max(20)
      .refine((val) => isValidCPF(val), { message: 'CPF inválido' })
      .transform((val) => cleanCPF(val)),
    email: z.string().email('E-mail inválido').max(100, 'E-mail deve ter no máximo 100 caracteres'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(128, 'Senha deve ter no máximo 128 caracteres'),
    telefone: z.string().min(8, 'Telefone obrigatório').max(20, 'Telefone inválido'),
    endereco: z
      .string()
      .min(5, 'Endereço residencial obrigatório (mínimo 5 caracteres)')
      .max(255, 'Endereço muito longo')
      .transform(sanitizeText),
    nomeResponsavel: z
      .string()
      .min(3, 'Nome do responsável obrigatório')
      .max(100, 'Nome do responsável muito longo')
      .transform(sanitizeText),
    telefoneEmergencia: z.string().min(8, 'Telefone de emergência obrigatório').max(20, 'Telefone de emergência inválido'),
    fotoUrl: z.string().url('URL da foto inválida').max(500, 'URL da foto muito longa').optional(),
    turmaId: z.string().min(1, 'Turma/horário obrigatório').max(100),
    associacaoId: z.string().max(100).optional(),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato AAAA-MM-DD'),
    observacoes: z.string().max(1000).optional().transform((v) => (v ? sanitizeText(v) : v)),
  }),
  response: {
    201: z.object({
      token: z.string(),
      user: z.object({
        uid: z.string(),
        nome: z.string(),
        role: z.literal('aluno'),
        cpf: z.string(),
        numeroMatricula: z.string(),
        fotoUrl: z.string().nullable().optional(),
      }),
      carteirinha: z.object({
        numeroMatricula: z.string(),
        nome: z.string(),
        fotoUrl: z.string().nullable().optional(),
        modalidadeNome: z.string(),
        diasSemana: z.array(z.string()),
        horarioInicio: z.string(),
        horarioFim: z.string(),
        telefoneEmergencia: z.string(),
        qrValidationHash: z.string(),
      }),
    }),
    202: z.object({
      message: z.string(),
      status: z.literal('aguardando_responsavel'),
      linkResponsavel: z.string(),
      token: z.string(),
      dadosMenor: z.object({
        nome: z.string(),
        cpfMascarado: z.string(),
        modalidadeNome: z.string(),
        diasSemana: z.array(z.string()),
        horarioInicio: z.string(),
        horarioFim: z.string(),
      }),
    }),
    400: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    409: standardErrorResponseSchema,
    429: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const meResponseSchema = {
  response: {
    200: z.object({
      user: z.object({
        uid: z.string(),
        nome: z.string(),
        role: z.enum(['aluno', 'monitor', 'coordenador', 'secretaria']),
        cpf: z.string(),
        email: z.string().optional().nullable(),
        telefone: z.string().optional().nullable(),
        dataNascimento: z.string().optional().nullable(),
        endereco: z.string().optional().nullable(),
        bairro: z.string().optional().nullable(),
        cidade: z.string().optional().nullable(),
        estado: z.string().optional().nullable(),
        nomeResponsavel: z.string().optional().nullable(),
        associacaoId: z.string().optional().nullable(),
        numeroMatricula: z.string().optional().nullable(),
        fotoUrl: z.string().nullable().optional(),
        telefoneEmergencia: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
        modalidades: z.array(z.string()).optional(),
      }),
    }),
    401: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const updateMeSchema = {
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
      user: z.any(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const updateMeModalidadesSchema = {
  body: z.object({
    modalidades: z.array(z.string()),
  }),
  response: {
    200: z.object({
      message: z.string(),
      modalidades: z.array(z.string()),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const uploadMeFotoSchema = {
  response: {
    200: z.object({
      fotoUrl: z.string(),
      message: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    413: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const createInscricaoSchema = {
  body: z.object({
    turmaId: z.string().min(1, 'Turma obrigatória').max(100),
  }),
  response: {
    201: z.object({
      id: z.string(),
      alunoId: z.string(),
      turmaId: z.string(),
      modalidadeId: z.string(),
      status: z.literal('ativo'),
      dataInscricao: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    409: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const deleteInscricaoSchema = {
  params: z.object({
    matriculaId: z.string().min(1, 'ID da matrícula obrigatório').max(100),
  }),
  response: {
    200: z.object({
      message: z.string(),
      matriculaId: z.string(),
      status: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};



