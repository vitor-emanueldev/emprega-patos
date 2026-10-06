import type { Candidato } from "@/lib/api";

// Opções e formato do currículo, usados no formulário, no perfil e na visão da empresa.

export const TURNOS = [
  { valor: "manha", rotulo: "Manhã" },
  { valor: "tarde", rotulo: "Tarde" },
  { valor: "noite", rotulo: "Noite" },
] as const;

export const DURACOES_EXPERIENCIA = [
  { valor: "ate-6m", rotulo: "Menos de 6 meses" },
  { valor: "6m-1a", rotulo: "De 6 meses a 1 ano" },
  { valor: "1a-2a", rotulo: "De 1 a 2 anos" },
  { valor: "mais-2a", rotulo: "Mais de 2 anos" },
] as const;

export const NIVEIS_ESCOLARIDADE = [
  "Ensino Fundamental incompleto",
  "Ensino Fundamental completo",
  "Ensino Médio incompleto",
  "Ensino Médio completo",
  "Ensino Técnico",
  "Ensino Superior incompleto",
  "Ensino Superior completo",
  "Pós-graduação",
] as const;

export function rotuloTurno(valor: string) {
  return TURNOS.find((t) => t.valor === valor)?.rotulo ?? valor;
}

export function rotuloDuracao(valor: string | null | undefined) {
  return DURACOES_EXPERIENCIA.find((d) => d.valor === valor)?.rotulo ?? null;
}

// O currículo do jeito que é mostrado (para o próprio candidato e para a empresa)
export type CurriculoVisao = {
  nome: string;
  fotoUrl?: string | null;
  idade?: number | null;
  bairro?: string | null;
  telefone?: string | null;
  telefoneWhatsapp?: boolean | null;
  email?: string | null;
  cargoDesejado?: string | null;
  areaInteresse?: string | null;
  sobreMim?: string | null;
  turnos?: string[];
  disponivelFimDeSemana?: boolean | null;
  inicioImediato?: boolean | null;
  pretensaoSalarial?: number | null;
  primeiroEmprego?: boolean | null;
  experiencias?: {
    cargo: string;
    empresa: string;
    duracao?: string | null;
    atual?: boolean | null;
    descricao?: string | null;
  }[];
  escolaridade?: string | null;
  estudandoAtualmente?: boolean | null;
  cursos?: { nomeCurso: string; instituicao?: string | null; anoConclusao?: number | null }[];
  habilidades?: string[];
  possuiCnh?: boolean | null;
  categoriaCnh?: string | null;
  possuiVeiculo?: boolean | null;
  referencia?: { nome: string; telefone?: string | null; relacao?: string | null } | null;
};

export function calcularIdade(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  if (
    hoje.getUTCMonth() < nascimento.getUTCMonth() ||
    (hoje.getUTCMonth() === nascimento.getUTCMonth() && hoje.getUTCDate() < nascimento.getUTCDate())
  ) {
    idade--;
  }
  return idade;
}

// Link do WhatsApp a partir do telefone (adiciona o 55 do Brasil)
export function linkWhatsapp(telefone: string | null | undefined, texto?: string) {
  const digitos = (telefone || "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const numero = digitos.startsWith("55") && digitos.length > 11 ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

// Quanto do currículo está preenchido (para a barra de progresso)
export function progressoCurriculo(c: CurriculoVisao) {
  const itens: { rotulo: string; ok: boolean }[] = [
    { rotulo: "Foto", ok: Boolean(c.fotoUrl) },
    { rotulo: "Telefone", ok: Boolean(c.telefone) },
    { rotulo: "Bairro", ok: Boolean(c.bairro) },
    { rotulo: "O que você procura", ok: Boolean(c.cargoDesejado) },
    { rotulo: "Sobre mim", ok: Boolean(c.sobreMim && c.sobreMim.trim().length >= 40) },
    { rotulo: "Disponibilidade", ok: Boolean(c.turnos && c.turnos.length > 0) },
    { rotulo: "Experiência", ok: Boolean(c.primeiroEmprego || (c.experiencias && c.experiencias.length > 0)) },
    { rotulo: "Escolaridade", ok: Boolean(c.escolaridade) },
    { rotulo: "Habilidades", ok: Boolean(c.habilidades && c.habilidades.length >= 3) },
  ];
  const feitos = itens.filter((i) => i.ok).length;
  return {
    porcentagem: Math.round((feitos / itens.length) * 100),
    faltando: itens.filter((i) => !i.ok).map((i) => i.rotulo),
  };
}

// Monta o currículo (formato de exibição) a partir da ficha salva
export function curriculoDaFicha(c: Candidato, email?: string | null): CurriculoVisao {
  return {
    nome: c.nome,
    fotoUrl: c.fotoUrl,
    idade: calcularIdade(c.dataNascimento),
    bairro: c.bairro,
    telefone: c.telefone,
    telefoneWhatsapp: c.telefoneWhatsapp,
    email: email ?? null,
    cargoDesejado: c.cargoDesejado,
    areaInteresse: c.areaInteresse,
    sobreMim: c.sobreMim ?? c.diferencial,
    turnos: c.turnos,
    disponivelFimDeSemana: c.disponivelFimDeSemana,
    inicioImediato: c.inicioImediato,
    pretensaoSalarial: c.pretensaoSalarial,
    primeiroEmprego: c.primeiroEmprego,
    experiencias: c.experiencias,
    escolaridade: c.escolaridade ?? c.formacoes?.find((f) => f.nivelEscolaridade)?.nivelEscolaridade ?? null,
    estudandoAtualmente: c.estudandoAtualmente,
    cursos: c.cursos,
    habilidades: c.habilidades,
    possuiCnh: c.possuiCnh,
    categoriaCnh: c.categoriaCnh,
    possuiVeiculo: c.possuiVeiculo,
    referencia: c.referenciaNome
      ? { nome: c.referenciaNome, telefone: c.referenciaTelefone, relacao: c.referenciaRelacao }
      : null,
  };
}

