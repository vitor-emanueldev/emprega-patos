"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { List, Loader2, LocateFixed, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/Header";
import BotaoSalvarVaga from "@/components/BotaoSalvarVaga";
import { listarVagas, type Vaga } from "@/lib/api";
import { getIconePorCargo } from "@/lib/icones";
import { formatarDistancia } from "@/lib/formatar";
import {
  FAIXAS_SALARIO,
  FILTROS_VAZIOS,
  aplicarFiltros,
  contarFiltrosAtivos,
  opcoesDosFiltros,
  type Filtros,
  type VagaComDistancia,
} from "@/lib/filtrosVagas";
import { useMinhaLocalizacao } from "@/lib/useMinhaLocalizacao";
import { useTelaGrande } from "@/lib/useTelaGrande";

// Leaflet usa "window", então o mapa só carrega no navegador
const MapaInterativo = dynamic(() => import("@/components/MapaInterativo"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400">Carregando mapa...</div>
  ),
});

const classeSelect =
  "rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]";

function alternar(lista: string[], item: string) {
  return lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item];
}

export default function MapaPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [vagaSelecionada, setVagaSelecionada] = useState<string | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false); // celular
  const [visaoCelular, setVisaoCelular] = useState<"mapa" | "lista">("mapa");
  const localizacao = useMinhaLocalizacao();
  const telaGrande = useTelaGrande();

  useEffect(() => {
    listarVagas()
      .then(setVagas)
      .catch((e) => setErro(e.message || "Não foi possível carregar as vagas."))
      .finally(() => setCarregando(false));
  }, []);

  const opcoes = useMemo(() => opcoesDosFiltros(vagas), [vagas]);
  const filtradas = useMemo(() => aplicarFiltros(vagas, filtros, localizacao.posicao), [vagas, filtros, localizacao.posicao]);
  const ativos = contarFiltrosAtivos(filtros);
  const mudar = (parcial: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...parcial }));

  // Se a vaga selecionada sumiu por causa de um filtro, tira a seleção
  useEffect(() => {
    if (vagaSelecionada && !filtradas.some((v) => v.id === vagaSelecionada)) setVagaSelecionada(null);
  }, [filtradas, vagaSelecionada]);

  // ─── Pedaços da tela ───

  const campoBusca = (
    <div className="relative flex-1">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={filtros.busca}
        onChange={(e) => mudar({ busca: e.target.value })}
        placeholder="Buscar por cargo, empresa ou bairro..."
        className="w-full rounded-md bg-slate-100 border border-slate-200 pl-9 pr-9 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
      />
      {filtros.busca && (
        <button onClick={() => mudar({ busca: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Limpar busca">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const botaoPertoDeMim = (
    <button
      type="button"
      onClick={localizacao.posicao ? localizacao.limpar : localizacao.pedir}
      disabled={localizacao.buscando}
      className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        localizacao.posicao ? "bg-[#1D6FA5] text-white" : "bg-white text-[#0F2C4A] border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {localizacao.buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
      {localizacao.posicao ? "Perto de mim ✓" : "Perto de mim"}
    </button>
  );

  const camposFiltro = (
    <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-end gap-3">
      {opcoes.contratos.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-slate-500 mb-1">Tipo de contrato</p>
          <div className="flex flex-wrap gap-1.5">
            {opcoes.contratos.map((c) => {
              const ativo = filtros.contratos.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => mudar({ contratos: alternar(filtros.contratos, c) })}
                  aria-pressed={ativo}
                  className={`text-xs font-medium rounded-md px-3 py-2 border transition-colors ${
                    ativo ? "bg-[#0F2C4A] text-white border-[#0F2C4A]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:flex gap-3">
        <div className="lg:min-w-[190px]">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Categoria</label>
          <select value={filtros.categoria} onChange={(e) => mudar({ categoria: e.target.value })} className={`w-full ${classeSelect}`}>
            <option value="">Todas</option>
            {opcoes.categorias.map((c) => (
              <option key={c.nome} value={c.nome}>
                {c.nome} ({c.total})
              </option>
            ))}
          </select>
        </div>

        <div className="lg:min-w-[160px]">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Bairro</label>
          <select value={filtros.bairro} onChange={(e) => mudar({ bairro: e.target.value })} className={`w-full ${classeSelect}`}>
            <option value="">Todos</option>
            {opcoes.bairros.map((b) => (
              <option key={b.nome} value={b.nome}>
                {b.nome} ({b.total})
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 lg:col-span-1 lg:min-w-[150px]">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Salário mínimo</label>
          <select
            value={filtros.salarioMin ?? ""}
            onChange={(e) => mudar({ salarioMin: e.target.value ? Number(e.target.value) : null })}
            className={`w-full ${classeSelect}`}
          >
            {FAIXAS_SALARIO.map((f) => (
              <option key={f.rotulo} value={f.valor ?? ""}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ativos > 0 && (
        <button
          onClick={() => setFiltros({ ...FILTROS_VAZIOS, busca: filtros.busca })}
          className="self-start lg:self-end whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-[#1D6FA5] hover:bg-slate-100 transition-colors"
        >
          Limpar filtros ({ativos})
        </button>
      )}
    </div>
  );

  const resumo = (
    <p className="text-xs text-slate-500">
      {carregando
        ? "Carregando vagas..."
        : `${filtradas.length} de ${vagas.length} ${vagas.length === 1 ? "vaga" : "vagas"}${localizacao.posicao ? " · mais perto primeiro" : ""}`}
    </p>
  );

  const itemDaLista = (vaga: VagaComDistancia, irParaMapa: boolean) => {
    const Icone = getIconePorCargo(vaga.cargo);
    const selecionada = vagaSelecionada === vaga.id;
    return (
      <li key={vaga.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setVagaSelecionada(vaga.id);
            if (irParaMapa) setVisaoCelular("mapa");
          }}
          onKeyDown={(e) => e.key === "Enter" && setVagaSelecionada(vaga.id)}
          className={`w-full text-left px-4 py-3 cursor-pointer transition-colors border-l-4 ${
            selecionada ? "bg-amber-50/60 border-[#F0A93C]" : "border-transparent hover:bg-slate-50"
          }`}
        >
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
              <Icone className="w-4 h-4 text-[#0F2C4A]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0F2C4A] truncate">{vaga.cargo}</p>
              <p className="text-xs text-slate-500 truncate">{vaga.empresa.nomeEmpresa}</p>
            </div>
            <BotaoSalvarVaga vagaId={vaga.id} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pl-10">
            <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.tipoContrato}</span>
            <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.area}</span>
            <span className="text-[11px] text-slate-500">
              📍 {vaga.bairro}
              {vaga.distanciaKm != null && <strong className="text-[#0F2C4A]"> · {formatarDistancia(vaga.distanciaKm)}</strong>}
            </span>
          </div>
          <p className="text-xs font-medium text-[#1D6FA5] mt-1.5 pl-10">
            {vaga.salario != null ? `R$ ${vaga.salario.toLocaleString("pt-BR")}` : "Salário a combinar"}
          </p>
          {selecionada && (
            <Link
              href={`/vagas/${vaga.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 ml-10 inline-block bg-[#F0A93C] text-white text-xs font-semibold rounded-md px-4 py-2 hover:bg-[#dd9a30]"
            >
              Ver detalhes da vaga
            </Link>
          )}
        </div>
      </li>
    );
  };

  const lista = (irParaMapa: boolean) => (
    <>
      {erro && <p className="text-sm text-red-600 text-center py-10 px-4">{erro}</p>}
      {carregando && <p className="text-sm text-slate-400 text-center py-10">Carregando vagas...</p>}
      {!carregando && !erro && filtradas.length === 0 && (
        <div className="text-center py-10 px-4">
          <p className="text-sm font-medium text-[#0F2C4A]">Nenhuma vaga encontrada</p>
          <p className="text-xs text-slate-400 mt-1">Tente outra busca ou limpe os filtros.</p>
        </div>
      )}
      <ul className="divide-y divide-slate-100">{filtradas.map((v) => itemDaLista(v, irParaMapa))}</ul>
    </>
  );

  const mapa = (
    <MapaInterativo
      vagas={filtradas}
      vagaSelecionada={vagaSelecionada}
      onSelecionarVaga={setVagaSelecionada}
      minhaPosicao={localizacao.posicao}
    />
  );

  return (
    <div className="h-dvh flex flex-col bg-[#0F2C4A]">
      <Header />

      {/* ─── Computador ─── */}
      {telaGrande === true && (
        <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 py-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
            <div className="flex gap-3">
              {campoBusca}
              {botaoPertoDeMim}
            </div>
            {camposFiltro}
            {localizacao.erro && <p className="text-xs text-red-600">{localizacao.erro}</p>}
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-[380px_1fr] gap-4">
            <div className="bg-white rounded-xl shadow-md flex flex-col min-h-0">
              <div className="px-4 py-2.5 border-b border-slate-100">{resumo}</div>
              <div className="flex-1 overflow-y-auto">{lista(false)}</div>
            </div>
            <div className="min-h-0 rounded-xl shadow-md">{mapa}</div>
          </div>
        </main>
      )}

      {/* ─── Celular ─── */}
      {telaGrande === false && (
        <main className="flex-1 min-h-0 flex flex-col px-3 py-3 gap-3">
          <div className="bg-white rounded-xl shadow-md p-3 space-y-3">
            {campoBusca}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  filtrosAbertos || ativos > 0 ? "bg-[#0F2C4A] text-white" : "bg-white text-[#0F2C4A] border border-slate-200"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros{ativos > 0 && ` (${ativos})`}
              </button>
              {botaoPertoDeMim}
            </div>
            {localizacao.erro && <p className="text-xs text-red-600">{localizacao.erro}</p>}
            {filtrosAbertos && <div className="pt-1 border-t border-slate-100">{camposFiltro}</div>}

            <div className="grid grid-cols-2 bg-slate-100 rounded-lg p-1 text-sm font-semibold">
              {(["mapa", "lista"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisaoCelular(v)}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
                    visaoCelular === v ? "bg-white text-[#0F2C4A] shadow-sm" : "text-slate-500"
                  }`}
                >
                  {v === "mapa" ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  {v === "mapa" ? "Mapa" : `Lista (${filtradas.length})`}
                </button>
              ))}
            </div>
          </div>

          {visaoCelular === "mapa" ? (
            <div className="flex-1 min-h-[320px] rounded-xl shadow-md">{mapa}</div>
          ) : (
            <div className="flex-1 min-h-0 bg-white rounded-xl shadow-md flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-100">{resumo}</div>
              <div className="flex-1 overflow-y-auto">{lista(true)}</div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
