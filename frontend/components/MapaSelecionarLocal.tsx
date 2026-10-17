"use client";

import { useEffect } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { iconeEmpresa } from "@/lib/mapaIcones";
import FundoMapa from "@/components/FundoMapa";

const LIMITES_PATOS: LatLngBoundsExpression = [
  [-7.09, -37.35],
  [-6.96, -37.21],
];

function dentroDosLimites(lat: number, lng: number) {
  const [[sul, oeste], [norte, leste]] = LIMITES_PATOS as [[number, number], [number, number]];
  return lat >= sul && lat <= norte && lng >= oeste && lng <= leste;
}

function CliqueNoMapa({
  onSelecionar,
  onForaDosLimites,
}: {
  onSelecionar: (lat: number, lng: number) => void;
  onForaDosLimites: () => void;
}) {
  useMapEvents({
    click(e) {
      if (dentroDosLimites(e.latlng.lat, e.latlng.lng)) {
        onSelecionar(e.latlng.lat, e.latlng.lng);
      } else {
        onForaDosLimites();
      }
    },
  });
  return null;
}

// Quando o local muda por fora (ex: endereço encontrado pelo CNPJ), leva o mapa até lá
function SeguirPino({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      mapa.setView([latitude, longitude], Math.max(mapa.getZoom(), 16), { animate: true });
    }
  }, [latitude, longitude, mapa]);
  return null;
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  onSelecionar: (lat: number, lng: number) => void;
  somenteLeitura?: boolean;
};

export default function MapaSelecionarLocal({
  latitude,
  longitude,
  onSelecionar,
  somenteLeitura = false,
}: Props) {
  const centro: [number, number] = [latitude ?? -7.0241, longitude ?? -37.2803];

  function handleForaDosLimites() {
    alert("Selecione um ponto dentro da área urbana de Patos - PB.");
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: 320 }}>
      <MapContainer
        center={centro}
        zoom={14}
        minZoom={13}
        maxBounds={LIMITES_PATOS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <FundoMapa />
        {!somenteLeitura && (
          <CliqueNoMapa
            onSelecionar={onSelecionar}
            onForaDosLimites={handleForaDosLimites}
          />
        )}

        <SeguirPino latitude={latitude} longitude={longitude} />

        {latitude !== null && longitude !== null && (
          <Marker position={[latitude, longitude]} icon={iconeEmpresa} />
        )}
      </MapContainer>
    </div>
  );
}