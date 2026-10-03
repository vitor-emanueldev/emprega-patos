import { Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";

export async function candidatarVaga(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const vagaId = req.params.id;

  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!candidato) {
      return res.status(400).json({ erro: "Complete seu currículo antes de se candidatar" });
    }

    const vaga = await prisma.vaga.findUnique({
      where: { id: vagaId },
      include: { empresa: { select: { usuarioId: true } } },
    });

    if (!vaga) {
      return res.status(404).json({ erro: "Vaga não encontrada" });
    }

    if (vaga.status !== "aberta") {
      return res.status(400).json({ erro: "Esta vaga não está mais recebendo candidaturas" });
    }

    if (vaga.empresa.usuarioId === req.usuario.id) {
      return res.status(400).json({ erro: "Você não pode se candidatar a uma vaga da sua própria empresa" });
    }

    const candidatura = await prisma.candidatura.create({
      data: {
        vagaId,
        candidatoId: candidato.id,
      },
    });

    return res.status(201).json(candidatura);

  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ erro: "Você já se candidatou para esta vaga" });
    }

    console.error("Erro ao candidatar:", error);
    return res.status(500).json({ erro: "Erro ao registrar candidatura" });
  }
}

export async function minhasCandidaturas(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!candidato) {
      return res.json([]); // sem perfil de candidato ainda → nenhuma candidatura possível
    }

    const candidaturas = await prisma.candidatura.findMany({
      where: { candidatoId: candidato.id },
      include: {
        vaga: {
          include: {
            empresa: { select: { nomeEmpresa: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(candidaturas);

  } catch (error) {
    console.error("Erro ao buscar candidaturas:", error);
    return res.status(500).json({ erro: "Erro ao buscar candidaturas" });
  }
}

function calcularIdade(dataNascimento: Date | null): number | null {
  if (!dataNascimento) return null;
  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - dataNascimento.getUTCFullYear();
  const aindaNaoFezAniversario =
    hoje.getUTCMonth() < dataNascimento.getUTCMonth() ||
    (hoje.getUTCMonth() === dataNascimento.getUTCMonth() && hoje.getUTCDate() < dataNascimento.getUTCDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

// GET /vagas/:id/candidaturas (visão da empresa: lista de candidatos + currículo completo)
export async function candidaturasDaVaga(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const vagaId = req.params.id;

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!empresa) {
      return res.status(403).json({ erro: "Apenas empresas podem ver candidaturas" });
    }

    const vaga = await prisma.vaga.findUnique({ where: { id: vagaId } });

    if (!vaga || vaga.empresaId !== empresa.id) {
      return res.status(404).json({ erro: "Vaga não encontrada" });
    }

    const candidaturas = await prisma.candidatura.findMany({
      where: { vagaId },
      include: {
        candidato: {
          // LGPD: a empresa vê só o necessário para avaliar o candidato.
          // CPF e data de nascimento NÃO saem daqui (mostramos só a idade).
          select: {
            id: true,
            nome: true,
            telefone: true,
            dataNascimento: true, // usado só para calcular a idade, removido abaixo
            habilidades: true,
            fotoUrl: true,
            possuiCnh: true,
            categoriaCnh: true,
            possuiVeiculo: true,
            cargoDesejado: true,
            areaInteresse: true,
            pretensaoSalarial: true,
            diferencial: true,
            formacoes: true,
            cursos: true,
            experiencias: true,
            usuario: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const resposta = candidaturas.map((item: (typeof candidaturas)[number]) => {
      const { candidato, ...candidatura } = item;
      const { dataNascimento, usuario, ...dadosPublicos } = candidato;
      return {
        ...candidatura,
        candidato: {
          ...dadosPublicos,
          email: usuario?.email ?? null,
          idade: calcularIdade(dataNascimento),
        },
      };
    });

    return res.json(resposta);

  } catch (error) {
    console.error("Erro ao buscar candidaturas da vaga:", error);
    return res.status(500).json({ erro: "Erro ao buscar candidaturas" });
  }
}

async function buscarCandidaturaDaEmpresa(
  req: RequisicaoAutenticada,
  candidaturaId: string
) {
  if (!req.usuario) {
    return { ok: false as const, status: 401, mensagem: "Não autenticado" };
  }

  const empresa = await prisma.empresa.findUnique({
    where: { usuarioId: req.usuario.id },
  });

  if (!empresa) {
    return { ok: false as const, status: 403, mensagem: "Apenas empresas podem responder candidaturas" };
  }

  const candidatura = await prisma.candidatura.findUnique({
    where: { id: candidaturaId },
    include: { vaga: true },
  });

  if (!candidatura) {
    return { ok: false as const, status: 404, mensagem: "Candidatura não encontrada" };
  }

  if (candidatura.vaga.empresaId !== empresa.id) {
    return { ok: false as const, status: 403, mensagem: "Você não tem permissão para responder essa candidatura" };
  }

  return { ok: true as const, candidatura };
}

export async function rejeitarCandidatura(req: RequisicaoAutenticada, res: Response) {
  const candidaturaId = req.params.id;
  const { mensagem } = req.body; // já validado (rejeitarCandidaturaSchema)

  const resultado = await buscarCandidaturaDaEmpresa(req, candidaturaId);
  if (!resultado.ok) {
    return res.status(resultado.status).json({ erro: resultado.mensagem });
  }

  try {
    const candidaturaAtualizada = await prisma.candidatura.update({
      where: { id: candidaturaId },
      data: {
        status: "recusada",
        mensagemResposta: mensagem,
        dataEntrevista: null,
        respondidoEm: new Date(),
      },
    });

    return res.json(candidaturaAtualizada);
  } catch (error) {
    console.error("Erro ao rejeitar candidatura:", error);
    return res.status(500).json({ erro: "Erro ao rejeitar candidatura" });
  }
}

export async function aceitarCandidatura(req: RequisicaoAutenticada, res: Response) {
  const candidaturaId = req.params.id;
  // já validados (aceitarCandidaturaSchema): dataEntrevista chega como Date
  const { mensagem, dataEntrevista: dataConvertida } = req.body;

  const resultado = await buscarCandidaturaDaEmpresa(req, candidaturaId);
  if (!resultado.ok) {
    return res.status(resultado.status).json({ erro: resultado.mensagem });
  }

  try {
    const candidaturaAtualizada = await prisma.candidatura.update({
      where: { id: candidaturaId },
      data: {
        status: "aprovada",
        mensagemResposta: mensagem || null,
        dataEntrevista: dataConvertida,
        respondidoEm: new Date(),
      },
    });

    return res.json(candidaturaAtualizada);
  } catch (error) {
    console.error("Erro ao aceitar candidatura:", error);
    return res.status(500).json({ erro: "Erro ao aceitar candidatura" });
  }
}

export async function cancelarCandidatura(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const candidaturaId = req.params.id;

  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!candidato) {
      return res.status(404).json({ erro: "Perfil de candidato não encontrado" });
    }

    const candidatura = await prisma.candidatura.findUnique({
      where: { id: candidaturaId },
    });

    if (!candidatura) {
      return res.status(404).json({ erro: "Candidatura não encontrada" });
    }

    // Garante que o candidato só pode cancelar a própria candidatura
    if (candidatura.candidatoId !== candidato.id) {
      return res.status(403).json({ erro: "Você não pode cancelar essa candidatura" });
    }

    await prisma.candidatura.delete({ where: { id: candidaturaId } });

    return res.status(200).json({ mensagem: "Candidatura cancelada com sucesso" });

  } catch (error) {
    console.error("Erro ao cancelar candidatura:", error);
    return res.status(500).json({ erro: "Erro ao cancelar candidatura" });
  }
}