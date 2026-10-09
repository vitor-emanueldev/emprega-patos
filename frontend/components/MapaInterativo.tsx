"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { Vaga } from "@/lib/api";
import type { Posicao } from "@/lib/filtrosVagas";
import {
  iconeVaga,
  iconeVagaSelecionada,
  iconeVoce,
  iconeHospital,
  iconeFaculdade,
  iconeShopping,
  iconeFarmacia,
  iconeEmergencia,
  iconeSupermercado,
} from "@/lib/mapaIcones";
import { PONTOS_REFERENCIA } from "@/lib/pontosReferencia";

// Mapa da aba "Mapa" (o mapa da página inicial e da página da vaga continua sendo o MapaVagas)

type Props = {
  vagas: Vaga[];
  vagaSelecionada: string | null;
  onSelecionarVaga: (id: string) => void;
  minhaPosicao?: Posicao | null;
};

const iconesReferencia = {
  hospital: iconeHospital,
  faculdade: iconeFaculdade,
  shopping: iconeShopping,
  farmacia: iconeFarmacia,
  emergencia: iconeEmergencia,
  supermercado: iconeSupermercado,
};

const LEGENDA = [
  { cor: "#F0A93C", rotulo: "Vaga" },
  { cor: "#E24C4C", rotulo: "Saúde" },
  { cor: "#22A06B", rotulo: "Farmácia" },
  { cor: "#E8813A", rotulo: "Emergência" },
  { cor: "#0E9488", rotulo: "Supermercado" },
  { cor: "#8E5FC9", rotulo: "Shopping" },
  { cor: "#1D6FA5", rotulo: "Faculdade" },
];

const CENTRO_PATOS: [number, number] = [-7.0241, -37.2803];
const LIMITES_PATOS: [[number, number], [number, number]] = [
  [-7.09, -37.35],
  [-6.96, -37.21],
];

// Vagas no mesmo endereço ficariam uma em cima da outra: espalha em círculo pequeno (~40 m)
function posicoesSemSobreposicao(vagas: Vaga[]) {
  const grupos = new Map<string, Vaga[]>();
  for (const v of vagas) {
    const chave = `${v.latitude.toFixed(5)},${v.longitude.toFixed(5)}`;
    grupos.set(chave, [...(grupos.get(chave) || []), v]);
  }
  const posicoes = new Map<string, [number, number]>();
  for (const grupo of grupos.values()) {
    grupo.forEach((v, i) => {
      if (grupo.length === 1) return posicoes.set(v.id, [v.latitude, v.longitude]);
      const angulo = (2 * Math.PI * i) / grupo.length;
      posicoes.set(v.id, [v.latitude + 0.00035 * Math.sin(angulo), v.longitude + 0.00035 * Math.cos(angulo)]);
    });
  }
  return posicoes;
}

// Vaga escolhida na lista: leva o mapa até ela e abre o balão
function FocarSelecionada({
  vagaSelecionada,
  marcadores,
  posicoes,
}: {
  vagaSelecionada: string | null;
  marcadores: React.RefObject<Map<string, LeafletMarker>>;
  posicoes: Map<string, [number, number]>;
}) {
  const mapa = useMap();
  useEffect(() => {
    if (!vagaSelecionada) return;
    const pos = posicoes.get(vagaSelecionada);
    if (!pos) return;
    mapa.flyTo(pos, Math.max(mapa.getZoom(), 16), { duration: 0.6 });
    const t = setTimeout(() => marcadores.current?.get(vagaSelecionada)?.openPopup(), 650);
    return () => clearTimeout(t);
  }, [vagaSelecionada, mapa, marcadores, posicoes]);
  return null;
}

// Chegou a localização da pessoa: centraliza nela
function FocarMinhaPosicao({ posicao }: { posicao?: Posicao | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (posicao) mapa.flyTo([posicao.latitude, posicao.longitude], 15, { duration: 0.8 });
  }, [posicao, mapa]);
  return null;
}

// O Leaflet precisa saber quando o tamanho da área do mapa muda (ex: trocar Lista/Mapa no celular)
function AjustarTamanho() {
  const mapa = useMap();
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}

export default function MapaInterativo({ vagas, vagaSelecionada, onSelecionarVaga, minhaPosicao }: Props) {
  const [mostrarReferencias, setMostrarReferencias] = useState(true);
  const marcadores = useRef(new Map<string, LeafletMarker>());
  const posicoes = useMemo(() => posicoesSemSobreposicao(vagas), [vagas]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden isolate">
      <MapContainer
        center={CENTRO_PATOS}
        zoom={13}
        minZoom={12}
        maxBounds={LIMITES_PATOS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <AjustarTamanho />
        <FocarSelecionada vagaSelecionada={vagaSelecionada} marcadores={marcadores} posicoes={posicoes} />
        <FocarMinhaPosicao posicao={minhaPosicao} />

        {mostrarReferencias &&
          PONTOS_REFERENCIA.map((ponto) => (
            <Marker key={ponto.id} position={[ponto.latitude, ponto.longitude]} icon={iconesReferencia[ponto.tipo]} zIndexOffset={-500}>
              <Popup>{ponto.nome}</Popup>
            </Marker>
          ))}

        {minhaPosicao && (
          <Marker position={[minhaPosicao.latitude, minhaPosicao.longitude]} icon={iconeVoce} zIndexOffset={1000}>
            <Popup>Você está aqui</Popup>
          </Marker>
        )}

        {vagas.map((vaga) => {
          const selecionada = vaga.id === vagaSelecionada;
          return (
            <Marker
              key={vaga.id}
              position={posicoes.get(vaga.id) ?? [vaga.latitude, vaga.longitude]}
              icon={selecionada ? iconeVagaSelecionada : iconeVaga}
              zIndexOffset={selecionada ? 800 : 0}
              ref={(m) => {
                if (m) marcadores.current.set(vaga.id, m);
                else marcadores.current.delete(vaga.id);
              }}
              eventHandlers={{ click: () => onSelecionarVaga(vaga.id) }}
            >
              <Popup minWidth={220} maxWidth={260}>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-[#0F2C4A] leading-tight !m-0">{vaga.cargo}</p>
                  <p className="text-xs text-slate-500 !m-0">{vaga.empresa.nomeEmpresa}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.tipoContrato}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.area}</span>
                  </div>
                  <p className="text-xs text-slate-500 !m-0">
                    📍 {vaga.bairro}
                    {vaga.salario != null && <> · R$ {vaga.salario.toLocaleString("pt-BR")}</>}
                  </p>
                  <Link
                    href={`/vagas/${vaga.id}`}
                    className="mt-1 text-center !text-white bg-[#0F2C4A] text-xs font-semibold rounded-md py-2 hover:bg-[#123a63]"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legenda: dá para esconder os pontos de referência para ver só as vagas */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 rounded-lg shadow-md p-3 text-xs max-w-[180px]">
        <div className="space-y-1.5">
          {(mostrarReferencias ? LEGENDA : LEGENDA.slice(0, 1)).map((l) => (
            <div key={l.rotulo} className="flex items-center gap-2 text-[#0F2C4A] font-medium">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.cor }} />
              {l.rotulo}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMostrarReferencias(!mostrarReferencias)}
          className="mt-2 pt-2 border-t border-slate-200 w-full text-left text-[11px] font-semibold text-[#1D6FA5] hover:underline"
        >
          {mostrarReferencias ? "Esconder pontos de referência" : "Mostrar pontos de referência"}
        </button>
      </div>
    </div>
  );
}
