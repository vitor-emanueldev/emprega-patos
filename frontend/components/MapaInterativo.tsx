"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { Vaga } from "@/lib/api";
import type { Posicao } from "@/lib/filtrosVagas";
import { iconeVaga, iconeVagaSelecionada, iconeVoce } from "@/lib/mapaIcones";
import FundoMapa from "@/components/FundoMapa";
import BotaoSalvarVaga from "@/components/BotaoSalvarVaga";
import SeloPcd from "@/components/SeloPcd";
import LogoEmpresa from "@/components/LogoEmpresa";
import { getIconePorCargo } from "@/lib/icones";

// Mapa único do site: aba Mapa, página inicial e página da vaga usam este mesmo componente.
// Mudou aqui, muda em todos.

type Props = {
  vagas: Vaga[];
  vagaSelecionada: string | null;
  onSelecionarVaga: (id: string) => void;
  minhaPosicao?: Posicao | null;
  mostrarLegenda?: boolean; // sem efeito: a legenda saiu junto com os pontos de referência (o fundo já mostra os lugares)
  abrirBalaoAoSelecionar?: boolean; // false = só centraliza na vaga, sem abrir o balão
};

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
  abrirBalao,
}: {
  abrirBalao: boolean;
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
    if (!abrirBalao) return;
    const t = setTimeout(() => marcadores.current?.get(vagaSelecionada)?.openPopup(), 650);
    return () => clearTimeout(t);
  }, [vagaSelecionada, mapa, marcadores, posicoes, abrirBalao]);
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

// Sem logo: o mesmo ícone do cargo usado na lista
function IconeDoCargo({ cargo }: { cargo: string }) {
  const Icone = getIconePorCargo(cargo);
  return (
    <div className="w-14 h-14 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
      <Icone className="w-6 h-6 text-[#0F2C4A]" />
    </div>
  );
}

export default function MapaInterativo({
  vagas,
  vagaSelecionada,
  onSelecionarVaga,
  minhaPosicao,
  abrirBalaoAoSelecionar = true,
}: Props) {
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
        <FundoMapa />
        <AjustarTamanho />
        <FocarSelecionada vagaSelecionada={vagaSelecionada} marcadores={marcadores} posicoes={posicoes} abrirBalao={abrirBalaoAoSelecionar} />
        <FocarMinhaPosicao posicao={minhaPosicao} />

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
              <Popup minWidth={240} maxWidth={280}>
                <div className="flex flex-col gap-2">
                  {/* Logo em destaque no topo do balão */}
                  <div className="flex items-start gap-2.5">
                    <LogoEmpresa
                      logoUrl={vaga.empresa.logoUrl}
                      nome={vaga.empresa.nomeEmpresa}
                      className="w-14 h-14 rounded-lg shadow-sm"
                      semLogo={<IconeDoCargo cargo={vaga.cargo} />}
                    />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-[#0F2C4A] leading-tight !m-0">{vaga.cargo}</p>
                      <p className="text-xs text-slate-500 !m-0 mt-0.5">{vaga.empresa.nomeEmpresa}</p>
                    </div>
                    <BotaoSalvarVaga vagaId={vaga.id} className="-mr-1 -mt-1" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.tipoContrato}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.area}</span>
                    <SeloPcd pcd={vaga.pcd} pequeno />
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

    </div>
  );
}
