// Opções fixas usadas ao publicar/editar vaga e nos filtros.
// Ter uma lista só garante que o que a empresa escolhe bate com o que o candidato filtra.

export const TIPOS_CONTRATO = ["CLT", "PJ / Freelance", "Temporário", "Meio período", "Estágio", "Jovem Aprendiz"] as const;

// Nesses tipos o valor pago não é "salário" de carteira: chamamos de "remuneração"
const TIPOS_REMUNERACAO = ["Estágio", "Jovem Aprendiz", "PJ / Freelance"];

// "Salário" ou "Remuneração", conforme o tipo de contrato
export function rotuloValor(tipoContrato?: string | null) {
  return tipoContrato && TIPOS_REMUNERACAO.includes(tipoContrato) ? "Remuneração" : "Salário";
}

// Sugestões de um toque no formulário (a empresa ainda pode escrever outros)
export const BENEFICIOS_COMUNS = [
  "Vale-transporte",
  "Vale-alimentação",
  "Vale-refeição",
  "Plano de saúde",
  "Plano odontológico",
  "Comissão",
  "Bônus por metas",
  "Desconto em produtos",
  "Uniforme",
  "Folga aos domingos",
] as const;

// Onde a pessoa vai trabalhar
export type Modalidade = "presencial" | "hibrido" | "remoto";

export const MODALIDADES: { valor: Modalidade; rotulo: string; explicacao: string }[] = [
  { valor: "presencial", rotulo: "Presencial", explicacao: "Trabalho no endereço da empresa." },
  { valor: "hibrido", rotulo: "Híbrido", explicacao: "Alguns dias na empresa, outros de casa." },
  { valor: "remoto", rotulo: "Remoto", explicacao: "Trabalho de casa. A vaga continua no mapa, no endereço da empresa." },
];

// "Remoto" / "Híbrido"; presencial não ganha selo
export function rotuloModalidade(m?: string | null) {
  if (m === "remoto") return "Remoto";
  if (m === "hibrido") return "Híbrido";
  return null;
}

// Vaga para pessoas com deficiência (PcD)
export type OpcaoPcd = "nao" | "aceita" | "exclusiva";

export const OPCOES_PCD: { valor: OpcaoPcd; rotulo: string; explicacao: string }[] = [
  { valor: "nao", rotulo: "Não", explicacao: "Vaga comum." },
  {
    valor: "aceita",
    rotulo: "Também para PcD",
    explicacao: "Aberta a todos e também a pessoas com deficiência. Aparece no filtro de vagas PcD.",
  },
  {
    valor: "exclusiva",
    rotulo: "Exclusiva para PcD",
    explicacao: "Só para pessoas com deficiência (ex: cota da Lei 8.213/91).",
  },
];

export function rotuloPcd(pcd?: string | null) {
  if (pcd === "exclusiva") return "Exclusiva para PcD";
  if (pcd === "aceita") return "Também para PcD";
  return null;
}

export function ehVagaPcd(pcd?: string | null) {
  return pcd === "aceita" || pcd === "exclusiva";
}
