import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { associacoesController } from './associacoes.controller.js';
import { createAssociacaoSchema, listAssociacoesSchema } from './associacoes.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function associacoesRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Apenas a Secretaria cadastra associações
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria'])],
      schema: {
        description: 'Cadastra uma nova associação esportiva parceira',
        tags: ['Associações'],
        security: [{ bearerAuth: [] }],
        ...createAssociacaoSchema,
      },
    },
    associacoesController.create
  );

  // Listagem pública para seleção de polos/associações no app e QR Code
  typed.get(
    '/',
    {
      schema: {
        description: 'Lista todas as associações parceiras cadastradas',
        tags: ['Associações'],
        ...listAssociacoesSchema,
      },
    },
    associacoesController.list
  );
}
