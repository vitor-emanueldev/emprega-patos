"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type { Vaga } from "@/lib/api";
import { iconeVaga, iconeHospital, iconeFaculdade, iconeShopping, iconeFarmacia, iconeEmergencia, iconeSupermercado } from "@/lib/mapaIcones";
import { PONTOS_REFERENCIA } from "@/lib/pontosReferencia";

type Props = {
  vagas: Vaga[];
  vagaSelecionada: string | null;
  onSelecionarVaga: (id: string) => void;
  mostrarLegenda?: boolean;
};

const iconesReferencia = {
  hospital: iconeHospital,
  faculdade: iconeFaculdade,
  shopping: iconeShopping,
  farmacia: iconeFarmacia,
  emergencia: iconeEmergencia,
  supermercado: iconeSupermercado,
};

const LIMITES_PATOS: [[number, number], [number, number]] = [
  [-7.09, -37.35],
  [-6.96, -37.21],
];

export default function MapaVagas({ vagas, vagaSelecionada, onSelecionarVaga, mostrarLegenda = true }: Props) {
  const router = useRouter();

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={[-7.0241, -37.2803]}
        zoom={13}
        minZoom={12}
        maxBounds={LIMITES_PATOS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />

        {PONTOS_REFERENCIA.map((ponto) => (
          <Marker
            key={ponto.id}
            position={[ponto.latitude, ponto.longitude]}
            icon={iconesReferencia[ponto.tipo]}
          >
            <Popup>{ponto.nome}</Popup>
          </Marker>
        ))}

        {vagas.map((vaga) => (
          <Marker
            key={vaga.id}
            position={[vaga.latitude, vaga.longitude]}
            icon={iconeVaga}
            eventHandlers={{ click: () => onSelecionarVaga(vaga.id) }}
          >
            <Popup minWidth={220}>
              <div className="flex flex-col gap-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#F0A93C]/15 flex items-center justify-center text-lg shrink-0">
                    💼
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F2C4A] leading-tight">{vaga.cargo}</p>
                    <p className="text-xs text-slate-500">{vaga.empresa.nomeEmpresa}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                    {vaga.tipoContrato}
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                    {vaga.area}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  📍 {vaga.bairro}
                  {vaga.salario && (
                    <>
                      <span className="mx-1">·</span>
                      R$ {vaga.salario.toLocaleString("pt-BR")}
                    </>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/vagas/${vaga.id}`)}
                  className="mt-1 bg-[#0F2C4A] text-white text-xs font-semibold rounded-md py-2 hover:bg-[#123a63] transition-colors"
                >
                  Ver detalhes
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legenda — some quando mostrarLegenda={false} (ex: mapa pequeno da tela de detalhes) */}
      {mostrarLegenda && (
        <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg shadow-md p-3 text-xs space-y-1.5 z-[1000] max-h-64 overflow-y-auto">
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#F0A93C]" /> Vaga
          </div>
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#E24C4C]" /> Saúde
          </div>
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#22A06B]" /> Farmácia
          </div>
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#E8813A]" /> Emergência
          </div>
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#0E9488]" /> Supermercado
          </div>
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#8E5FC9]" /> Shopping
          </div>
          <div className="flex items-center gap-2 text-[#0F2C4A] font-medium">
            <span className="w-3 h-3 rounded-full bg-[#1D6FA5]" /> Faculdade
          </div>
        </div>
      )}
    </div>
  );
}
