/**
 * Sanitiza strings de entrada removendo tags HTML, scripts maliciosos,
 * eventos inline (onload, onerror, onclick) e caracteres de controle perigosos (Anti-XSS).
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return input;

  return input
    // Remove caracteres de controle invisíveis, nulos e zero-width
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    // Remove blocos inteiros de scripts <script...>...</script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove tags de incorporação potencialmente perigosas
    .replace(/<(iframe|object|embed|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove qualquer tag HTML restante (<img ...>, <a ...>, etc.)
    .replace(/<[^>]+>/g, '')
    // Remove pseudo-protocolo javascript:
    .replace(/javascript:/gi, '')
    .trim();
}
