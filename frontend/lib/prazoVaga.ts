// "Inscrições até" das vagas. Datas sempre no horário de Patos-PB (UTC-3).

const TRES_HORAS = 3 * 60 * 60 * 1000;
const UM_DIA = 24 * 60 * 60 * 1000;

// "2026-11-15" de hoje, em Patos
export function hojeEmPatos(agora = new Date()) {
  return new Date(agora.getTime() - TRES_HORAS).toISOString().slice(0, 10);
}

// "2026-11-15" + n dias
export function somarDias(data: string, dias: number) {
  return new Date(new Date(`${data}T12:00:00Z`).getTime() + dias * UM_DIA).toISOString().slice(0, 10);
}

// Valor salvo no banco (fim do dia em Patos, em ISO) -> "2026-11-15"
export function dataDoPrazo(inscricoesAte: string | null | undefined) {
  if (!inscricoesAte) return "";
  return new Date(new Date(inscricoesAte).getTime() - TRES_HORAS).toISOString().slice(0, 10);
}

// "2026-11-15" -> "15/11/2026" (ou "15/11" no curto)
export function formatarDataPrazo(data: string, curto = false) {
  const [a, m, d] = data.split("-");
  return curto ? `${d}/${m}` : `${d}/${m}/${a}`;
}

export type SituacaoPrazo =
  | { tipo: "sem" }
  | { tipo: "aberta" | "ultimos"; data: string; dias: number } // dias = quantos dias faltam (0 = hoje é o último)
  | { tipo: "encerrada"; data: string };

export function situacaoPrazo(inscricoesAte: string | null | undefined, agora = new Date()): SituacaoPrazo {
  const data = dataDoPrazo(inscricoesAte);
  if (!data) return { tipo: "sem" };
  if (new Date(inscricoesAte as string).getTime() < agora.getTime()) return { tipo: "encerrada", data };
  const dias = Math.round((new Date(`${data}T12:00:00Z`).getTime() - new Date(`${hojeEmPatos(agora)}T12:00:00Z`).getTime()) / UM_DIA);
  return { tipo: dias <= 3 ? "ultimos" : "aberta", data, dias };
}

// Texto curto para selos e listas
export function textoPrazo(s: SituacaoPrazo, curto = false) {
  if (s.tipo === "sem") return "";
  if (s.tipo === "encerrada") return `Inscrições encerradas em ${formatarDataPrazo(s.data, curto)}`;
  if (s.tipo === "ultimos") {
    if (s.dias === 0) return "Último dia para se inscrever";
    return `Últimos dias · até ${formatarDataPrazo(s.data, true)}`;
  }
  return `Inscrições até ${formatarDataPrazo(s.data, curto)}`;
}
