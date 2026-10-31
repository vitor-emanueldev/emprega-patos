// CNPJ no servidor: confere os dígitos e consulta a situação na Receita.
// A consulta é feita aqui (e não só no navegador) para ninguém conseguir burlar a verificação.
//
// Usa serviços públicos e grátis, um de reserva do outro. Alguns bloqueiam ou limitam
// pedidos vindos de servidores na nuvem (como o Render); por isso tentamos mais de um
// antes de mandar a empresa para a verificação manual.

export function apenasDigitos(valor: string | null | undefined) {
  return (valor || "").replace(/\D/g, "");
}

// Confere os 2 dígitos verificadores
export function cnpjValido(valor: string | null | undefined) {
  const d = apenasDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (base: string, pesos: number[]) => {
    const soma = base.split("").reduce((t, n, i) => t + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(d.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d.endsWith(`${d1}${d2}`);
}

export type ResultadoCnpj =
  | { tipo: "ativa"; razaoSocial: string; fonte: string }
  | { tipo: "inativa"; razaoSocial: string; situacao: string; fonte: string }
  | { tipo: "nao_encontrado"; fonte: string }
  | { tipo: "indisponivel"; detalhes: string[] }; // nenhum serviço respondeu: a empresa vai para verificação manual

const CABECALHOS = {
  Accept: "application/json",
  "User-Agent": "MapVagas/1.0 (+https://mapvagas.app.br)",
};

// "indisponivel" aqui quer dizer: esse serviço não deu resposta confiável, tente o próximo
type Tentativa = ResultadoCnpj | { tipo: "indisponivel"; motivo: string };

function classificar(situacaoBruta: unknown, razaoSocial: unknown, fonte: string): Tentativa {
  const situacao = String(situacaoBruta || "").trim().toUpperCase();
  const razao = String(razaoSocial || "");
  if (!situacao) return { tipo: "indisponivel", motivo: `${fonte}: resposta sem situação cadastral` };
  if (situacao === "ATIVA") return { tipo: "ativa", razaoSocial: razao, fonte };
  return { tipo: "inativa", razaoSocial: razao, situacao, fonte };
}

async function pedir(url: string) {
  return fetch(url, { headers: CABECALHOS, signal: AbortSignal.timeout(6000) });
}

// 1) BrasilAPI
async function viaBrasilApi(d: string): Promise<Tentativa> {
  const fonte = "BrasilAPI";
  try {
    const r = await pedir(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
    if (r.status === 404) return { tipo: "nao_encontrado", fonte };
    if (!r.ok) return { tipo: "indisponivel", motivo: `${fonte}: HTTP ${r.status}` };
    const dados: any = await r.json();
    return classificar(dados?.descricao_situacao_cadastral, dados?.razao_social, fonte);
  } catch (e: any) {
    return { tipo: "indisponivel", motivo: `${fonte}: ${e?.name === "TimeoutError" ? "tempo esgotado" : e?.message || "erro"}` };
  }
}

// 2) CNPJ.ws (API pública)
async function viaCnpjWs(d: string): Promise<Tentativa> {
  const fonte = "CNPJ.ws";
  try {
    const r = await pedir(`https://publica.cnpj.ws/cnpj/${d}`);
    if (r.status === 404) return { tipo: "nao_encontrado", fonte };
    if (!r.ok) return { tipo: "indisponivel", motivo: `${fonte}: HTTP ${r.status}` };
    const dados: any = await r.json();
    return classificar(dados?.estabelecimento?.situacao_cadastral, dados?.razao_social, fonte);
  } catch (e: any) {
    return { tipo: "indisponivel", motivo: `${fonte}: ${e?.name === "TimeoutError" ? "tempo esgotado" : e?.message || "erro"}` };
  }
}

// 3) ReceitaWS (API pública)
async function viaReceitaWs(d: string): Promise<Tentativa> {
  const fonte = "ReceitaWS";
  try {
    const r = await pedir(`https://receitaws.com.br/v1/cnpj/${d}`);
    if (!r.ok) return { tipo: "indisponivel", motivo: `${fonte}: HTTP ${r.status}` };
    const dados: any = await r.json();
    if (dados?.status === "ERROR") {
      const msg = String(dados?.message || "");
      // "CNPJ inválido" / "não encontrado" = não existe. Outros erros (limite etc.) = tente depois.
      if (/inv[aá]lido|n[aã]o encontrado|rejeitado/i.test(msg)) return { tipo: "nao_encontrado", fonte };
      return { tipo: "indisponivel", motivo: `${fonte}: ${msg || "erro"}` };
    }
    return classificar(dados?.situacao, dados?.nome, fonte);
  } catch (e: any) {
    return { tipo: "indisponivel", motivo: `${fonte}: ${e?.name === "TimeoutError" ? "tempo esgotado" : e?.message || "erro"}` };
  }
}

const SERVICOS = [viaBrasilApi, viaCnpjWs, viaReceitaWs];

export async function consultarCnpjReceita(cnpj: string): Promise<ResultadoCnpj> {
  const d = apenasDigitos(cnpj);
  const detalhes: string[] = [];
  let naoEncontradoPor: string | null = null;

  for (const servico of SERVICOS) {
    const r = await servico(d);
    if (r.tipo === "ativa" || r.tipo === "inativa") return r;
    if (r.tipo === "nao_encontrado") {
      // Um serviço dizer "não encontrado" pode ser base desatualizada (CNPJ aberto há poucos dias).
      // Só confiamos se não houver outro serviço que encontre.
      naoEncontradoPor = naoEncontradoPor || r.fonte;
      detalhes.push(`${r.fonte}: não encontrado`);
      continue;
    }
    if ("motivo" in r) detalhes.push(r.motivo);
  }

  if (naoEncontradoPor) return { tipo: "nao_encontrado", fonte: naoEncontradoPor };
  return { tipo: "indisponivel", detalhes };
}
