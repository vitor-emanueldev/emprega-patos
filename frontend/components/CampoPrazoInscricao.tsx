"use client";

import { formatarDataPrazo, hojeEmPatos, somarDias } from "@/lib/prazoVaga";

// Campo "Inscrições até" (opcional) para publicar/editar vaga.
// valor: "AAAA-MM-DD" ou "" (sem prazo)
export default function CampoPrazoInscricao({
  valor,
  aoMudar,
  classeCampo,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  classeCampo: string;
}) {
  const hoje = hojeEmPatos();
  const maximo = somarDias(hoje, 365);
  const atalhos = [
    { rotulo: "Sem prazo", valor: "" },
    { rotulo: "7 dias", valor: somarDias(hoje, 7) },
    { rotulo: "15 dias", valor: somarDias(hoje, 15) },
    { rotulo: "30 dias", valor: somarDias(hoje, 30) },
  ];

  return (
    <div>
      <label htmlFor="inscricoes-ate" className="block text-sm text-[#0F2C4A] font-medium mb-1">
        Inscrições até <span className="font-normal text-slate-400">(opcional)</span>
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {atalhos.map((a) => (
          <button
            key={a.rotulo}
            type="button"
            onClick={() => aoMudar(a.valor)}
            aria-pressed={valor === a.valor}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
              valor === a.valor
                ? "bg-[#0F2C4A] text-white border-[#0F2C4A]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <input
        id="inscricoes-ate"
        type="date"
        value={valor}
        min={hoje}
        max={maximo}
        onChange={(e) => aoMudar(e.target.value)}
        className={`${classeCampo} sm:max-w-xs`}
      />
      <p className="text-xs text-slate-500 mt-1.5">
        {valor && valor < hoje
          ? "Essa data já passou. Escolha uma nova data ou \"Sem prazo\" para reabrir as inscrições."
          : valor
          ? `A vaga recebe candidaturas até ${formatarDataPrazo(valor)} e depois sai do mapa sozinha. Você pode estender a data quando quiser.`
          : "Sem prazo: a vaga fica aberta até você encerrar."}
      </p>
    </div>
  );
}
