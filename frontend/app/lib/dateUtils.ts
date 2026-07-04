// Brasília é UTC-3 (sem horário de verão desde 2019)
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Converte string "YYYY-MM-DDTHH:mm" (horário de Brasília) para ISO UTC */
export function brtInputToISO(localStr: string): string {
  if (!localStr) return localStr;
  const utc = new Date(localStr + ':00.000Z');
  return new Date(utc.getTime() - BRT_OFFSET_MS).toISOString();
}

/** Converte ISO UTC para string "YYYY-MM-DDTHH:mm" no horário de Brasília (para preencher datetime-local) */
export function isoToBrtInput(isoStr: string): string {
  if (!isoStr) return '';
  const brt = new Date(new Date(isoStr).getTime() + BRT_OFFSET_MS);
  return brt.toISOString().slice(0, 16);
}

/** Formata ISO UTC para exibição em pt-BR no horário de Brasília */
export function formatBRT(isoStr: string): string {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
