// backend/src/controllers/usuario.controller.ts

import { Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";

// POST /usuario/tornar-empresa
export async function tornarEmpresa(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { nomeEmpresa, cnpj, endereco, bairro, setor, descricao, telefone, latitude, longitude } = req.body;

  try {
    const empresaExistente = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (empresaExistente) {
      return res.status(400).json({ erro: "Este usuário já possui uma empresa vinculada" });
    }

    const novaEmpresa = await prisma.empresa.create({
      data: {
        nomeEmpresa,
        cnpj,
        endereco,
        bairro,
        setor,
        descricao,
        telefone,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        usuarioId: req.usuario.id,
      },
    });

    res.status(201).json(novaEmpresa);

  } catch (erro) {
    console.log("Erro ao tornar empresa:", erro);
    res.status(400).json({ erro: "CNPJ já cadastrado ou dados inválidos" });
  }
}

// GET /usuario/minha-empresa
export async function buscarMinhaEmpresa(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
      include: { vagas: true },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Este usuário não possui empresa vinculada" });
    }

    res.status(200).json(empresa);

  } catch (erro) {
    res.status(500).json({ erro: "Erro ao buscar empresa" });
  }
}

// PUT /usuario/minha-empresa
export async function atualizarMinhaEmpresa(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { nomeEmpresa, cnpj, endereco, bairro, setor, descricao, telefone, latitude, longitude } = req.body;

  try {
    const empresaAtualizada = await prisma.empresa.update({
      where: { usuarioId: req.usuario.id },
      data: {
        nomeEmpresa,
        cnpj,
        endereco,
        bairro,
        setor,
        descricao,
        telefone,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      },
    });

    res.status(200).json(empresaAtualizada);

  } catch (erro: any) {
    if (erro.code === "P2002") {
      return res.status(400).json({ erro: "Este CNPJ já está cadastrado" });
    }

    if (erro.code === "P2025") {
      return res.status(404).json({ erro: "Este usuário não possui empresa vinculada" });
    }

    console.log("Erro ao atualizar empresa:", erro);
    res.status(400).json({ erro: "Dados inválidos" });
  }
}