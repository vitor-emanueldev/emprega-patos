import type { Vaga } from "@/lib/api";
import { distanciaKm } from "@/lib/formatar";

// Filtros da aba Mapa
export type Filtros = {
  busca: string;
  contratos: string[];
  categoria: string; // "" = todas
  bairro: string; // "" = todos
  salarioMin: number | null;
};

export const FILTROS_VAZIOS: Filtros = { busca: "", contratos: [], categoria: "", bairro: "", salarioMin: null };

export const FAIXAS_SALARIO = [
  { valor: null, rotulo: "Qualquer" },
  { valor: 1000, rotulo: "R$ 1.000+" },
  { valor: 1500, rotulo: "R$ 1.500+" },
  { valor: 2000, rotulo: "R$ 2.000+" },
  { valor: 3000, rotulo: "R$ 3.000+" },
] as const;

// Mesma ordem do formulário de publicar vaga
const ORDEM_CONTRATO = ["CLT", "PJ / Freelance", "Temporário"];

export type Posicao = { latitude: number; longitude: number };
export type VagaComDistancia = Vaga & { distanciaKm: number | null };

// Sem acento e minúsculo: "Temporário" = "temporario"
export function normalizar(texto: string) {
  return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function contarFiltrosAtivos(f: Filtros) {
  return f.contratos.length + (f.categoria ? 1 : 0) + (f.bairro ? 1 : 0) + (f.salarioMin ? 1 : 0);
}

// As opções saem das vagas que existem: nunca aparece opção que dá zero resultado
export function opcoesDosFiltros(vagas: Vaga[]) {
  const contar = (chave: (v: Vaga) => string) => {
    const mapa = new Map<string, number>();
    for (const v of vagas) {
      const valor = chave(v)?.trim();
      if (valor) mapa.set(valor, (mapa.get(valor) || 0) + 1);
    }
    return mapa;
  };
  const ordem = (t: string) => (ORDEM_CONTRATO.indexOf(t) === -1 ? 99 : ORDEM_CONTRATO.indexOf(t));
  const ordenarPorNome = (m: Map<string, number>) =>
    Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([nome, total]) => ({ nome, total }));

  return {
    contratos: Array.from(contar((v) => v.tipoContrato).keys()).sort((a, b) => ordem(a) - ordem(b)),
    categorias: ordenarPorNome(contar((v) => v.area)),
    bairros: ordenarPorNome(contar((v) => v.bairro)),
  };
}

export function aplicarFiltros(vagas: Vaga[], f: Filtros, origem?: Posicao | null): VagaComDistancia[] {
  const palavras = normalizar(f.busca).split(/\s+/).filter(Boolean);
  return vagas
    .filter((v) => {
      if (palavras.length) {
        const texto = normalizar(`${v.cargo} ${v.empresa.nomeEmpresa} ${v.area} ${v.bairro}`);
        if (!palavras.every((p) => texto.includes(p))) return false;
      }
      if (f.contratos.length && !f.contratos.includes(v.tipoContrato)) return false;
      if (f.categoria && v.area !== f.categoria) return false;
      if (f.bairro && v.bairro !== f.bairro) return false;
      if (f.salarioMin && (v.salario == null || v.salario < f.salarioMin)) return false;
      return true;
    })
    .map((v) => ({
      ...v,
      distanciaKm: origem ? distanciaKm(origem.latitude, origem.longitude, v.latitude, v.longitude) : null,
    }))
    .sort((a, b) =>
      origem ? (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
