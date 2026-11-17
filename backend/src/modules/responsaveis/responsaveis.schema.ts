import { z } from 'zod';
import { isValidCPF, cleanCPF } from '../../shared/utils/cpf.js';
import { sanitizeText } from '../../shared/utils/sanitizer.js';
import { standardErrorResponseSchema } from '../../shared/errors/error.schema.js';

export const getConviteResponsavelSchema = {
  params: z.object({
    token: z.string().min(10, 'Token inválido').max(128, 'Token muito longo'),
  }),
  response: {
    200: z.object({
      alunoNome: z.string(),
      alunoPrimeiroNome: z.string(),
      modalidadeNome: z.string(),
      poloNome: z.string(),
      diasSemana: z.array(z.string()),
      horarioInicio: z.string(),
      horarioFim: z.string(),
      status: z.string(),
      expiraEm: z.string(),
    }),
    400: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};

export const confirmarResponsavelSchema = {
  body: z.object({
    token: z.string().min(10, 'Token inválido').max(128, 'Token muito longo'),
    nomeResponsavel: z
      .string()
      .min(3, 'Nome completo do responsável obrigatório')
      .max(100, 'Nome do responsável muito longo')
      .transform(sanitizeText),
    cpfResponsavel: z
      .string()
      .max(20)
      .refine((val) => isValidCPF(val), { message: 'CPF do responsável inválido' })
      .transform((val) => cleanCPF(val)),
    telefoneResponsavel: z
      .string()
      .min(8, 'Telefone do responsável obrigatório')
      .max(20, 'Telefone inválido'),
    parentesco: z.enum(['mae', 'pai', 'tutor_legal', 'outro'], {
      errorMap: () => ({ message: 'Selecione o grau de parentesco válido (mae, pai, tutor_legal ou outro)' }),
    }),
    termoAceito: z.literal(true, {
      errorMap: () => ({ message: 'É obrigatório o aceite expresso dos termos da LGPD e autorização do menor' }),
    }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      alunoId: z.string(),
      numeroMatricula: z.string(),
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
    400: standardErrorResponseSchema,
    404: standardErrorResponseSchema,
    409: standardErrorResponseSchema,
    500: standardErrorResponseSchema,
  },
};
