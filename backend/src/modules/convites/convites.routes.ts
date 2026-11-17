import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { convitesController } from './convites.controller.js';
import {
  createConviteSchema,
  getConviteSchema,
  aceitarConviteSchema,
} from './convites.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function convitesRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador'])],
      schema: {
        description: 'Gera convite profissional com token de uso único para onboarding seguro via QR Code',
        tags: ['Convites Profissionais'],
        security: [{ bearerAuth: [] }],
        ...createConviteSchema,
      },
    },
    convitesController.createConvite
  );

  typed.get(
    '/:token',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Consulta pública de dados do convite para preenchimento de formulário de cadastro',
        tags: ['Convites Profissionais'],
        ...getConviteSchema,
      },
    },
    convitesController.getConvite
  );

  typed.post(
    '/:token/aceitar',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Conclui o cadastro profissional via token do convite e autentica o usuário',
        tags: ['Convites Profissionais'],
        ...aceitarConviteSchema,
      },
    },
    convitesController.aceitarConvite
  );
}
