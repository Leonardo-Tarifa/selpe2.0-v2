import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { checkinsController } from './checkins.controller.js';
import { createCheckinSchema, syncCheckinsSchema, listCheckinsSchema } from './checkins.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function checkinsRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Monitores e Coordenadores realizam check-in de chegada no polo esportivo
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Registra check-in do profissional com captura de geolocalização e data/hora oficial',
        tags: ['Check-ins Profissionais'],
        security: [{ bearerAuth: [] }],
        ...createCheckinSchema,
      },
    },
    checkinsController.create
  );

  // Sincronização em lote originada do IndexedDB do PWA após reconexão à internet
  typed.post(
    '/sync',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Sincroniza em lote check-ins capturados offline de forma idempotente',
        tags: ['Check-ins Profissionais'],
        security: [{ bearerAuth: [] }],
        ...syncCheckinsSchema,
      },
    },
    checkinsController.sync
  );

  // Consulta histórico de check-ins para auditoria
  typed.get(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['coordenador', 'secretaria'])],
      schema: {
        description: 'Consulta histórico de check-ins de campo para auditoria e supervisão técnica',
        tags: ['Check-ins Profissionais'],
        security: [{ bearerAuth: [] }],
        ...listCheckinsSchema,
      },
    },
    checkinsController.list
  );
}
