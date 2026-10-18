import { House, Repeat } from "lucide-react";
import { rotuloModalidade } from "@/lib/opcoesVaga";

// Selo "Remoto" / "Híbrido". Vaga presencial (a maioria) não mostra nada.
export default function SeloModalidade({ modalidade, pequeno = false }: { modalidade?: string | null; pequeno?: boolean }) {
  const rotulo = rotuloModalidade(modalidade);
  if (!rotulo) return null;
  const Icone = modalidade === "remoto" ? House : Repeat;
  return (
    <span
      title={modalidade === "remoto" ? "Trabalho remoto, de casa" : "Parte presencial, parte remoto"}
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-violet-50 text-violet-700 ${
        pequeno ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1"
      }`}
    >
      <Icone className={pequeno ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {rotulo}
    </span>
  );
}
