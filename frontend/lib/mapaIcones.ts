import L from "leaflet";

// Pino em formato de gota (local selecionado / vaga)
export function criarPino(corPreenchimento: string, corBorda: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: ${corPreenchimento};
        border: 2px solid ${corBorda};
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: white;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
}

// Círculo sólido de referência, estilo Google Maps (ex: "H" vermelho de hospital)
function criarCirculoSolido(cor: string, conteudo: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: ${cor};
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 12px;
        font-family: Arial, sans-serif;
      ">
        ${conteudo}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

export const iconeVaga = criarPino("#F0A93C", "#0F2C4A");
export const iconeEmpresa = criarPino("#F0A93C", "#0F2C4A");

// "H" vermelho, igual ao Google
export const iconeHospital = criarCirculoSolido("#E24C4C", "H");

// Capelo de formatura em SVG, dentro do círculo azul
export const iconeFaculdade = criarCirculoSolido(
  "#1D6FA5",
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.9V17h2V9L12 3zm0 13.5L4.5 12.7V16c0 2 3.5 4 7.5 4s7.5-2 7.5-4v-3.3L12 16.5z"/></svg>`
);

// Sacola de compras, dentro do círculo roxo (shopping)
export const iconeShopping = criarCirculoSolido(
  "#8E5FC9",
  `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M6 2l-1.5 4H4a1 1 0 000 2h.5L6 20h12l1.5-12H20a1 1 0 000-2h-.5L18 2H6zm2.5 4l.8-2h5.4l.8 2H8.5zM12 10a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>`
);

export const iconeFarmacia = criarCirculoSolido(
  "#22A06B",
  `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M11 2h2v7h7v6h-7v7h-2v-7H4V9h7V2z"/></svg>`
);

export const iconeEmergencia = criarCirculoSolido(
  "#E8813A",
  `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2L1 21h22L12 2zm0 6l6 10H6l6-10zm-1 4v3h2v-3h-2zm0 4v2h2v-2h-2z"/></svg>`
);

export const iconeSupermercado = criarCirculoSolido(
  "#0E9488",
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M4 4h2l1.4 9.6A2 2 0 009.4 15.4h8.2a2 2 0 002-1.6L21 7H6.2M9.5 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>`
);