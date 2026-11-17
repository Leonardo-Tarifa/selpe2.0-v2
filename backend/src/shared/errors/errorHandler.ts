import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';
import { StandardErrorResponse } from './error.schema.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const timestamp = new Date().toISOString();
  const path = request.url;
  const requestId = String(request.id || 'unknown');

  // 1. Erros de Domínio / Regras de Negócio (AppError)
  if (error instanceof AppError) {
    const response: StandardErrorResponse = {
      success: false,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      requestId,
      timestamp,
      path,
    };
    if (error.details) {
      (response as any).details = error.details;
    }
    return reply.status(error.statusCode).send(response);
  }

  // 2. Erros de Validação do Zod
  if (error instanceof ZodError) {
    const response: StandardErrorResponse = {
      success: false,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos ou mal formatados',
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
        code: issue.code,
      })),
      requestId,
      timestamp,
      path,
    };
    return reply.status(400).send(response);
  }

  // 3. Erro de Rate Limit do Fastify (HTTP 429)
  if (error.statusCode === 429 || error.code === 'FST_ERR_RATE_LIMIT_EXCEEDED') {
    const response: StandardErrorResponse = {
      success: false,
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Muitas requisições originadas deste IP. Por favor, aguarde alguns instantes.',
      requestId,
      timestamp,
      path,
    };
    return reply.status(429).send(response);
  }

  // 4. Erro de Tamanho Excessivo de Payload (HTTP 413 - DoS Mitigation)
  if (error.statusCode === 413 || error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    const response: StandardErrorResponse = {
      success: false,
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'O tamanho do payload enviado ultrapassa o limite máximo permitido de 256KB.',
      requestId,
      timestamp,
      path,
    };
    return reply.status(413).send(response);
  }

  // 4. Erros de JWT / Autenticação do Fastify
  if (error.code?.startsWith('FST_JWT')) {
    const response: StandardErrorResponse = {
      success: false,
      statusCode: 401,
      code: error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: 'Token de autenticação ausente, expirado ou inválido',
      requestId,
      timestamp,
      path,
    };
    return reply.status(401).send(response);
  }

  // 5. Erros conhecidos do Firebase Auth / Firestore
  const fbCode = (error as any).code;
  if (typeof fbCode === 'string' && fbCode.startsWith('auth/')) {
    let statusCode = 400;
    let message = 'Falha na operação de autenticação';
    let code = 'AUTH_ERROR';

    switch (fbCode) {
      case 'auth/email-already-exists':
        statusCode = 409;
        code = 'EMAIL_ALREADY_EXISTS';
        message = 'O e-mail informado já está cadastrado';
        break;
      case 'auth/user-not-found':
        statusCode = 404;
        code = 'USER_NOT_FOUND';
        message = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        statusCode = 401;
        code = 'INVALID_CREDENTIALS';
        message = 'Credenciais de acesso incorretas';
        break;
      case 'auth/id-token-expired':
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'A sessão expirou. Faça login novamente.';
        break;
    }

    const response: StandardErrorResponse = {
      success: false,
      statusCode,
      code,
      message,
      requestId,
      timestamp,
      path,
    };
    return reply.status(statusCode).send(response);
  }

  // 6. Erros genéricos com statusCode pré-definido pelo Fastify (ex: 404 NotFound nativo)
  if (error.statusCode && error.statusCode < 500) {
    const response: StandardErrorResponse = {
      success: false,
      statusCode: error.statusCode,
      code: error.name?.toUpperCase() || 'CLIENT_ERROR',
      message: error.message || 'Requisição inválida',
      requestId,
      timestamp,
      path,
    };
    return reply.status(error.statusCode).send(response);
  }

  // 7. Erro interno não tratado (HTTP 500)
  // Registra o trace completo com o request context nos logs para auditoria
  request.log.error({
    err: error,
    requestId,
    url: request.url,
    method: request.method,
    ip: request.ip,
  }, 'Erro interno não tratado');

  // Resposta blindada: NENHUM dado de infraestrutura interna ou stack trace vaza para o cliente
  const internalResponse: StandardErrorResponse = {
    success: false,
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ocorreu um erro interno nos servidores do SELPE. Contate o suporte informando o identificador da requisição.',
    requestId,
    timestamp,
    path,
  };
  return reply.status(500).send(internalResponse);
}
