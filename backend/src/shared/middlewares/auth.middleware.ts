import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/user.js';
import { AppError } from '../errors/AppError.js';

export async function ensureAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new AppError('Token de autenticação ausente ou inválido', 401);
  }
}

export function checkRole(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Não autenticado', 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AppError(
        `Acesso negado. Esta operação requer um dos papéis: ${allowedRoles.join(', ')}`,
        403
      );
    }
  };
}
