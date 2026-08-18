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

export function formatCNPJ(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function telefoneValido(valor: string): boolean {
  const numeros = valor.replace(/\D/g, "");

  return (
    numeros.length === 10 ||
    numeros.length === 11
  );
}