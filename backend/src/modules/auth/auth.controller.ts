import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { usersService } from '../users/users.service.js';
import { AppError } from '../../shared/errors/AppError.js';

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { identifier, password } = request.body as any;
    const user = await authService.login(identifier, password);

    const token = await reply.jwtSign({
      uid: user.uid,
      role: user.role,
      associacaoId: user.associacaoId,
      nome: user.nome,
      cpf: user.cpf,
      email: user.email,
    });

    return reply.send({
      token,
      user,
    });
  }

  async registerAluno(request: FastifyRequest, reply: FastifyReply) {
    const result = await authService.registerAluno(request.body as any);

    if (result.isMenor) {
      return reply.status(202).send({
        message: 'Cadastro de menor de idade pré-realizado com sucesso. É obrigatória a confirmação dos dados pelo responsável legal.',
        status: 'aguardando_responsavel',
        linkResponsavel: `/responsavel/${result.tokenResponsavel}`,
        token: result.tokenResponsavel,
        dadosMenor: result.dadosMenor,
      });
    }

    const token = await reply.jwtSign({
      uid: result.user.uid,
      role: result.user.role,
      associacaoId: result.user.associacaoId,
      nome: result.user.nome,
      cpf: result.user.cpf,
    });

    return reply.status(201).send({
      token,
      user: result.user,
      carteirinha: result.carteirinha,
    });
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const user = await authService.getMe(request.user.uid);
    return reply.send({ user });
  }

  async updateMe(request: FastifyRequest, reply: FastifyReply) {
    const updated = await usersService.updateUser(request.user.uid, request.body as any, request.user);
    return reply.send({ user: updated });
  }

  async updateMeModalidades(request: FastifyRequest, reply: FastifyReply) {
    const { modalidades } = request.body as { modalidades: string[] };
    const result = await authService.updateMeModalidades(request.user.uid, modalidades || []);
    return reply.send(result);
  }

  async uploadMeFoto(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();
    if (!file) {
      throw new AppError(
        'Nenhum arquivo de imagem foi enviado na requisição multipart.',
        400,
        'FILE_MISSING'
      );
    }
    const buffer = await file.toBuffer();
    const result = await usersService.updateFotoPerfil(
      request.user.uid,
      buffer,
      file.mimetype,
      request.user
    );
    return reply.send(result);
  }

  async createInscricao(request: FastifyRequest, reply: FastifyReply) {
    const { turmaId } = request.body as { turmaId: string };
    const inscricao = await authService.createInscricao(request.user.uid, turmaId);
    return reply.status(201).send(inscricao);
  }

  async deleteInscricao(request: FastifyRequest, reply: FastifyReply) {
    const { matriculaId } = request.params as { matriculaId: string };
    const result = await authService.deleteInscricao(request.user.uid, matriculaId);
    return reply.send(result);
  }
}

export const authController = new AuthController();

