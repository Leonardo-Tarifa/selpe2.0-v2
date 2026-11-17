import { FastifyRequest, FastifyReply } from 'fastify';
import { chamadasService } from './chamadas.service.js';

export class ChamadasController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const chamada = await chamadasService.createChamada(request.body as any, request.user);
    return reply.status(201).send(chamada);
  }

  async sync(request: FastifyRequest, reply: FastifyReply) {
    const { chamadas } = request.body as any;
    const result = await chamadasService.syncBatch(chamadas, request.user);
    return reply.send(result);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const chamadas = await chamadasService.listChamadas(request.query as any, request.user);
    return reply.send(chamadas);
  }
}

export const chamadasController = new ChamadasController();
