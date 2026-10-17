"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, LocateFixed, MapPin, Navigation, X } from "lucide-react";
import type { Vaga } from "@/lib/api";
import { useMinhaLocalizacao } from "@/lib/useMinhaLocalizacao";
import { useRota } from "@/lib/useRota";
import ResumoRota, { linkGoogleMaps } from "@/components/ResumoRota";

const MapaInterativo = dynamic(() => import("@/components/MapaInterativo"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-100 flex items-center justify-center text-sm text-slate-400">Carregando mapa...</div>
  ),
});

// Mapinho da página da vaga + "Como chegar": rota de carro desenhada pelas ruas,
// distância, tempo de carro e tempo estimado a pé.
export default function ComoChegar({ vaga }: { vaga: Vaga }) {
  const local = useMinhaLocalizacao();
  const [marcando, setMarcando] = useState(false);

  const posicao = local.posicao;
  // lista estável: senão o mapa "volta" para a vaga a cada atualização e desfaz o enquadramento da rota
  const vagas = useMemo(() => [vaga], [vaga]);

  const { rota, calculando, erro: erroRota } = useRota(vaga.id, posicao);

  // Veio do botão "Como chegar" do mapa: rola até aqui
  useEffect(() => {
    if (window.location.hash === "#rota") {
      document.getElementById("rota")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  function marcarNoMapa(lat: number, lng: number) {
    local.definir(lat, lng);
    setMarcando(false);
  }

  function limpar() {
    local.limpar();
    setMarcando(false);
  }

  const linkGoogle = linkGoogleMaps(vaga, posicao);

  const imprecisa = posicao?.origem === "gps" && (posicao.precisaoM ?? 0) > 300;
  const botao =
    "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-colors";

  return (
    <div id="rota" className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`relative ${marcando ? "cursor-crosshair" : ""}`} style={{ height: posicao || marcando ? 300 : 192 }}>
        <MapaInterativo
          vagas={vagas}
          vagaSelecionada={vaga.id}
          onSelecionarVaga={() => {}}
          mostrarLegenda={false}
          abrirBalaoAoSelecionar={false}
          minhaPosicao={posicao}
          rota={rota?.caminho}
          aoMoverMinhaPosicao={local.definir}
          marcandoMinhaPosicao={marcando}
          seguirMinhaPosicao={false}
        />
        {marcando && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-[#0F2C4A] text-white text-xs font-semibold rounded-full px-3 py-1.5 shadow">
            Toque no mapa onde você está
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold text-[#0F2C4A] flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-[#1D6FA5]" /> Como chegar
        </p>

        {!posicao && (
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setMarcando(false);
                local.pedir();
              }}
              disabled={local.buscando}
              className={`${botao} border-[#0F2C4A] bg-[#0F2C4A] text-white hover:bg-[#123a63] disabled:opacity-60`}
            >
              {local.buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              Minha localização
            </button>
            <button
              type="button"
              onClick={() => setMarcando(!marcando)}
              className={`${botao} ${
                marcando ? "border-[#1D6FA5] bg-[#1D6FA5]/10 text-[#1D6FA5]" : "border-slate-200 text-[#0F2C4A] hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-4 h-4" />
              {marcando ? "Cancelar" : "Marcar no mapa"}
            </button>
          </div>
        )}

        {local.erro && <p className="text-xs text-red-600">{local.erro}</p>}

        {posicao && <ResumoRota rota={rota} calculando={calculando} erro={erroRota} />}

        {imprecisa && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Sua localização pode estar imprecisa (comum no computador). Arraste o ponto azul até onde você está.
          </p>
        )}
        {posicao && !imprecisa && (
          <p className="text-xs text-slate-400">Saindo de outro lugar? Arraste o ponto azul no mapa.</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href={linkGoogle}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1D6FA5] hover:underline"
          >
            Abrir no Google Maps
          </a>
          {posicao && (
            <button type="button" onClick={limpar} className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Limpar rota
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
