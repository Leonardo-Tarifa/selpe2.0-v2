import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authController } from './auth.controller.js';
import {
  loginSchema,
  registerAlunoSchema,
  meResponseSchema,
  updateMeSchema,
  updateMeModalidadesSchema,
  uploadMeFotoSchema,
  createInscricaoSchema,
  deleteInscricaoSchema,
} from './auth.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Proteção severa de 5 tentativas por minuto contra brute-force / credential stuffing
  typed.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Autentica um usuário usando CPF ou E-mail e Senha (máx 5 tentativas/minuto)',
        tags: ['Autenticação'],
        ...loginSchema,
      },
    },
    authController.login
  );

  // Proteção de 5 cadastros por minuto contra bots de auto-inscrição
  typed.post(
    '/register-aluno',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Cadastro público de Aluno via QR Code com geração imediata de Carteirinha Digital (máx 5 cadastros/minuto)',
        tags: ['Autenticação'],
        ...registerAlunoSchema,
      },
    },
    authController.registerAluno
  );

  typed.get(
    '/me',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Retorna os dados do usuário autenticado a partir do Token Bearer',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        ...meResponseSchema,
      },
    },
    authController.getMe
  );

  typed.patch(
    '/me',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Atualiza os dados cadastrais do próprio usuário autenticado',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        ...updateMeSchema,
      },
    },
    authController.updateMe
  );

  typed.post(
    '/me/modalidades',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Atualiza as modalidades em que o próprio aluno autenticado participa',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        ...updateMeModalidadesSchema,
      },
    },
    authController.updateMeModalidades
  );

  typed.post(
    '/me/foto',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Faz upload e sanitização segura da própria foto de perfil com moderação NSFW',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        ...uploadMeFotoSchema,
      },
    },
    authController.uploadMeFoto
  );

  typed.post(
    '/me/inscricoes',
    {
      onRequest: [ensureAuthenticated, checkRole(['aluno'])],
      schema: {
        description: 'Inscreve o aluno autenticado em uma nova turma/horário respeitando limite de vagas',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        ...createInscricaoSchema,
      },
    },
    authController.createInscricao
  );

  typed.delete(
    '/me/inscricoes/:matriculaId',
    {
      onRequest: [ensureAuthenticated, checkRole(['aluno'])],
      schema: {
        description: 'Cancela uma inscrição do próprio aluno autenticado',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        ...deleteInscricaoSchema,
      },
    },
    authController.deleteInscricao
  );
}

