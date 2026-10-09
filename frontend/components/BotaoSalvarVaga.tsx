"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useVagasSalvas } from "@/context/VagasSalvasContext";

type Props = {
  vagaId: string;
  // "botao": botão largo da página da vaga (mesmo visual de antes); "icone": só o coração (listas)
  variante?: "icone" | "botao";
  className?: string;
};

export default function BotaoSalvarVaga({ vagaId, variante = "icone", className = "" }: Props) {
  const router = useRouter();
  const { estaSalva, alternar } = useVagasSalvas();
  const salva = estaSalva(vagaId);

  async function aoClicar(e: React.MouseEvent) {
    // não deixa o clique "vazar" para o card da lista (que seleciona a vaga)
    e.preventDefault();
    e.stopPropagation();
    const logado = await alternar(vagaId);
    if (!logado) router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }

  if (variante === "botao") {
    return (
      <button
        type="button"
        onClick={aoClicar}
        aria-pressed={salva}
        className={`mt-2 w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-2.5 transition-colors ${
          salva ? "bg-slate-100 hover:bg-slate-200" : "hover:bg-slate-50"
        } ${className}`}
      >
        <Bookmark className={`w-4 h-4 ${salva ? "fill-[#F0A93C] text-[#F0A93C]" : ""}`} />
        {salva ? "Vaga salva" : "Salvar vaga"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={salva}
      aria-label={salva ? "Remover das vagas salvas" : "Salvar vaga"}
      title={salva ? "Remover das vagas salvas" : "Salvar vaga"}
      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-colors ${
        salva ? "text-[#F0A93C] hover:bg-amber-50" : "text-slate-400 hover:text-[#0F2C4A] hover:bg-slate-100"
      } ${className}`}
    >
      <Bookmark className={`w-[18px] h-[18px] ${salva ? "fill-current" : ""}`} />
    </button>
  );
}
