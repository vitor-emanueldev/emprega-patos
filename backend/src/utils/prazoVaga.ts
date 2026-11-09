// Prazo de inscrição das vagas ("Inscrições até").
// A data vale até o FIM do dia no horário de Patos-PB (UTC-3, sem horário de verão).

const FUSO = "-03:00";

// "2026-11-15" de hoje, no horário de Patos
export function hojeEmPatos(agora = new Date()) {
  return new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// "2026-11-15" -> 15/11/2026 às 23:59:59 em Patos
export function fimDoDiaEmPatos(data: string) {
  return new Date(`${data}T23:59:59.999${FUSO}`);
}

// Filtro do Prisma: vagas sem prazo ou com prazo ainda não vencido
export function filtroNoPrazo(agora = new Date()) {
  return { OR: [{ inscricoesAte: null }, { inscricoesAte: { gte: agora } }] };
}

export function prazoVencido(inscricoesAte: Date | null | undefined, agora = new Date()) {
  return inscricoesAte != null && inscricoesAte.getTime() < agora.getTime();
}

// Corpo da requisição -> valor para o banco (undefined = não mexe; null = sem prazo)
export function prazoParaBanco(valor: string | null | undefined) {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  return fimDoDiaEmPatos(valor);
}
