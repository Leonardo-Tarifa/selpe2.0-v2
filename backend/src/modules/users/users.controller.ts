import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';
import { AppError } from '../../shared/errors/AppError.js';

export class UsersController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const user = await usersService.createUser(request.body as any, request.user);
    return reply.status(201).send(user);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const users = await usersService.listUsers(request.query as any, request.user);
    return reply.send(users);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const user = await usersService.getUserById(id, request.user);
    return reply.send(user);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const updated = await usersService.updateUser(id, request.body as any, request.user);
    return reply.send(updated);
  }

  async uploadFoto(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const file = await request.file();

    if (!file) {
      throw new AppError(
        'Nenhum arquivo de imagem foi enviado na requisição multipart.',
        400,
        'FILE_MISSING'
      );
    }

    const buffer = await file.toBuffer();
    const result = await usersService.updateFotoPerfil(id, buffer, file.mimetype, request.user);
    return reply.send(result);
  }
}

export const usersController = new UsersController();
