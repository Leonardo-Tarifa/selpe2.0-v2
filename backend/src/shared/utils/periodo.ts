import { getBrasiliaNow, getBrasiliaDateString } from './date.js';

export type PeriodoPreset = 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface ResolvePeriodoOptions {
  periodoPreset?: PeriodoPreset;
  dataInicio?: string;
  dataFim?: string;
}

export function resolvePeriodo(options: ResolvePeriodoOptions): { dataInicio: string; dataFim: string; label: string } {
  if (options.dataInicio && options.dataFim) {
    return {
      dataInicio: options.dataInicio,
      dataFim: options.dataFim,
      label: `Personalizado (${options.dataInicio} a ${options.dataFim})`,
    };
  }

  const now = getBrasiliaNow();
  const hojeStr = getBrasiliaDateString(now);

  const preset = options.periodoPreset || 'mensal';

  switch (preset) {
    case 'diario':
      return {
        dataInicio: hojeStr,
        dataFim: hojeStr,
        label: `Diário (${hojeStr})`,
      };

    case 'semanal': {
      const inicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dataInicioStr = getBrasiliaDateString(inicio);
      return {
        dataInicio: dataInicioStr,
        dataFim: hojeStr,
        label: `Semanal (${dataInicioStr} a ${hojeStr})`,
      };
    }

    case 'mensal': {
      const primeiroDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const dataInicioStr = getBrasiliaDateString(primeiroDiaMes);
      return {
        dataInicio: dataInicioStr,
        dataFim: hojeStr,
        label: `Mensal (${dataInicioStr} a ${hojeStr})`,
      };
    }

    case 'trimestral': {
      const inicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const dataInicioStr = getBrasiliaDateString(inicio);
      return {
        dataInicio: dataInicioStr,
        dataFim: hojeStr,
        label: `Trimestral (${dataInicioStr} a ${hojeStr})`,
      };
    }

    case 'semestral': {
      const inicio = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const dataInicioStr = getBrasiliaDateString(inicio);
      return {
        dataInicio: dataInicioStr,
        dataFim: hojeStr,
        label: `Semanal (${dataInicioStr} a ${hojeStr})`,
      };
    }

    case 'anual': {
      const primeiroDiaAno = new Date(now.getFullYear(), 0, 1);
      const dataInicioStr = getBrasiliaDateString(primeiroDiaAno);
      return {
        dataInicio: dataInicioStr,
        dataFim: hojeStr,
        label: `Anual (${dataInicioStr} a ${hojeStr})`,
      };
    }

    default:
      return {
        dataInicio: hojeStr,
        dataFim: hojeStr,
        label: `Diário (${hojeStr})`,
      };
  }
}
