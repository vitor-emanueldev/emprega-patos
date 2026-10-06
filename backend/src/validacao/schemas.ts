import { z } from "zod";

// Mensagens padrão em português para os casos sem mensagem própria
z.setErrorMap((issue, ctx) => {
  const campo = issue.path.length ? ` (${issue.path.join(".")})` : "";
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return {
      message: issue.received === "undefined" ? `Campo obrigatório não informado${campo}.` : `Formato inválido${campo}.`,
    };
  }
  if (issue.code === z.ZodIssueCode.too_small || issue.code === z.ZodIssueCode.too_big) {
    return { message: `Tamanho inválido${campo}.` };
  }
  return { message: ctx.defaultError };
});

// ─── Peças reutilizáveis ─────────────────────────────────────────────

const apenasDigitos = (valor: string) => valor.replace(/\D/g, "");

// Texto obrigatório: tira espaços das pontas e limita o tamanho
const texto = (campo: string, max: number) =>
  z
    .string({ required_error: `${campo} é obrigatório.`, invalid_type_error: `${campo} deve ser um texto.` })
    .trim()
    .min(1, `${campo} é obrigatório.`)
    .max(max, `${campo} pode ter no máximo ${max} caracteres.`);

// Texto opcional (aceita vazio)
const textoOpcional = (campo: string, max: number) =>
  z
    .string({ invalid_type_error: `${campo} deve ser um texto.` })
    .trim()
    .max(max, `${campo} pode ter no máximo ${max} caracteres.`)
    .nullish();

const lista = (campo: string, maxItens: number, maxCaracteres: number) =>
  z
    .array(z.string().trim().min(1).max(maxCaracteres, `Cada item de ${campo} pode ter no máximo ${maxCaracteres} caracteres.`), {
      invalid_type_error: `${campo} deve ser uma lista.`,
    })
    .max(maxItens, `${campo} pode ter no máximo ${maxItens} itens.`);

const numero = (campo: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `${campo} deve ser um número.` })
    .finite(`${campo} inválido.`)
    .min(min, `${campo} inválido.`)
    .max(max, `${campo} inválido.`);

const salario = (campo: string) => numero(campo, 0, 1_000_000).nullish();

const ano = z.coerce.number().int("Ano inválido.").min(1940, "Ano inválido.").max(2100, "Ano inválido.").nullish();

// Telefone brasileiro: 10 ou 11 dígitos (com DDD). Vazio é permitido.
const telefone = (campo: string) =>
  z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || [10, 11].includes(apenasDigitos(v).length), `${campo} inválido. Use DDD + número.`)
    .nullish();

// Data no formato aceito pelo JavaScript (ex: "2001-05-20"). Vazio vira null.
const dataOpcional = (campo: string) =>
  z
    .union([z.string().trim(), z.null()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      const data = new Date(v);
      if (isNaN(data.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${campo} inválida.` });
        return z.NEVER;
      }
      return data;
    });

// URL de imagem: só http/https (bloqueia "javascript:" e afins). Vazio vira undefined.
const urlImagem = z
  .string()
  .trim()
  .max(500, "O link da foto é longo demais.")
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => v === undefined || /^https?:\/\/[^\s]+$/i.test(v), "O link da foto deve começar com http:// ou https://.")
  .nullish();

const latitude = numero("Latitude", -90, 90);
const longitude = numero("Longitude", -180, 180);

// ─── Empresa ─────────────────────────────────────────────────────────

const cnpj = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .refine((v) => v === undefined || apenasDigitos(v).length === 14, "CNPJ inválido. Ele deve ter 14 dígitos.")
  .nullish();

export const empresaSchema = z.object({
  nomeEmpresa: texto("Nome da empresa", 150),
  cnpj,
  endereco: textoOpcional("Endereço", 300),
  bairro: textoOpcional("Bairro", 100),
  setor: textoOpcional("Setor", 100),
  descricao: textoOpcional("Descrição", 2000),
  telefone: telefone("Telefone"),
  latitude: latitude.nullish(),
  longitude: longitude.nullish(),
});

// ─── Candidato ───────────────────────────────────────────────────────

const dataNascimento = dataOpcional("Data de nascimento").refine((data) => {
  if (!data) return true;
  const idade = (Date.now() - data.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return idade >= 14 && idade <= 100;
}, "Data de nascimento inválida.");

const formacaoSchema = z.object({
  nivelEscolaridade: z.string().trim().max(100, "Nível de escolaridade longo demais."),
  instituicao: z.string().trim().max(150, "Nome da instituição longo demais."),
  anoInicio: ano,
  anoConclusao: ano,
});

const cursoSchema = z.object({
  nomeCurso: texto("Nome do curso", 150),
  cargaHoraria: textoOpcional("Carga horária", 30),
  instituicao: textoOpcional("Instituição do curso", 150),
  anoConclusao: ano,
});

export const DURACOES_EXPERIENCIA = ["ate-6m", "6m-1a", "1a-2a", "mais-2a"] as const;
export const TURNOS = ["manha", "tarde", "noite"] as const;
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

// Valor de uma lista fixa; vazio vira null
const opcaoDaLista = <T extends readonly [string, ...string[]]>(opcoes: T, mensagem: string) =>
  z.preprocess((v) => (v === "" ? null : v), z.enum(opcoes, { errorMap: () => ({ message: mensagem }) }).nullish());

const experienciaSchema = z.object({
  cargo: texto("Cargo da experiência", 100),
  empresa: texto("Local da experiência", 150),
  duracao: opcaoDaLista(DURACOES_EXPERIENCIA, "Tempo de experiência inválido."),
  dataInicio: dataOpcional("Data de início da experiência"),
  dataFim: dataOpcional("Data de fim da experiência"),
  atual: z.boolean().optional().default(false),
  descricao: textoOpcional("Descrição da experiência", 1000),
});

// Ignora blocos de experiência que o usuário adicionou mas deixou em branco
const experiencias = z.preprocess(
  (valor) =>
    Array.isArray(valor)
      ? valor.filter(
          (exp) =>
            exp &&
            typeof exp === "object" &&
            [exp.cargo, exp.empresa, exp.descricao].some((c) => typeof c === "string" && c.trim() !== "")
        )
      : valor,
  z.array(experienciaSchema).max(20, "Máximo de 20 experiências.")
);

export const candidatoSchema = z.object({
  telefone: telefone("Telefone"),
  telefoneWhatsapp: z.boolean().optional(),
  dataNascimento,
  habilidades: lista("Habilidades", 50, 60).optional(),
  fotoUrl: urlImagem,
  possuiCnh: z.boolean().nullish(),
  categoriaCnh: textoOpcional("Categoria da CNH", 5),
  possuiVeiculo: z.boolean().nullish(),
  cargoDesejado: textoOpcional("Cargo desejado", 100),
  areaInteresse: textoOpcional("Área de interesse", 100),
  pretensaoSalarial: salario("Pretensão salarial"),
  diferencial: textoOpcional("Diferencial", 1000),
  sobreMim: textoOpcional("Sobre mim", 1500),
  bairro: textoOpcional("Bairro", 100),
  turnos: z.array(z.enum(TURNOS, { errorMap: () => ({ message: "Turno inválido." }) })).max(3).optional(),
  disponivelFimDeSemana: z.boolean().nullish(),
  inicioImediato: z.boolean().nullish(),
  primeiroEmprego: z.boolean().optional(),
  escolaridade: opcaoDaLista(NIVEIS_ESCOLARIDADE, "Escolaridade inválida."),
  estudandoAtualmente: z.boolean().nullish(),
  referenciaNome: textoOpcional("Nome da referência", 100),
  referenciaTelefone: telefone("Telefone da referência"),
  referenciaRelacao: textoOpcional("Relação com a referência", 60),
  formacoes: z.array(formacaoSchema).max(10, "Máximo de 10 formações.").optional(),
  cursos: z.array(cursoSchema).max(20, "Máximo de 20 cursos.").optional(),
  experiencias: experiencias.optional(),
});

// ─── Vaga ────────────────────────────────────────────────────────────

export const STATUS_VAGA = ["aberta", "pausada", "encerrada"] as const;

const camposVaga = {
  cargo: texto("Cargo", 120),
  descricao: texto("Descrição", 5000),
  tipoContrato: texto("Tipo de contrato", 40),
  area: texto("Área", 100),
  salario: salario("Salário"),
  endereco: texto("Endereço", 300),
  bairro: texto("Bairro", 100),
  latitude,
  longitude,
  requisitos: lista("Requisitos", 30, 300).optional(),
  responsabilidades: lista("Responsabilidades", 30, 300),
  beneficios: lista("Benefícios", 30, 300).optional(),
};

export const publicarVagaSchema = z.object({
  ...camposVaga,
  responsabilidades: camposVaga.responsabilidades.min(1, "Informe pelo menos uma responsabilidade."),
});

export const atualizarVagaSchema = z
  .object({
    ...camposVaga,
    status: z.enum(STATUS_VAGA, { errorMap: () => ({ message: "Status da vaga inválido." }) }),
  })
  .partial();

export const filtrosVagaSchema = z.object({
  busca: z.string().trim().max(100).optional(),
  tipoContrato: z.string().trim().max(40).optional(),
  area: z.string().trim().max(100).optional(),
  bairro: z.string().trim().max(100).optional(),
  salarioMin: numero("Salário mínimo", 0, 1_000_000).optional(),
  salarioMax: numero("Salário máximo", 0, 1_000_000).optional(),
});

// ─── Candidatura ─────────────────────────────────────────────────────

export const aceitarCandidaturaSchema = z.object({
  dataEntrevista: z
    .string({ required_error: "Informe a data e o horário da entrevista." })
    .trim()
    .min(1, "Informe a data e o horário da entrevista.")
    .transform((v, ctx) => {
      const data = new Date(v);
      if (isNaN(data.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data da entrevista inválida." });
        return z.NEVER;
      }
      return data;
    })
    .refine((data) => data.getTime() > Date.now() - 24 * 60 * 60 * 1000, "A data da entrevista já passou.")
    .refine((data) => data.getTime() < Date.now() + 366 * 24 * 60 * 60 * 1000, "A data da entrevista está longe demais."),
  mensagem: textoOpcional("Mensagem", 1000),
});

export const candidatarSchema = z.object({
  mensagem: textoOpcional("Mensagem para a empresa", 1000),
});

export const rejeitarCandidaturaSchema = z.object({
  mensagem: z
    .string({ required_error: "Escreva uma mensagem para o candidato." })
    .trim()
    .min(1, "Escreva uma mensagem para o candidato.")
    .max(1000, "A mensagem pode ter no máximo 1000 caracteres."),
});
