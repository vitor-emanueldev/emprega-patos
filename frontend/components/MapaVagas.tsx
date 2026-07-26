"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Vaga } from "@/lib/api";
import {
  iconeVaga, // ou iconeEmpresa, dependendo do arquivo
  iconeHospital,
  iconeFaculdade,
  iconeShopping,
  iconeFarmacia,
  iconeEmergencia,
  iconeSupermercado,
} from "@/lib/mapaIcones";
import { PONTOS_REFERENCIA } from "@/lib/pontosReferencia";

type Props = {
  vagas: Vaga[];
  vagaSelecionada: string | null;
  onSelecionarVaga: (id: string) => void;
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

export default function MapaVagas({ vagas, vagaSelecionada, onSelecionarVaga }: Props) {
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
            <Popup>
              {vaga.cargo} — {vaga.empresa.nomeEmpresa}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legenda */}
        <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg shadow-md p-3 text-xs space-y-1.5 z-[1000] max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F0A93C]" /> Vaga</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#E24C4C]" /> Saúde</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22A06B]" /> Farmácia</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#E8813A]" /> Emergência</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#0E9488]" /> Supermercado</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#8E5FC9]" /> Shopping</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#1D6FA5]" /> Faculdade</div>
        </div>
    </div>
  );
}