import { FastifyRequest, FastifyReply } from 'fastify';
import { turmasService } from './turmas.service.js';

export class TurmasController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const turma = await turmasService.create(request.body as any, request.user);
    return reply.status(201).send(turma);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const turmas = await turmasService.list((request.query as any) || {});
    return reply.send(turmas);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const turma = await turmasService.getById(id);
    return reply.send(turma);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const updated = await turmasService.update(id, request.body as any, request.user);
    return reply.send(updated);
  }
}

export const turmasController = new TurmasController();
