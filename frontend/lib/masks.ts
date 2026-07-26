// ─── CNPJ ──────────────────────────────────────────────────────────────
export function formatCNPJ(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 14);
  const partes = [
    digitos.slice(0, 2),
    digitos.slice(2, 5),
    digitos.slice(5, 8),
    digitos.slice(8, 12),
    digitos.slice(12, 14),
  ];

  let resultado = partes[0];
  if (partes[1]) resultado += "." + partes[1];
  if (partes[2]) resultado += "." + partes[2];
  if (partes[3]) resultado += "/" + partes[3];
  if (partes[4]) resultado += "-" + partes[4];

  return resultado;
}

// Validação completa de CNPJ (dígitos verificadores), não só o tamanho
export function cnpjValido(cnpjFormatado: string): boolean {
  const cnpj = cnpjFormatado.replace(/\D/g, "");

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  function calcularDigito(base: string, pesos: number[]): number {
    const soma = base
      .split("")
      .reduce((acc, digito, i) => acc + Number(digito) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigito(cnpj.slice(0, 12), pesos1);
  const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, pesos2);

  return cnpj === cnpj.slice(0, 12) + String(digito1) + String(digito2);
}

// ─── Telefone ──────────────────────────────────────────────────────────
export function formatTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  const ddd = digitos.slice(0, 2);
  const meio = digitos.length > 10 ? digitos.slice(2, 7) : digitos.slice(2, 6);
  const fim = digitos.length > 10 ? digitos.slice(7, 11) : digitos.slice(6, 10);

  let resultado = "";
  if (ddd) resultado += `(${ddd}`;
  if (digitos.length > 2) resultado += `) ${meio}`;
  if ((digitos.length > 10 && digitos.length > 7) || (digitos.length <= 10 && digitos.length > 6)) {
    resultado += `-${fim}`;
  }

  return resultado;
}

export function telefoneValido(telefoneFormatado: string): boolean {
  const digitos = telefoneFormatado.replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11;
}

// ─── Salário (máscara de moeda) ─────────────────────────────────────────
export function formatSalario(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return "";
  const numero = Number(digitos) / 100;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseSalario(valorFormatado: string): number | null {
  const digitos = valorFormatado.replace(/\D/g, "");
  if (!digitos) return null;
  return Number(digitos) / 100;
}