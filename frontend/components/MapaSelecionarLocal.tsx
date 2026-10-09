"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  iconeEmpresa,
  iconeHospital,
  iconeFaculdade,
  iconeShopping,
  iconeFarmacia,
  iconeEmergencia,
  iconeSupermercado,
} from "@/lib/mapaIcones";
import { PONTOS_REFERENCIA } from "@/lib/pontosReferencia";

const LIMITES_PATOS: LatLngBoundsExpression = [
  [-7.09, -37.35],
  [-6.96, -37.21],
];

const iconesReferencia = {
  hospital: iconeHospital,
  faculdade: iconeFaculdade,
  shopping: iconeShopping,
  farmacia: iconeFarmacia,
  emergencia: iconeEmergencia,
  supermercado: iconeSupermercado,
};

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
      mapa.flyTo([latitude, longitude], Math.max(mapa.getZoom(), 16), { duration: 0.8 });
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
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {!somenteLeitura && (
          <CliqueNoMapa
            onSelecionar={onSelecionar}
            onForaDosLimites={handleForaDosLimites}
          />
        )}

        <SeguirPino latitude={latitude} longitude={longitude} />

        {PONTOS_REFERENCIA.map((ponto) => (
          <Marker
            key={ponto.id}
            position={[ponto.latitude, ponto.longitude]}
            icon={iconesReferencia[ponto.tipo]}
          >
            <Popup>{ponto.nome}</Popup>
          </Marker>
        ))}

        {latitude !== null && longitude !== null && (
          <Marker position={[latitude, longitude]} icon={iconeEmpresa} />
        )}
      </MapContainer>
    </div>
  );
}