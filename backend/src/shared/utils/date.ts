import { format, toZonedTime } from 'date-fns-tz';

export const BRASILIA_TZ = 'America/Sao_Paulo';

/**
 * Retorna a data/hora atual no fuso horário de Brasília.
 */
export function getBrasiliaNow(): Date {
  return toZonedTime(new Date(), BRASILIA_TZ);
}

/**
 * Retorna a string da data no formato YYYY-MM-DD considerando o fuso de Brasília.
 */
export function getBrasiliaDateString(date: Date = new Date()): string {
  const zoned = toZonedTime(date, BRASILIA_TZ);
  return format(zoned, 'yyyy-MM-dd', { timeZone: BRASILIA_TZ });
}

/**
 * Retorna a string completa ISO ou legível no fuso de Brasília.
 */
export function formatBrasiliaDateTime(date: Date = new Date()): string {
  const zoned = toZonedTime(date, BRASILIA_TZ);
  return format(zoned, 'dd/MM/yyyy HH:mm:ss', { timeZone: BRASILIA_TZ });
}

/**
 * Calcula a idade em anos completos considerando a data atual no fuso de Brasília.
 * birthDateStr deve estar no formato YYYY-MM-DD.
 */
export function calculateAgeInBrasilia(birthDateStr: string): number {
  const [yearStr, monthStr, dayStr] = birthDateStr.split('-');
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = parseInt(monthStr, 10);
  const birthDay = parseInt(dayStr, 10);

  const now = getBrasiliaNow();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }
  return age;
}
