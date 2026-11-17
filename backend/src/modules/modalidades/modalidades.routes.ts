import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { modalidadesController } from './modalidades.controller.js';
import { createModalidadeSchema, listModalidadesSchema } from './modalidades.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function modalidadesRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Secretaria e Coordenadores podem criar modalidades
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador'])],
      schema: {
        description: 'Cadastra uma nova modalidade esportiva',
        tags: ['Modalidades'],
        security: [{ bearerAuth: [] }],
        ...createModalidadeSchema,
      },
    },
    modalidadesController.create
  );

  // Listagem pública para consulta de esportes oferecidos
  typed.get(
    '/',
    {
      schema: {
        description: 'Lista modalidades com filtro opcional por associação parceira',
        tags: ['Modalidades'],
        ...listModalidadesSchema,
      },
    },
    modalidadesController.list
  );
}
