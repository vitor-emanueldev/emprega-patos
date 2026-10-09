// Setores de atuação da empresa (lista curta e padronizada)
export const SETORES_EMPRESA = [
  "Comércio",
  "Alimentação",
  "Serviços",
  "Saúde",
  "Educação",
  "Indústria",
  "Construção",
  "Transporte e logística",
  "Beleza e estética",
  "Agropecuária",
  "Outro",
] as const;

// Converte o código de atividade da Receita (CNAE, ex: 4712100) em um setor da lista.
// Usa a "divisão" do CNAE (os 2 primeiros dígitos).
export function setorPorCnae(cnae: string | number | null | undefined): string {
  const codigo = String(cnae ?? "").replace(/\D/g, "").padStart(7, "0");
  if (codigo === "0000000") return "";
  const divisao = Number(codigo.slice(0, 2));
  const classe = codigo.slice(0, 4);

  // Exceções comuns em cidade pequena
  if (classe === "1091") return "Alimentação"; // padarias e confeitarias com fabricação própria
  if (classe === "4520" || classe === "4543") return "Serviços"; // oficinas de carro e moto

  if (divisao >= 1 && divisao <= 3) return "Agropecuária";
  if (divisao >= 5 && divisao <= 33) return "Indústria";
  if (divisao >= 41 && divisao <= 43) return "Construção";
  if (divisao >= 45 && divisao <= 47) return "Comércio";
  if (divisao >= 49 && divisao <= 53) return "Transporte e logística";
  if (divisao === 56) return "Alimentação"; // restaurantes, lanchonetes, bares
  if (divisao === 85) return "Educação";
  if (divisao >= 86 && divisao <= 88) return "Saúde";
  if (classe === "9602") return "Beleza e estética"; // cabeleireiros, manicure, estética
  return "Serviços";
}
