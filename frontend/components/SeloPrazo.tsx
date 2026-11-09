import { CalendarClock } from "lucide-react";
import { situacaoPrazo, textoPrazo } from "@/lib/prazoVaga";

// Selo do "Inscrições até". Vaga sem prazo não mostra nada.
export default function SeloPrazo({ inscricoesAte, pequeno = false }: { inscricoesAte?: string | null; pequeno?: boolean }) {
  const s = situacaoPrazo(inscricoesAte);
  if (s.tipo === "sem") return null;
  const cor =
    s.tipo === "encerrada"
      ? "bg-slate-200 text-slate-600"
      : s.tipo === "ultimos"
      ? "bg-orange-100 text-orange-700"
      : "bg-sky-50 text-sky-700";
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap ${cor} ${
        pequeno ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1"
      }`}
    >
      <CalendarClock className={pequeno ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {textoPrazo(s, true)}
    </span>
  );
}
