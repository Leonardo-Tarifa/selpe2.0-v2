import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { matriculasController } from './matriculas.controller.js';
import {
  createMatriculaSchema,
  listMatriculasSchema,
  cancelarMatriculaSchema,
  getCarteirinhaParamsSchema,
  validarCarteirinhaSchema,
} from './matriculas.schema.js';
import { ensureAuthenticated, checkRole } from '../../shared/middlewares/auth.middleware.js';

export async function matriculasRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Coordenador, Secretaria e Monitor podem enturmar alunos em suas turmas
  typed.post(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador', 'monitor'])],
      schema: {
        description: 'Realiza a matrícula/enturmação de um aluno',
        tags: ['Matrículas'],
        security: [{ bearerAuth: [] }],
        ...createMatriculaSchema,
      },
    },
    matriculasController.create
  );

  // Listagem de matrículas com dados dos alunos
  typed.get(
    '/',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador', 'monitor', 'aluno'])],
      schema: {
        description: 'Lista matrículas com filtros opcionais por turma e aluno',
        tags: ['Matrículas'],
        security: [{ bearerAuth: [] }],
        ...listMatriculasSchema,
      },
    },
    matriculasController.list
  );

  // Cancelamento de matrícula
  typed.patch(
    '/:id/cancelar',
    {
      onRequest: [ensureAuthenticated, checkRole(['secretaria', 'coordenador', 'monitor'])],
      schema: {
        description: 'Cancela a matrícula de um atleta com justificativa administrativa',
        tags: ['Matrículas'],
        security: [{ bearerAuth: [] }],
        ...cancelarMatriculaSchema,
      },
    },
    matriculasController.cancelar
  );

  // Consulta dos dados da Carteirinha Digital do Atleta
  typed.get(
    '/carteirinha/:alunoId',
    {
      onRequest: [ensureAuthenticated],
      schema: {
        description: 'Retorna os dados completos da Carteirinha Digital de um aluno',
        tags: ['Matrículas'],
        security: [{ bearerAuth: [] }],
        ...getCarteirinhaParamsSchema,
      },
    },
    matriculasController.getCarteirinha
  );

  // Validação criptográfica da Carteirinha Digital via QR Code (restrito a profissionais da educação/esporte)
  typed.post(
    '/carteirinha/validar',
    {
      onRequest: [ensureAuthenticated, checkRole(['monitor', 'coordenador', 'secretaria'])],
      schema: {
        description: 'Valida a autenticidade criptográfica de uma Carteirinha Digital lida por QR Code',
        tags: ['Matrículas'],
        security: [{ bearerAuth: [] }],
        ...validarCarteirinhaSchema,
      },
    },
    matriculasController.validarCarteirinha
  );
}
