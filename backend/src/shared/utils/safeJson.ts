import sjson from 'secure-json-parse';
import { AppError } from '../errors/AppError.js';

const DEFAULT_MAX_DEPTH = 8;

/**
 * Escaneia o payload bruto em O(N) para detectar e abortar ataques de
 * "JSON Infinito" (deeply nested JSON bombs) antes de chamar o parser do V8.
 */
export function validateJsonDepth(rawJson: string, maxDepth = DEFAULT_MAX_DEPTH): void {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < rawJson.length; i++) {
    const char = rawJson[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        depth++;
        if (depth > maxDepth) {
          throw new AppError(
            `Ataque de profundidade detectado: o JSON enviado excede o limite máximo permitido de ${maxDepth} níveis de aninhamento.`,
            400,
            'JSON_DEPTH_LIMIT_EXCEEDED'
          );
        }
      } else if (char === '}' || char === ']') {
        depth--;
      }
    }
  }
}

/**
 * Parser de JSON blindado contra:
 * 1. JSON Infinito / Deep Nesting DoS (inspeção prévia em O(N))
 * 2. Prototype Pollution (__proto__, constructor, prototype)
 */
export function parseSafeJson(rawJson: string, maxDepth = DEFAULT_MAX_DEPTH): any {
  if (!rawJson || rawJson.trim() === '') {
    return {};
  }

  // 1. Bloqueia bombas de profundidade
  validateJsonDepth(rawJson, maxDepth);

  // 2. Bloqueia Prototype Pollution
  try {
    return sjson.parse(rawJson, {
      protoAction: 'error',
      constructorAction: 'error',
    });
  } catch (err: any) {
    if (err.message && err.message.includes('forbidden prototype property')) {
      throw new AppError(
        'Tentativa de poluição de protótipo detectada: payload contém propriedades proibidas (__proto__, constructor, prototype).',
        400,
        'PROTOTYPE_POLLUTION_DETECTED'
      );
    }
    throw err;
  }
}
