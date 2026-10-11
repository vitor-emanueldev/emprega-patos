"use client";

import { useLayoutEffect, useRef } from "react";
import { Plus, X } from "lucide-react";

type Props = {
  itens: string[];
  aoMudar: (itens: string[]) => void;
  placeholder?: string;
  textoAdicionar?: string;
  max?: number;
};

// Lista editável: cada item é um campo, com "+ Adicionar" e "x" para remover.
// Enter no último campo cria o próximo.
export default function ListaItens({ itens, aoMudar, placeholder, textoAdicionar = "Adicionar", max = 30 }: Props) {
  const campos = useRef<(HTMLInputElement | null)[]>([]);
  const focarDepois = useRef<number | null>(null);
  const lista = itens.length ? itens : [""];

  // Foca o campo novo assim que ele aparece na tela (antes da próxima tecla)
  useLayoutEffect(() => {
    if (focarDepois.current !== null) {
      campos.current[focarDepois.current]?.focus();
      focarDepois.current = null;
    }
  });

  function focar(indice: number) {
    focarDepois.current = indice;
  }

  function adicionar() {
    if (lista.length >= max) return;
    focar(lista.length);
    aoMudar([...lista, ""]);
  }

  function alterar(indice: number, valor: string) {
    aoMudar(lista.map((item, i) => (i === indice ? valor : item)));
  }

  function remover(indice: number) {
    const nova = lista.filter((_, i) => i !== indice);
    aoMudar(nova.length ? nova : [""]);
  }

  return (
    <div className="space-y-2">
      {lista.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0A93C] shrink-0" />
          <input
            ref={(el) => {
              campos.current[i] = el;
            }}
            value={item}
            onChange={(e) => alterar(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (item.trim()) adicionar();
              }
            }}
            placeholder={i === 0 ? placeholder : ""}
            maxLength={300}
            className="flex-1 rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
          />
          <button
            type="button"
            onClick={() => remover(i)}
            aria-label="Remover item"
            className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {lista.length < max && (
        <button
          type="button"
          onClick={adicionar}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1D6FA5] hover:underline ml-3.5"
        >
          <Plus className="w-4 h-4" />
          {textoAdicionar}
        </button>
      )}
    </div>
  );
}

// Tira os itens vazios e repetidos antes de enviar
export function limparLista(itens: string[]) {
  const vistos = new Set<string>();
  return itens
    .map((i) => i.trim())
    .filter((i) => {
      if (!i || vistos.has(i.toLowerCase())) return false;
      vistos.add(i.toLowerCase());
      return true;
    });
}
