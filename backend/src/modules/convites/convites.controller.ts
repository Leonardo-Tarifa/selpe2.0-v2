import { FastifyRequest, FastifyReply } from 'fastify';
import { convitesService } from './convites.service.js';

export class ConvitesController {
  async createConvite(request: FastifyRequest, reply: FastifyReply) {
    const result = await convitesService.createConvite(request.body as any, request.user);
    return reply.status(201).send(result);
  }

  async getConvite(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.params as { token: string };
    const result = await convitesService.getConvite(token);
    return reply.send(result);
  }

  async aceitarConvite(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.params as { token: string };
    const { user } = await convitesService.aceitarConvite(token, request.body as any);

    const jwtToken = await reply.jwtSign({
      uid: user.uid,
      role: user.role,
      associacaoId: user.associacaoId,
      nome: user.nome,
      cpf: user.cpf,
      email: user.email,
    });

    return reply.status(201).send({
      token: jwtToken,
      user,
    });
  }
}

export const convitesController = new ConvitesController();
