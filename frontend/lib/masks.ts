export function formatSalario(valor: string): string {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) return "";

  const numero = Number(numeros) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseSalario(valor: string): number | null {
  if (!valor) return null;

  const numeros = valor.replace(/\D/g, "");

  if (!numeros) return null;

  return Number(numeros) / 100;
}
