import { Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";

// GET /vagas-salvas — vagas que o usuário salvou (mais recentes primeiro)
export async function listarVagasSalvas(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) return res.status(401).json({ erro: "Não autenticado" });

  try {
    const salvas = await prisma.vagaSalva.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { createdAt: "desc" },
      include: { vaga: { include: { empresa: { select: { nomeEmpresa: true } } } } },
    });
    return res.json(salvas.map((s) => ({ ...s.vaga, salvaEm: s.createdAt })));
  } catch (erro) {
    console.error("Erro ao listar vagas salvas:", erro);
    return res.status(500).json({ erro: "Erro ao buscar vagas salvas." });
  }
}

// GET /vagas-salvas/ids — só os ids, para marcar o coração nas listas
export async function idsVagasSalvas(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) return res.status(401).json({ erro: "Não autenticado" });

  try {
    const salvas = await prisma.vagaSalva.findMany({
      where: { usuarioId: req.usuario.id },
      select: { vagaId: true },
    });
    return res.json(salvas.map((s) => s.vagaId));
  } catch (erro) {
    console.error("Erro ao listar ids de vagas salvas:", erro);
    return res.status(500).json({ erro: "Erro ao buscar vagas salvas." });
  }
}

// POST /vagas/:id/salvar — salva (se já estiver salva, não faz nada)
export async function salvarVaga(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) return res.status(401).json({ erro: "Não autenticado" });
  const vagaId = req.params.id;

  try {
    const vaga = await prisma.vaga.findUnique({ where: { id: vagaId }, select: { id: true } });
    if (!vaga) return res.status(404).json({ erro: "Vaga não encontrada." });

    const total = await prisma.vagaSalva.count({ where: { usuarioId: req.usuario.id } });
    if (total >= 200) {
      return res.status(400).json({ erro: "Você atingiu o limite de 200 vagas salvas. Remova algumas para salvar novas." });
    }

    await prisma.vagaSalva.upsert({
      where: { usuarioId_vagaId: { usuarioId: req.usuario.id, vagaId } },
      create: { usuarioId: req.usuario.id, vagaId },
      update: {},
    });
    return res.status(201).json({ salva: true });
  } catch (erro) {
    console.error("Erro ao salvar vaga:", erro);
    return res.status(500).json({ erro: "Erro ao salvar a vaga." });
  }
}

// DELETE /vagas/:id/salvar — remove das salvas
export async function removerVagaSalva(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) return res.status(401).json({ erro: "Não autenticado" });

  try {
    await prisma.vagaSalva.deleteMany({ where: { usuarioId: req.usuario.id, vagaId: req.params.id } });
    return res.json({ salva: false });
  } catch (erro) {
    console.error("Erro ao remover vaga salva:", erro);
    return res.status(500).json({ erro: "Erro ao remover a vaga salva." });
  }
}
