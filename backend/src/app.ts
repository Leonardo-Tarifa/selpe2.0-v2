import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from './config/env.js';
import { errorHandler } from './shared/errors/errorHandler.js';
import { AppError } from './shared/errors/AppError.js';
import { parseSafeJson } from './shared/utils/safeJson.js';

// Importação das rotas modulares
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { associacoesRoutes } from './modules/associacoes/associacoes.routes.js';
import { modalidadesRoutes } from './modules/modalidades/modalidades.routes.js';
import { turmasRoutes } from './modules/turmas/turmas.routes.js';
import { matriculasRoutes } from './modules/matriculas/matriculas.routes.js';
import { chamadasRoutes } from './modules/chamadas/chamadas.routes.js';
import { checkinsRoutes } from './modules/checkins/checkins.routes.js';
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes.js';
import { responsaveisRoutes } from './modules/responsaveis/responsaveis.routes.js';
import { convitesRoutes } from './modules/convites/convites.routes.js';

export function buildApp() {
  const app = fastify({
    logger: true,
    // Limite máximo de payload para barrar ataques de exaustão de memória (256 KB)
    bodyLimit: 256 * 1024,
    // Limite de tamanho de parâmetros de rota (previne buffer overflow em URLs)
    routerOptions: {
      maxParamLength: 100,
    },
    // Timeouts contra ataques Slowloris / Slow HTTP DoS
    connectionTimeout: 10000,
    keepAliveTimeout: 5000,
    requestTimeout: 15000,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);

  // Blindagem contra 'JSON Infinito' (JSON Nesting Bomb) e Prototype Pollution
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const parsed = parseSafeJson(body as string, 8);
      done(null, parsed);
    } catch (err: any) {
      done(err);
    }
  });

  // Blindagem contra poluição de parâmetros (HPP) e injeção em Query Strings
  app.addHook('preValidation', async (request) => {
    if (request.query && typeof request.query === 'object') {
      const queryObj = request.query as Record<string, any>;
      for (const key of Object.keys(queryObj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new AppError(
            'Parâmetro de consulta proibido detectado na URL.',
            400,
            'FORBIDDEN_QUERY_PARAMETER'
          );
        }
      }
    }
  });

  // 1. Cabeçalhos de Segurança HTTP (Helmet)
  app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // 2. Controle de CORS Restritivo / Configurável
  app.register(cors, {
    origin: env.ALLOWED_ORIGINS === '*' ? true : env.ALLOWED_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // 3. Mitigação de DoS e Força Bruta (Rate Limiting Global)
  app.register(rateLimit, {
    max: 100, // Limite global de 100 requisições por minuto por IP
    timeWindow: '1 minute',
  });

  // 4. Autenticação JWT com expiração de 12 horas (um turno de trabalho)
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '12h',
    },
  });

  // 5. Suporte a Uploads Multipart com Limite Estrito de 5MB
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
      files: 1,
    },
  });

  // 5. Documentação OpenAPI / Swagger
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'SELPE API - Secretaria de Esportes e Lazer de Peruíbe',
        description: 'Documentação da API de Gestão Esportiva, Presenças e Inscrições do SELPE',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Ambiente Local / Docker',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  // Rota de Health Check
  app.get(
    '/health',
    {
      schema: {
        description: 'Verifica a saúde da API e status do sistema',
        tags: ['Sistema'],
        response: {
          200: z.object({
            status: z.string(),
            timestamp: z.string(),
            timezone: z.string(),
          }),
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        timezone: env.TZ,
      };
    }
  );

  // Registro dos módulos da aplicação
  app.register(authRoutes, { prefix: '/auth' });
  app.register(usersRoutes, { prefix: '/users' });
  app.register(associacoesRoutes, { prefix: '/associacoes' });
  app.register(modalidadesRoutes, { prefix: '/modalidades' });
  app.register(turmasRoutes, { prefix: '/turmas' });
  app.register(matriculasRoutes, { prefix: '/matriculas' });
  app.register(chamadasRoutes, { prefix: '/chamadas' });
  app.register(checkinsRoutes, { prefix: '/checkins' });
  app.register(relatoriosRoutes, { prefix: '/relatorios' });
  app.register(responsaveisRoutes, { prefix: '/responsavel' });
  app.register(convitesRoutes, { prefix: '/convites' });

  return app;
}
