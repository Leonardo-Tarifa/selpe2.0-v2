import { FastifyRequest, FastifyReply } from 'fastify';
import { responsaveisService } from './responsaveis.service.js';

export class ResponsaveisController {
  async getConvite(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.params as { token: string };
    const dados = await responsaveisService.getConvite(token);
    return reply.send(dados);
  }

  async confirmar(request: FastifyRequest, reply: FastifyReply) {
    const clientIp = request.ip || '127.0.0.1';
    const result = await responsaveisService.confirmar(request.body as any, clientIp);
    return reply.send(result);
  }
}

export const responsaveisController = new ResponsaveisController();
