import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function buscarEstatisticas(req: Request, res: Response) {
  try {
    const [vagasAtivas, empresas, candidatos] = await Promise.all([
      prisma.vaga.count({ where: { status: "aberta" } }),
      prisma.empresa.count(),
      prisma.candidato.count(),
    ]);

    res.json({ vagasAtivas, empresas, candidatos });
  } catch (erro) {
    console.error("Erro ao buscar estatísticas:", erro);
    res.status(500).json({ erro: "Erro ao buscar estatísticas." });
  }
}