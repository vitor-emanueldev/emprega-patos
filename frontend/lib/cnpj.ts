// Consulta de CNPJ (BrasilAPI, dados públicos da Receita Federal) e
// localização do endereço no mapa (Nominatim / OpenStreetMap).

import { setorPorCnae } from "@/lib/setores";
// As duas são chamadas direto do navegador da pessoa.

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

// Confere os dígitos verificadores do CNPJ (evita consultar números digitados errado)
export function cnpjValido(valor: string) {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calcular = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((total, d, i) => total + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calcular(cnpj.slice(0, 12));
  const d2 = calcular(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

// "RUA HORACIO NOBREGA" → "Rua Horacio Nobrega"
const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);
export function capitalizar(texto: string | null | undefined) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, i) => (i > 0 && MINUSCULAS.has(palavra) ? palavra : palavra.charAt(0).toUpperCase() + palavra.slice(1)))
    .join(" ")
    .trim();
}

function formatarTelefoneReceita(valor: string | null | undefined) {
  const d = apenasDigitos(valor || "");
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return "";
}

export type DadosCnpj = {
  nome: string; // nome fantasia (ou razão social, se não tiver)
  razaoSocial: string;
  setor: string;
  endereco: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  situacao: string; // "Ativa", "Baixada"...
  ativa: boolean;
};

export async function consultarCnpj(cnpj: string): Promise<DadosCnpj> {
  const numero = apenasDigitos(cnpj);
  if (!cnpjValido(numero)) throw new Error("CNPJ inválido. Confira os números.");

  let resposta: Response;
  try {
    resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numero}`);
  } catch {
    throw new Error("Não foi possível consultar o CNPJ agora. Preencha os dados manualmente.");
  }
  if (resposta.status === 404) throw new Error("CNPJ não encontrado na Receita Federal.");
  if (resposta.status === 429) throw new Error("Muitas consultas seguidas. Aguarde um minuto e tente de novo.");
  if (!resposta.ok) throw new Error("Não foi possível consultar o CNPJ agora. Preencha os dados manualmente.");

  const d = await resposta.json();
  const tipo = capitalizar(d.descricao_tipo_de_logradouro);
  const logradouro = capitalizar(d.logradouro);
  const rua = logradouro.toLowerCase().startsWith(tipo.toLowerCase()) ? logradouro : [tipo, logradouro].filter(Boolean).join(" ");
  const numeroEnd = d.numero && d.numero !== "SN" && d.numero !== "S/N" ? String(d.numero) : "";
  const situacao = capitalizar(d.descricao_situacao_cadastral);

  return {
    nome: capitalizar(d.nome_fantasia) || capitalizar(d.razao_social),
    razaoSocial: d.razao_social || "",
    setor: setorPorCnae(d.cnae_fiscal), // um item da lista SETORES_EMPRESA
    endereco: [rua, numeroEnd].filter(Boolean).join(", ").slice(0, 300),
    rua,
    numero: numeroEnd,
    bairro: capitalizar(d.bairro).slice(0, 100),
    cidade: capitalizar(d.municipio),
    uf: (d.uf || "").toUpperCase(),
    telefone: formatarTelefoneReceita(d.ddd_telefone_1),
    situacao,
    ativa: (d.descricao_situacao_cadastral || "").toUpperCase() === "ATIVA",
  };
}

export type Localizacao = { latitude: number; longitude: number; precisao: "endereco" | "bairro" };

async function nominatim(params: Record<string, string>) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&${new URLSearchParams(params)}`;
  const resposta = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });
  if (!resposta.ok) return null;
  const lista = await resposta.json();
  if (!lista[0]) return null;
  return { latitude: Number(lista[0].lat), longitude: Number(lista[0].lon) };
}

// Tenta achar a rua; se não der, o bairro. O pino é só uma sugestão: a pessoa confere no mapa.
export async function localizarEndereco(dados: { rua?: string; numero?: string; bairro?: string; cidade: string; uf?: string }): Promise<Localizacao | null> {
  const estado = dados.uf === "PB" || !dados.uf ? "Paraíba" : dados.uf;
  try {
    if (dados.rua) {
      const r = await nominatim({ street: [dados.numero, dados.rua].filter(Boolean).join(" "), city: dados.cidade, state: estado });
      if (r) return { ...r, precisao: "endereco" };
    }
    if (dados.bairro) {
      await new Promise((ok) => setTimeout(ok, 1100)); // regra do Nominatim: no máximo 1 consulta por segundo
      const r = await nominatim({ q: `${dados.bairro}, ${dados.cidade}, ${estado}` });
      if (r) return { ...r, precisao: "bairro" };
    }
  } catch {
    // sem internet ou serviço fora do ar: a pessoa marca no mapa manualmente
  }
  return null;
}
