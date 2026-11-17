import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { chamadasController } from './chamadas.controller.js';
import { createChamadaSchema, syncChamadasSchema, listChamadasSchema } from './chamadas.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function chamadasRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Monitores e Coordenadores realizam chamada em tempo real
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Registra a lista de chamada de uma turma em tempo real',
        tags: ['Chamadas'],
        security: [{ bearerAuth: [] }],
        ...createChamadaSchema,
      },
    },
    chamadasController.create
  );

  // Sincronização em lote originada do IndexedDB do PWA após reconexão à internet
  typed.post(
    '/sync',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Sincroniza em lote chamadas acumuladas offline (IndexedDB) de forma idempotente',
        tags: ['Chamadas'],
        security: [{ bearerAuth: [] }],
        ...syncChamadasSchema,
      },
    },
    chamadasController.sync
  );

  // Consulta histórico de chamadas de uma turma
  typed.get(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Lista chamadas de uma turma filtradas por período',
        tags: ['Chamadas'],
        security: [{ bearerAuth: [] }],
        ...listChamadasSchema,
      },
    },
    chamadasController.list
  );
}
