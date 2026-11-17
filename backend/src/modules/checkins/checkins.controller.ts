import { FastifyRequest, FastifyReply } from 'fastify';
import { checkinsService } from './checkins.service.js';

export class CheckinsController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const checkin = await checkinsService.createCheckin(request.body as any, request.user);
    return reply.status(201).send(checkin);
  }

  async sync(request: FastifyRequest, reply: FastifyReply) {
    const { checkins } = request.body as any;
    const result = await checkinsService.syncBatch(checkins, request.user);
    return reply.send(result);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const checkins = await checkinsService.listCheckins(request.query as any, request.user);
    return reply.send(checkins);
  }
}

export const checkinsController = new CheckinsController();
