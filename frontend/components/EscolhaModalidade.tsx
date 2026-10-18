"use client";

import { MODALIDADES, type Modalidade } from "@/lib/opcoesVaga";

// Presencial / Híbrido / Remoto, no mesmo estilo dos botões de tipo de contrato
export default function EscolhaModalidade({
  valor,
  aoMudar,
  py = "py-3",
}: {
  valor: Modalidade;
  aoMudar: (m: Modalidade) => void;
  py?: string;
}) {
  const atual = MODALIDADES.find((m) => m.valor === valor);
  return (
    <div>
      <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Modalidade *</label>
      <div className="grid grid-cols-3 gap-3">
        {MODALIDADES.map((m) => (
          <button
            key={m.valor}
            type="button"
            onClick={() => aoMudar(m.valor)}
            aria-pressed={valor === m.valor}
            className={`rounded-md border px-3 ${py} text-sm font-medium transition-colors ${
              valor === m.valor
                ? "border-[#0F2C4A] bg-[#0F2C4A]/5 text-[#0F2C4A]"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {m.rotulo}
          </button>
        ))}
      </div>
      {atual && <p className="text-xs text-slate-400 mt-1">{atual.explicacao}</p>}
    </div>
  );
}
