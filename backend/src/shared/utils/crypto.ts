import crypto from 'node:crypto';

/**
 * Compara duas strings em tempo constante (Constant-Time String Comparison),
 * impedindo ataques de temporização (Timing Attacks / Side-Channel Attacks).
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  // Buffer lengths must match for timingSafeEqual
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison against itself to preserve approximate timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Gera o hash criptográfico SHA-256 de validação de autenticidade da Carteirinha
 */
export function generateCarteirinhaHash(alunoId: string, numeroMatricula: string, associacaoId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${alunoId}-${numeroMatricula}-${associacaoId}-SELPE-SEC-KEY`)
    .digest('hex');
}
