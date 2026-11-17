import { FastifyRequest, FastifyReply } from 'fastify';
import { modalidadesService } from './modalidades.service.js';

export class ModalidadesController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const modalidade = await modalidadesService.create(request.body as any, request.user);
    return reply.status(201).send(modalidade);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { associacaoId } = (request.query as any) || {};
    const list = await modalidadesService.list(associacaoId);
    return reply.send(list);
  }
}

export const modalidadesController = new ModalidadesController();
