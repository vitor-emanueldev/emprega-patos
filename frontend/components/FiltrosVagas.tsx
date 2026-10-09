"use client";

import { useState } from "react";
import { FAIXAS_SALARIO, FILTROS_VAZIOS, contarFiltrosAtivos, type Filtros } from "@/lib/filtrosVagas";

type Props = {
  filtros: Filtros;
  setFiltros: (f: Filtros) => void;
  opcoes: { contratos: string[]; areas: string[]; bairros: string[] };
};

function alternar(lista: string[], item: string) {
  return lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item];
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
        ativo ? "bg-[#0F2C4A] text-white border-[#0F2C4A]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// Lista com "ver mais" quando há muitas opções (ex: áreas e bairros)
function ListaChips({ opcoes, selecionadas, aoAlternar, limite = 8 }: { opcoes: string[]; selecionadas: string[]; aoAlternar: (o: string) => void; limite?: number }) {
  const [todas, setTodas] = useState(false);
  const visiveis = todas ? opcoes : opcoes.slice(0, limite);
  // Mantém visíveis as já marcadas, mesmo se estiverem depois do limite
  const extras = todas ? [] : selecionadas.filter((s) => !visiveis.includes(s));
  return (
    <>
      {[...visiveis, ...extras].map((o) => (
        <Chip key={o} ativo={selecionadas.includes(o)} onClick={() => aoAlternar(o)}>
          {o}
        </Chip>
      ))}
      {opcoes.length > limite && (
        <button type="button" onClick={() => setTodas(!todas)} className="text-xs font-semibold text-[#1D6FA5] px-2 py-1.5 hover:underline">
          {todas ? "Ver menos" : `+${opcoes.length - limite} mais`}
        </button>
      )}
    </>
  );
}

// Só os grupos de filtro (a busca e o layout ficam com cada página)
export default function FiltrosVagas({ filtros, setFiltros, opcoes }: Props) {
  const ativos = contarFiltrosAtivos(filtros);

  return (
    <div className="space-y-5">
      {opcoes.contratos.length > 0 && (
        <Grupo titulo="Tipo de contrato">
          {opcoes.contratos.map((c) => (
            <Chip key={c} ativo={filtros.contratos.includes(c)} onClick={() => setFiltros({ ...filtros, contratos: alternar(filtros.contratos, c) })}>
              {c}
            </Chip>
          ))}
        </Grupo>
      )}

      {opcoes.areas.length > 0 && (
        <Grupo titulo="Área / função">
          <ListaChips opcoes={opcoes.areas} selecionadas={filtros.areas} aoAlternar={(a) => setFiltros({ ...filtros, areas: alternar(filtros.areas, a) })} />
        </Grupo>
      )}

      <Grupo titulo="Salário">
        {FAIXAS_SALARIO.map((f) => (
          <Chip key={f.rotulo} ativo={filtros.salarioMin === f.valor} onClick={() => setFiltros({ ...filtros, salarioMin: f.valor })}>
            {f.rotulo}
          </Chip>
        ))}
      </Grupo>

      {opcoes.bairros.length > 1 && (
        <Grupo titulo="Bairro">
          <ListaChips opcoes={opcoes.bairros} selecionadas={filtros.bairros} aoAlternar={(b) => setFiltros({ ...filtros, bairros: alternar(filtros.bairros, b) })} />
        </Grupo>
      )}

      {ativos > 0 && (
        <button
          type="button"
          onClick={() => setFiltros({ ...FILTROS_VAZIOS, busca: filtros.busca })}
          className="text-sm font-semibold text-[#1D6FA5] hover:underline"
        >
          Limpar filtros ({ativos})
        </button>
      )}
    </div>
  );
}
