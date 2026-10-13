// CNPJ no servidor: confere os dígitos e consulta a situação na Receita (BrasilAPI, grátis).
// A consulta é feita aqui (e não só no navegador) para ninguém conseguir burlar a verificação.

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
  | { tipo: "ativa"; razaoSocial: string }
  | { tipo: "inativa"; razaoSocial: string; situacao: string }
  | { tipo: "nao_encontrado" }
  | { tipo: "indisponivel" }; // serviço fora do ar: a empresa vai para verificação manual

export async function consultarCnpjReceita(cnpj: string): Promise<ResultadoCnpj> {
  const d = apenasDigitos(cnpj);
  try {
    const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (resposta.status === 404) return { tipo: "nao_encontrado" };
    if (!resposta.ok) return { tipo: "indisponivel" };
    const dados: any = await resposta.json();
    const situacao = String(dados?.descricao_situacao_cadastral || "").toUpperCase();
    const razaoSocial = String(dados?.razao_social || "");
    if (situacao === "ATIVA") return { tipo: "ativa", razaoSocial };
    return { tipo: "inativa", razaoSocial, situacao: situacao || "não informada" };
  } catch {
    return { tipo: "indisponivel" };
  }
}
