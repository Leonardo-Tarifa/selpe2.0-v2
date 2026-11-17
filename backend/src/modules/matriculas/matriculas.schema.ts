import { z } from 'zod';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const createMatriculaSchema = {
  body: z.object({
    alunoId: z.string().min(1, 'ID do aluno obrigatório').max(100),
    turmaId: z.string().min(1, 'ID da turma obrigatório').max(100),
  }),
  response: {
    201: z.object({
      id: z.string(),
      alunoId: z.string(),
      turmaId: z.string(),
      modalidadeId: z.string(),
      status: z.enum(['ativo', 'trancado']),
      dataInscricao: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    409: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const getCarteirinhaParamsSchema = {
  params: z.object({
    alunoId: z.string().min(1, 'ID do aluno obrigatório').max(100),
  }),
  response: {
    200: z.object({
      numeroMatricula: z.string(),
      nome: z.string(),
      cpf: z.string(),
      fotoUrl: z.string().nullable().optional(),
      modalidadeNome: z.string(),
      local: z.string(),
      diasSemana: z.array(z.string()),
      horarioInicio: z.string(),
      horarioFim: z.string(),
      telefoneEmergencia: z.string(),
      nomeResponsavel: z.string().nullable().optional(),
      associacaoNome: z.string(),
      status: z.string(),
      qrValidationHash: z.string(),
      validadoEm: z.string(),
    }),
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const validarCarteirinhaSchema = {
  body: z
    .object({
      alunoId: z.string().max(100).optional(),
      matricula: z.string().max(100).optional(),
      qrValidationHash: z.string().min(16, 'Hash de validação obrigatório').max(128),
    })
    .refine((data) => Boolean(data.alunoId || data.matricula), {
      message: 'É necessário informar o alunoId ou o número de matrícula',
    }),
  response: {
    200: z.object({
      valido: z.boolean(),
      aluno: z.object({
        alunoId: z.string(),
        nome: z.string(),
        numeroMatricula: z.string().optional(),
        cpf: z.string(),
        fotoUrl: z.string().nullable().optional(),
        associacaoId: z.string().optional(),
      }),
      validadoEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const listMatriculasSchema = {
  querystring: z.object({
    turmaId: z.string().max(100).optional(),
    alunoId: z.string().max(100).optional(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        alunoId: z.string(),
        turmaId: z.string(),
        modalidadeId: z.string().optional(),
        status: z.string(),
        dataInscricao: z.string().optional(),
        dataCancelamento: z.string().optional(),
        motivoCancelamento: z.string().optional(),
        aluno: z
          .object({
            nome: z.string(),
            cpf: z.string(),
            numeroMatricula: z.string().optional(),
            fotoUrl: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
      })
    ),
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const cancelarMatriculaSchema = {
  params: z.object({
    id: z.string().min(1).max(100),
  }),
  body: z.object({
    motivo: z.string().max(255).optional(),
  }),
  response: {
    200: z.object({
      id: z.string(),
      alunoId: z.string(),
      turmaId: z.string(),
      status: z.string(),
      dataCancelamento: z.string(),
      motivoCancelamento: z.string(),
    }),
    400: standardErrorResponseSchema,
    401: standardErrorResponseSchema,
    403: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
