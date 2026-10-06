import { Prisma } from "@prisma/client";

// Candidato com tudo que o currículo precisa
export const incluirCurriculo = {
  formacoes: true,
  cursos: true,
  experiencias: true,
  usuario: { select: { email: true } },
} satisfies Prisma.CandidatoInclude;

export type CandidatoCompleto = Prisma.CandidatoGetPayload<{ include: typeof incluirCurriculo }>;

export function calcularIdade(dataNascimento: Date | null | undefined): number | null {
  if (!dataNascimento) return null;
  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - dataNascimento.getUTCFullYear();
  const aindaNaoFezAniversario =
    hoje.getUTCMonth() < dataNascimento.getUTCMonth() ||
    (hoje.getUTCMonth() === dataNascimento.getUTCMonth() && hoje.getUTCDate() < dataNascimento.getUTCDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

// CONTEÚDO do currículo (o que fica "congelado" na candidatura).
// LGPD: nunca inclui CPF nem data de nascimento — só a idade.
export function conteudoDoCurriculo(c: CandidatoCompleto) {
  return {
    versao: 2,
    nome: c.nome,
    idade: calcularIdade(c.dataNascimento),
    bairro: c.bairro,
    cargoDesejado: c.cargoDesejado,
    areaInteresse: c.areaInteresse,
    sobreMim: c.sobreMim ?? c.diferencial ?? null,
    turnos: c.turnos,
    disponivelFimDeSemana: c.disponivelFimDeSemana,
    inicioImediato: c.inicioImediato,
    pretensaoSalarial: c.pretensaoSalarial,
    primeiroEmprego: c.primeiroEmprego,
    experiencias: c.experiencias.map((e) => ({
      cargo: e.cargo,
      empresa: e.empresa,
      duracao: e.duracao,
      atual: e.atual,
      descricao: e.descricao,
      dataInicio: e.dataInicio,
      dataFim: e.dataFim,
    })),
    escolaridade: c.escolaridade ?? c.formacoes.find((f) => f.nivelEscolaridade)?.nivelEscolaridade ?? null,
    estudandoAtualmente: c.estudandoAtualmente,
    cursos: c.cursos.map((curso) => ({
      nomeCurso: curso.nomeCurso,
      instituicao: curso.instituicao,
      anoConclusao: curso.anoConclusao,
    })),
    habilidades: c.habilidades,
    possuiCnh: c.possuiCnh,
    categoriaCnh: c.categoriaCnh,
    possuiVeiculo: c.possuiVeiculo,
    referencia: c.referenciaNome
      ? { nome: c.referenciaNome, telefone: c.referenciaTelefone, relacao: c.referenciaRelacao }
      : null,
  };
}

// CONTATO e foto: sempre a versão mais nova (se o candidato trocar o telefone,
// a empresa vê o número novo, mesmo em candidaturas antigas).
export function contatoAtual(c: CandidatoCompleto) {
  return {
    fotoUrl: c.fotoUrl,
    telefone: c.telefone,
    telefoneWhatsapp: c.telefoneWhatsapp,
    email: c.usuario?.email ?? null,
  };
}

export function curriculoParaEmpresa(c: CandidatoCompleto, copiaEnviada: unknown) {
  const conteudo =
    copiaEnviada && typeof copiaEnviada === "object" ? (copiaEnviada as ReturnType<typeof conteudoDoCurriculo>) : conteudoDoCurriculo(c);
  // idade calculada sempre na data de hoje
  return { ...conteudo, idade: calcularIdade(c.dataNascimento), ...contatoAtual(c) };
}
