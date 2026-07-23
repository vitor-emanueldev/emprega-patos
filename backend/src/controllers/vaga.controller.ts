import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function listarVagas(req: Request, res: Response) {
  try {
    const { busca, tipoContrato, area, salarioMin, salarioMax, bairro } = req.query;

    const where: any = {
      status: "aberta",
    };

    if (busca) {
      where.OR = [
        { cargo: { contains: String(busca), mode: "insensitive" } },
        { empresa: { nomeEmpresa: { contains: String(busca), mode: "insensitive" } } },
      ];
    }

    if (tipoContrato) where.tipoContrato = String(tipoContrato);
    if (area) where.area = String(area);
    if (bairro) where.bairro = String(bairro);

    if (salarioMin || salarioMax) {
      where.salario = {};
      if (salarioMin) where.salario.gte = Number(salarioMin);
      if (salarioMax) where.salario.lte = Number(salarioMax);
    }

    const vagas = await prisma.vaga.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        empresa: {
          select: { nomeEmpresa: true },
        },
      },
    });

    return res.json(vagas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar vagas." });
  }
}

export async function detalhesVaga(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const vaga = await prisma.vaga.findUnique({
      where: { id },
      include: {
        empresa: {
          select: { nomeEmpresa: true, endereco: true },
        },
      },
    });

    if (!vaga) {
      return res.status(404).json({ erro: "Vaga não encontrada." });
    }

    return res.json(vaga);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao buscar vaga." });
  }
}