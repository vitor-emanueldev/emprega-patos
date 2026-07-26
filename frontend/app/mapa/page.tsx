"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { listarVagas, type Vaga } from "@/lib/api";


// Import dinâmico sem SSR — Leaflet (quando entrar) depende do window
const MapaVagas = dynamic(() => import("@/components/MapaVagas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400">
      Carregando mapa...
    </div>
  ),
});

const FILTROS_CONTRATO = ["Todos", "CLT", "PJ / Freelance", "Temporário"];

export default function MapaPage() {
    const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("Todos");
  const [vagaSelecionada, setVagaSelecionada] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarVagas();
        setVagas(dados);
      } catch (e: any) {
        setErro(e.message || "Não foi possível carregar as vagas.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const vagasFiltradas = vagas.filter((vaga) => {
    const bateBusca =
      busca.trim() === "" ||
      vaga.cargo.toLowerCase().includes(busca.toLowerCase()) ||
      vaga.empresa.nomeEmpresa.toLowerCase().includes(busca.toLowerCase());

    const bateContrato =
      filtroContrato === "Todos" || vaga.tipoContrato === filtroContrato;

    return bateBusca && bateContrato;
  });

  return (
    <div className="h-screen flex flex-col bg-[#0F2C4A]">
      <Header />

      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Barra de filtros */}
        <div className="bg-white rounded-xl shadow-md p-3 flex flex-col sm:flex-row gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cargo ou empresa..."
            className="flex-1 rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
          />
          <div className="flex gap-2 overflow-x-auto">
            {FILTROS_CONTRATO.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroContrato(tipo)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  filtroContrato === tipo
                    ? "bg-[#0F2C4A] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo: lista + mapa */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          {/* Lista de vagas */}
          <div className="bg-white rounded-xl shadow-md overflow-y-auto">
            {carregando && (
              <p className="text-sm text-slate-400 text-center py-10">Carregando vagas...</p>
            )}

            {!carregando && erro && (
              <p className="text-sm text-red-600 text-center py-10 px-4">{erro}</p>
            )}

            {!carregando && !erro && vagasFiltradas.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-sm font-medium text-[#0F2C4A]">Nenhuma vaga encontrada</p>
                <p className="text-xs text-slate-400 mt-1">Tente ajustar a busca ou o filtro de contrato.</p>
              </div>
            )}

            <ul className="divide-y divide-slate-100">
              {vagasFiltradas.map((vaga) => (
                <li key={vaga.id}>
                  <button
                    onClick={() => setVagaSelecionada(vaga.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                      vagaSelecionada === vaga.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#0F2C4A]">{vaga.cargo}</p>
                    <p className="text-xs text-slate-500">{vaga.empresa.nomeEmpresa}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                        {vaga.tipoContrato}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                        {vaga.area}
                      </span>
                    </div>
                    {vaga.salario && (
                      <p className="text-xs font-medium text-[#1D6FA5] mt-1.5">
                        R$ {vaga.salario.toLocaleString("pt-BR")}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mapa */}
          <div className="min-h-[320px]">
            <MapaVagas
              vagas={vagasFiltradas}
              vagaSelecionada={vagaSelecionada}
              onSelecionarVaga={setVagaSelecionada}
            />
          </div>
        </div>
      </main>
    </div>
  );
}