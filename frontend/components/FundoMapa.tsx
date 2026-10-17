"use client";

import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";

// Fundo de todos os mapas do site: estilo "Liberty" do OpenFreeMap (grátis, sem chave).
// Se ele não carregar (serviço fora do ar ou celular sem WebGL), volta sozinho para o
// mapa padrão do OpenStreetMap, para o site nunca ficar sem mapa.

const ESTILO = "https://tiles.openfreemap.org/styles/liberty";
const CREDITOS =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Dados &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
// Tempo para o estilo chegar (internet lenta de celular pode demorar); depois disso usa a reserva
const TEMPO_MAXIMO_MS = 15000;

function temWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function FundoMapa() {
  const mapa = useMap();
  const [reserva, setReserva] = useState(false);

  useEffect(() => {
    if (reserva) return;
    if (!temWebGL()) {
      setReserva(true);
      return;
    }

    const camada = maplibreGL({ style: ESTILO, attributionControl: { customAttribution: CREDITOS } });
    camada.addTo(mapa);

    let carregou = false;
    const gl = camada.getMaplibreMap();
    const marcarCarregado = () => {
      carregou = true;
    };
    gl.once("style.load", () => {
      marcarCarregado(); // o estilo chegou: dali em diante é só desenhar
      // Prédios planos: tira o efeito 3D (deixava "sombras" escuras ao dar zoom)
      if (gl.getLayer("building-3d")) gl.setLayoutProperty("building-3d", "visibility", "none");
      if (gl.getLayer("building")) gl.setLayerZoomRange("building", 13, 24);
    });
    gl.once("load", marcarCarregado);
    gl.on("error", () => {
      if (!carregou) setReserva(true); // o estilo nem chegou: usa o mapa reserva
    });
    const limite = setTimeout(() => {
      if (!carregou) setReserva(true);
    }, TEMPO_MAXIMO_MS);

    return () => {
      clearTimeout(limite);
      mapa.removeLayer(camada);
    };
  }, [mapa, reserva]);

  if (!reserva) return null;
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      maxZoom={19}
    />
  );
}
