import 'fastify';
import { UserPayload } from '../shared/types/user.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}
