import { FastifyRequest, FastifyReply } from 'fastify';
import { associacoesService } from './associacoes.service.js';

export class AssociacoesController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const associacao = await associacoesService.create(request.body as any);
    return reply.status(201).send(associacao);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const list = await associacoesService.list();
    return reply.send(list);
  }
}

export const associacoesController = new AssociacoesController();
