import { FastifyRequest, FastifyReply } from 'fastify';
import { matriculasService } from './matriculas.service.js';

export class MatriculasController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { alunoId, turmaId } = request.body as any;
    const matricula = await matriculasService.createMatricula(alunoId, turmaId, request.user);
    return reply.status(201).send(matricula);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { turmaId, alunoId } = request.query as any;
    const matriculas = await matriculasService.listMatriculas(turmaId, alunoId, request.user);
    return reply.send(matriculas);
  }

  async cancelar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const { motivo } = (request.body || {}) as any;
    const resultado = await matriculasService.cancelarMatricula(id, motivo, request.user);
    return reply.send(resultado);
  }

  async getCarteirinha(request: FastifyRequest, reply: FastifyReply) {
    const { alunoId } = request.params as any;
    const carteirinha = await matriculasService.getCarteirinha(alunoId, request.user);
    return reply.send(carteirinha);
  }

  async validarCarteirinha(request: FastifyRequest, reply: FastifyReply) {
    const { alunoId, qrValidationHash, matricula } = request.body as any;
    const resultado = await matriculasService.validarCarteirinha(alunoId, qrValidationHash, matricula);
    return reply.send(resultado);
  }
}

export const matriculasController = new MatriculasController();
