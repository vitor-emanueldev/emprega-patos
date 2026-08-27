import { Request, Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";

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
    console.error("Erro ao buscar vagas:", error);
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
    console.error("Erro ao buscar vaga:", error);
    return res.status(500).json({ erro: "Erro ao buscar vaga." });
  }
}

export async function minhasVagas(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Nenhuma empresa cadastrada para este usuário." });
    }

    const vagas = await prisma.vaga.findMany({
      where: { empresaId: empresa.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(vagas);
  } catch (error) {
    console.error("Erro ao buscar vagas da empresa:", error);
    return res.status(500).json({ erro: "Erro ao buscar suas vagas." });
  }
}

export async function publicarVaga(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const {
    cargo,
    descricao,
    tipoContrato,
    area,
    salario,
    endereco,
    bairro,
    latitude,
    longitude,
    requisitos,
    responsabilidades,
    beneficios,
  } = req.body;

  if (
    !cargo ||
    !descricao ||
    !tipoContrato ||
    !area ||
    !endereco ||
    !bairro ||
    latitude == null ||
    longitude == null ||
    !Array.isArray(responsabilidades) ||
    responsabilidades.length === 0
  ) {
    return res.status(400).json({ erro: "Preencha todos os campos obrigatórios da vaga." });
  }

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Você precisa cadastrar uma empresa antes de publicar vagas." });
    }

    const novaVaga = await prisma.vaga.create({
      data: {
        cargo,
        descricao,
        tipoContrato,
        area,
        salario: salario != null ? Number(salario) : undefined,
        endereco,
        bairro,
        latitude: Number(latitude),
        longitude: Number(longitude),
        requisitos: Array.isArray(requisitos) ? requisitos : [],
        responsabilidades: Array.isArray(responsabilidades) ? responsabilidades : [],
        beneficios: Array.isArray(beneficios) ? beneficios : [],
        status: "aberta",
        empresaId: empresa.id,
      },
    });

    return res.status(201).json(novaVaga);

  } catch (error) {
    console.error("Erro ao publicar vaga:", error);
    return res.status(500).json({ erro: "Erro ao publicar vaga." });
  }
}

export async function atualizarVaga(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { id } = req.params;
  const {
    cargo, descricao, tipoContrato, area, salario,
    endereco, bairro, latitude, longitude,
    requisitos, responsabilidades, beneficios, status,
  } = req.body;

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Nenhuma empresa cadastrada para este usuário." });
    }

    const vagaExistente = await prisma.vaga.findUnique({ where: { id } });

    if (!vagaExistente) {
      return res.status(404).json({ erro: "Vaga não encontrada." });
    }

    if (vagaExistente.empresaId !== empresa.id) {
      return res.status(403).json({ erro: "Você não tem permissão para editar esta vaga." });
    }

    const vagaAtualizada = await prisma.vaga.update({
      where: { id },
      data: {
        cargo,
        descricao,
        tipoContrato,
        area,
        salario: salario != null ? Number(salario) : undefined,
        endereco,
        bairro,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
        requisitos: Array.isArray(requisitos) ? requisitos : undefined,
        responsabilidades: Array.isArray(responsabilidades) ? responsabilidades : undefined,
        beneficios: Array.isArray(beneficios) ? beneficios : undefined,
        status: status || undefined,
      },
    });

    return res.json(vagaAtualizada);

  } catch (error) {
    console.error("Erro ao atualizar vaga:", error);
    return res.status(500).json({ erro: "Erro ao atualizar vaga." });
  }
}