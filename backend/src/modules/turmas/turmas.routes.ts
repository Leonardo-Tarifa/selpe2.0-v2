import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { turmasController } from './turmas.controller.js';
import {
  createTurmaSchema,
  listTurmasSchema,
  getTurmaByIdSchema,
  updateTurmaSchema,
} from './turmas.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function turmasRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Apenas Coordenadores e Secretaria cadastram turmas e horários
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador'])],
      schema: {
        description: 'Cadastra uma nova turma com monitor, dias da semana e horários',
        tags: ['Turmas'],
        security: [{ bearerAuth: [] }],
        ...createTurmaSchema,
      },
    },
    turmasController.create
  );

  // Listagem pública para seleção de turmas no ato da inscrição ou consulta
  typed.get(
    '/',
    {
      schema: {
        description: 'Lista turmas com filtros por modalidade ou monitor',
        tags: ['Turmas'],
        ...listTurmasSchema,
      },
    },
    turmasController.list
  );

  typed.get(
    '/:id',
    {
      schema: {
        description: 'Consulta os dados e horários de uma turma específica por ID',
        tags: ['Turmas'],
        ...getTurmaByIdSchema,
      },
    },
    turmasController.getById
  );

  typed.patch(
    '/:id',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador'])],
      schema: {
        description: 'Atualiza dados, capacidade ou monitor de uma turma (Anti-IDOR)',
        tags: ['Turmas'],
        security: [{ bearerAuth: [] }],
        ...updateTurmaSchema,
      },
    },
    turmasController.update
  );
}
