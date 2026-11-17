import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { usersController } from './users.controller.js';
import {
  createUserSchema,
  listUsersSchema,
  getUserParamsSchema,
  updateUserSchema,
  uploadFotoSchema,
} from './users.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function usersRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Apenas Secretaria e Coordenadores podem criar e listar profissionais
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador'])],
      schema: {
        description: 'Cadastra um usuário profissional (Monitor, Coordenador ou Secretaria)',
        tags: ['Usuários'],
        security: [{ bearerAuth: [] }],
        ...createUserSchema,
      },
    },
    usersController.create
  );

  typed.get(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador'])],
      schema: {
        description: 'Lista usuários com filtros por role e associação',
        tags: ['Usuários'],
        security: [{ bearerAuth: [] }],
        ...listUsersSchema,
      },
    },
    usersController.list
  );

  typed.get(
    '/:id',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Consulta detalhes de um usuário por ID',
        tags: ['Usuários'],
        security: [{ bearerAuth: [] }],
        ...getUserParamsSchema,
      },
    },
    usersController.getById
  );

  typed.patch(
    '/:id',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Atualiza dados cadastrais de um usuário (Anti-IDOR)',
        tags: ['Usuários'],
        security: [{ bearerAuth: [] }],
        ...updateUserSchema,
      },
    },
    usersController.update
  );

  typed.post(
    '/:id/foto',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Faz upload e sanitização segura da foto de perfil com moderação NSFW',
        tags: ['Usuários'],
        security: [{ bearerAuth: [] }],
        ...uploadFotoSchema,
      },
    },
    usersController.uploadFoto
  );
}
