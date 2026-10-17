"use client";

import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
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

// O plugin agenda um ajuste para o quadro seguinte ao fim de um zoom. Se o mapa sai da tela
// nesse meio tempo (ex: tocar em "Como chegar" e mudar de página), o ajuste quebrava com
// "Cannot read properties of null". Mesma lógica do plugin, só que checando se o mapa ainda existe.
// Precisa ser feito ANTES do addTo, que é quando o plugin registra esses eventos.
type CamadaInterna = {
  _map: L.Map | null;
  _glMap: { once: (ev: string, fn: () => void) => void; jumpTo: (o: object) => void; _actualCanvas: HTMLElement } | null;
  _resizeContainer: () => void;
  _transitionEnd: () => void;
  _zoomEnd: () => void;
};

function protegerAoSair(camada: unknown) {
  const c = camada as CamadaInterna;
  const zoomEndOriginal = c._zoomEnd;
  c._zoomEnd = function (this: CamadaInterna) {
    if (!this._map || !this._glMap) return;
    zoomEndOriginal.call(this);
  };
  c._transitionEnd = function (this: CamadaInterna) {
    L.Util.requestAnimFrame(() => {
      const mapa = this._map;
      const gl = this._glMap;
      if (!mapa || !gl) return;
      const zoom = mapa.getZoom();
      const centro = mapa.getCenter();
      const deslocamento = mapa.latLngToContainerPoint(mapa.getBounds().getNorthWest());
      this._resizeContainer();
      L.DomUtil.setTransform(gl._actualCanvas, deslocamento, 1);
      gl.once("moveend", () => this._zoomEnd());
      gl.jumpTo({ center: centro, zoom: zoom - 1 });
    });
  };
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
    protegerAoSair(camada);
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
