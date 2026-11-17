import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { responsaveisController } from './responsaveis.controller.js';
import {
  getConviteResponsavelSchema,
  confirmarResponsavelSchema,
} from './responsaveis.schema.js';

export async function responsaveisRoutes(app: FastifyInstance) {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/convite/:token',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Consulta pública sanitizada das informações da inscrição do menor para tela do responsável',
        tags: ['Responsável Legal'],
        ...getConviteResponsavelSchema,
      },
    },
    responsaveisController.getConvite
  );

  typed.post(
    '/confirmar',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Confirmação e consentimento dos termos pelo responsável legal para ativação do cadastro e matrícula do menor',
        tags: ['Responsável Legal'],
        ...confirmarResponsavelSchema,
      },
    },
    responsaveisController.confirmar
  );
}
