"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, Popup, useMap, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { Vaga } from "@/lib/api";
import type { Posicao } from "@/lib/filtrosVagas";
import { iconeGrupoVagas, iconeVaga, iconeVagaSelecionada, iconeVoce } from "@/lib/mapaIcones";
import FundoMapa from "@/components/FundoMapa";
import BotaoSalvarVaga from "@/components/BotaoSalvarVaga";
import SeloPcd from "@/components/SeloPcd";
import SeloModalidade from "@/components/SeloModalidade";
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
  rota?: [number, number][] | null; // caminho até a vaga, desenhado como linha azul
  aoMoverMinhaPosicao?: (latitude: number, longitude: number) => void; // ponto "Você" arrastável
  marcandoMinhaPosicao?: boolean; // true = o próximo toque no mapa define onde a pessoa está
  seguirMinhaPosicao?: boolean; // false = não centraliza na pessoa (ex: página da vaga, que enquadra a rota)
  onComoChegar?: (vagaId: string) => void; // com isso, "Como chegar" no balão mostra a rota aqui mesmo
  margemRota?: number; // espaço (px) livre embaixo ao enquadrar a rota, para um painel por cima do mapa
};

const CENTRO_PATOS: [number, number] = [-7.0241, -37.2803];
const LIMITES_PATOS: [[number, number], [number, number]] = [
  [-7.09, -37.35],
  [-6.96, -37.21],
];

// Vagas no mesmo endereço viram um grupo: um pino só, no lugar exato, e o balão lista todas
type GrupoVagas = { chave: string; posicao: [number, number]; vagas: Vaga[] };

function agruparPorLocal(vagas: Vaga[]) {
  const grupos = new Map<string, GrupoVagas>();
  for (const v of vagas) {
    const chave = `${v.latitude.toFixed(5)},${v.longitude.toFixed(5)}`;
    const g = grupos.get(chave);
    if (g) g.vagas.push(v);
    else grupos.set(chave, { chave, posicao: [v.latitude, v.longitude], vagas: [v] });
  }
  const lista = Array.from(grupos.values());
  // posição de cada vaga = posição do seu grupo (para centralizar ao escolher na lista)
  const posicoes = new Map<string, [number, number]>();
  for (const g of lista) for (const v of g.vagas) posicoes.set(v.id, g.posicao);
  return { grupos: lista, posicoes };
}

// Vaga escolhida na lista: leva o mapa até ela e abre o balão
function FocarSelecionada({
  vagaSelecionada,
  marcadores,
  posicoes,
  abrirBalao,
  pausado,
}: {
  abrirBalao: boolean;
  pausado: boolean; // com rota na tela, não mexe no enquadramento
  vagaSelecionada: string | null;
  marcadores: React.RefObject<Map<string, LeafletMarker>>;
  posicoes: Map<string, [number, number]>;
}) {
  const mapa = useMap();
  useEffect(() => {
    if (!vagaSelecionada || pausado) return;
    const pos = posicoes.get(vagaSelecionada);
    if (!pos) return;
    // setView (e não flyTo): com o fundo novo, o flyTo deixava os pinos "flutuando" fora do lugar
    mapa.setView(pos, Math.max(mapa.getZoom(), 16), { animate: true });
    if (!abrirBalao) return;
    const t = setTimeout(() => marcadores.current?.get(vagaSelecionada)?.openPopup(), 400);
    return () => clearTimeout(t);
  }, [vagaSelecionada, mapa, marcadores, posicoes, abrirBalao, pausado]);
  return null;
}

// Chegou a localização do aparelho: centraliza nela (ajuste manual não move o mapa)
function FocarMinhaPosicao({ posicao, desligado }: { posicao?: Posicao | null; desligado?: boolean }) {
  const mapa = useMap();
  useEffect(() => {
    if (posicao && posicao.origem !== "manual" && !desligado) {
      mapa.setView([posicao.latitude, posicao.longitude], 15, { animate: true });
    }
  }, [posicao, mapa, desligado]);
  return null;
}

// Rota nova: enquadra o caminho inteiro na tela
function EnquadrarRota({ rota, margemInferior = 0 }: { rota?: [number, number][] | null; margemInferior?: number }) {
  const mapa = useMap();
  useEffect(() => {
    if (!rota || rota.length < 2) return;
    // o mapinho cresce quando a rota aparece: espera o novo tamanho antes de enquadrar
    const t = setTimeout(() => {
      mapa.invalidateSize();
      mapa.fitBounds(rota, { paddingTopLeft: [32, 32], paddingBottomRight: [32, 32 + margemInferior], maxZoom: 17, animate: true });
    }, 60);
    return () => clearTimeout(t);
  }, [rota, mapa, margemInferior]);
  return null;
}

// Modo "marcar no mapa": o toque define onde a pessoa está
function CliqueMinhaPosicao({ ativo, aoMarcar }: { ativo: boolean; aoMarcar?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (ativo && aoMarcar) aoMarcar(e.latlng.lat, e.latlng.lng);
    },
  });
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

// "Como chegar" no balão: mostra a rota no próprio mapa (aba Mapa) ou leva para a página da vaga
function LinkComoChegar({
  vagaId,
  onComoChegar,
  fecharBalao,
}: {
  vagaId: string;
  onComoChegar?: (vagaId: string) => void;
  fecharBalao: () => void;
}) {
  if (onComoChegar) {
    return (
      <button
        type="button"
        onClick={() => {
          fecharBalao();
          onComoChegar(vagaId);
        }}
        className="text-center text-[#1D6FA5] text-xs font-semibold hover:underline -mt-0.5"
      >
        Como chegar
      </button>
    );
  }
  return (
    <Link href={`/vagas/${vagaId}#rota`} className="text-center !text-[#1D6FA5] text-xs font-semibold hover:underline -mt-0.5">
      Como chegar
    </Link>
  );
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
  rota,
  aoMoverMinhaPosicao,
  marcandoMinhaPosicao = false,
  seguirMinhaPosicao = true,
  onComoChegar,
  margemRota = 0,
}: Props) {
  const marcadores = useRef(new Map<string, LeafletMarker>());
  const { grupos, posicoes } = useMemo(() => agruparPorLocal(vagas), [vagas]);

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
        <FocarSelecionada
          vagaSelecionada={vagaSelecionada}
          marcadores={marcadores}
          posicoes={posicoes}
          abrirBalao={abrirBalaoAoSelecionar}
          pausado={!!rota}
        />
        <FocarMinhaPosicao posicao={minhaPosicao} desligado={!!rota || !seguirMinhaPosicao} />
        <EnquadrarRota rota={rota} margemInferior={margemRota} />
        <CliqueMinhaPosicao ativo={marcandoMinhaPosicao} aoMarcar={aoMoverMinhaPosicao} />

        {rota && rota.length > 1 && (
          <>
            <Polyline positions={rota} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9 }} />
            <Polyline positions={rota} pathOptions={{ color: "#1D6FA5", weight: 5, opacity: 0.95 }} />
          </>
        )}

        {minhaPosicao && (
          <Marker
            position={[minhaPosicao.latitude, minhaPosicao.longitude]}
            icon={iconeVoce}
            zIndexOffset={1000}
            draggable={!!aoMoverMinhaPosicao}
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                aoMoverMinhaPosicao?.(p.lat, p.lng);
              },
            }}
          >
            <Popup>{aoMoverMinhaPosicao ? "Você está aqui. Arraste para ajustar." : "Você está aqui"}</Popup>
          </Marker>
        )}

        {grupos.map((grupo) => {
          const selecionada = grupo.vagas.some((v) => v.id === vagaSelecionada);
          const unica = grupo.vagas.length === 1 ? grupo.vagas[0] : null;
          const paraRota = grupo.vagas.find((v) => v.modalidade !== "remoto");
          const mesmaEmpresa = grupo.vagas.every((v) => v.empresa.nomeEmpresa === grupo.vagas[0].empresa.nomeEmpresa);
          return (
            <Marker
              key={grupo.chave}
              position={grupo.posicao}
              icon={unica ? (selecionada ? iconeVagaSelecionada : iconeVaga) : iconeGrupoVagas(grupo.vagas.length, selecionada)}
              zIndexOffset={selecionada ? 800 : 0}
              ref={(m) => {
                for (const v of grupo.vagas) {
                  if (m) marcadores.current.set(v.id, m);
                  else marcadores.current.delete(v.id);
                }
              }}
              eventHandlers={{
                click: () => {
                  if (!selecionada) onSelecionarVaga(grupo.vagas[0].id);
                },
              }}
            >
              <Popup minWidth={240} maxWidth={290}>
                {unica ? (
                  <div className="flex flex-col gap-2">
                    {/* Logo em destaque no topo do balão */}
                    <div className="flex items-start gap-2.5">
                      <LogoEmpresa
                        logoUrl={unica.empresa.logoUrl}
                        nome={unica.empresa.nomeEmpresa}
                        className="w-14 h-14 rounded-lg shadow-sm"
                        semLogo={<IconeDoCargo cargo={unica.cargo} />}
                      />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-[#0F2C4A] leading-tight !m-0">{unica.cargo}</p>
                        <p className="text-xs text-slate-500 !m-0 mt-0.5">{unica.empresa.nomeEmpresa}</p>
                      </div>
                      <BotaoSalvarVaga vagaId={unica.id} className="-mr-1 -mt-1" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{unica.tipoContrato}</span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{unica.area}</span>
                      <SeloPcd pcd={unica.pcd} pequeno />
                      <SeloModalidade modalidade={unica.modalidade} pequeno />
                    </div>
                    <p className="text-xs text-slate-500 !m-0">
                      📍 {unica.bairro}
                      {unica.salario != null && <> · R$ {unica.salario.toLocaleString("pt-BR")}</>}
                    </p>
                    <Link
                      href={`/vagas/${unica.id}`}
                      className="mt-1 text-center !text-white bg-[#0F2C4A] text-xs font-semibold rounded-md py-2 hover:bg-[#123a63]"
                    >
                      Ver detalhes
                    </Link>
                    {paraRota && (
                      <LinkComoChegar vagaId={paraRota.id} onComoChegar={onComoChegar} fecharBalao={() => marcadores.current.get(paraRota.id)?.closePopup()} />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Cabeçalho: a empresa (ou o local) e quantas vagas tem ali */}
                    <div className="flex items-center gap-2.5">
                      {mesmaEmpresa && (
                        <LogoEmpresa
                          logoUrl={grupo.vagas[0].empresa.logoUrl}
                          nome={grupo.vagas[0].empresa.nomeEmpresa}
                          className="w-11 h-11 rounded-lg shadow-sm"
                          semLogo={<IconeDoCargo cargo={grupo.vagas[0].cargo} />}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F2C4A] leading-tight !m-0">
                          {mesmaEmpresa ? grupo.vagas[0].empresa.nomeEmpresa : "Vagas neste local"}
                        </p>
                        <p className="text-xs text-slate-500 !m-0 mt-0.5">
                          {grupo.vagas.length} vagas abertas · 📍 {grupo.vagas[0].bairro}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto -mx-1 px-1">
                      {grupo.vagas.map((v) => (
                        <div
                          key={v.id}
                          className={`rounded-lg border p-2 ${v.id === vagaSelecionada ? "border-[#0F2C4A]/40 bg-slate-50" : "border-slate-200"}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#0F2C4A] leading-tight !m-0">{v.cargo}</p>
                              {!mesmaEmpresa && <p className="text-[11px] text-slate-500 !m-0">{v.empresa.nomeEmpresa}</p>}
                            </div>
                            <BotaoSalvarVaga vagaId={v.id} className="-mr-1 -mt-1" />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{v.tipoContrato}</span>
                            <SeloPcd pcd={v.pcd} pequeno />
                            <SeloModalidade modalidade={v.modalidade} pequeno />
                            {v.salario != null && (
                              <span className="text-[11px] text-slate-500 px-0.5 py-0.5">R$ {v.salario.toLocaleString("pt-BR")}</span>
                            )}
                          </div>
                          <Link
                            href={`/vagas/${v.id}`}
                            className="mt-1.5 block text-center !text-white bg-[#0F2C4A] text-[11px] font-semibold rounded-md py-1.5 hover:bg-[#123a63]"
                          >
                            Ver detalhes
                          </Link>
                        </div>
                      ))}
                    </div>
                    {paraRota && (
                      <LinkComoChegar vagaId={paraRota.id} onComoChegar={onComoChegar} fecharBalao={() => marcadores.current.get(paraRota.id)?.closePopup()} />
                    )}
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

    </div>
  );
}
