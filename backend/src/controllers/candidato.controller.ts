// backend/src/controllers/candidato.controller.ts

import { Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";

// POST /candidatos
export async function tornarCandidato(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const {
    telefone,
    cpf,
    dataNascimento,
    habilidades,
    fotoUrl,
    possuiCnh,
    categoriaCnh,
    possuiVeiculo,
    cargoDesejado,
    areaInteresse,
    pretensaoSalarial,
    diferencial,
    formacoes,
    cursos,
    experiencias,
  } = req.body;

  try {
    const candidatoExistente = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (candidatoExistente) {
      return res.status(400).json({ erro: "Você já tem um perfil de candidato" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const novoCandidato = await prisma.candidato.create({
      data: {
        nome: usuario.nome,
        telefone,
        cpf,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        habilidades,
        fotoUrl,
        possuiCnh,
        categoriaCnh,
        possuiVeiculo,
        cargoDesejado,
        areaInteresse,
        pretensaoSalarial,
        diferencial,
        usuarioId: req.usuario.id,
        formacoes: formacoes ? { create: formacoes } : undefined,
        cursos: cursos ? { create: cursos } : undefined,
        experiencias: experiencias
          ? {
              create: experiencias.map((exp: any) => ({
                ...exp,
                dataInicio: exp.dataInicio ? new Date(exp.dataInicio) : undefined,
                dataFim: exp.dataFim ? new Date(exp.dataFim) : undefined,
              })),
            }
          : undefined,
      },
      include: { formacoes: true, cursos: true, experiencias: true },
    });

    res.status(201).json(novoCandidato);

  } catch (erro: any) {
    if (erro.code === "P2002") {
      return res.status(400).json({ erro: "Este CPF já está cadastrado" });
    }

    console.log("Erro ao tornar candidato:", erro);
    res.status(400).json({ erro: "Dados inválidos" });
  }
}

// GET /candidatos/minha-ficha
export async function buscarMinhaFicha(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
      include: { formacoes: true, cursos: true, experiencias: true },
    });

    if (!candidato) {
      return res.status(404).json({ erro: "Este usuário não possui perfil de candidato" });
    }

    res.status(200).json(candidato);

  } catch (erro) {
    res.status(500).json({ erro: "Erro ao buscar ficha do candidato" });
  }
}

// PUT /candidatos/minha-ficha
export async function atualizarMinhaFicha(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const {
    telefone,
    cpf,
    dataNascimento,
    habilidades,
    fotoUrl,
    possuiCnh,
    categoriaCnh,
    possuiVeiculo,
    cargoDesejado,
    areaInteresse,
    pretensaoSalarial,
    diferencial,
    formacoes,
    cursos,
    experiencias,
  } = req.body;

  try {
    const candidatoAtualizado = await prisma.candidato.update({
      where: { usuarioId: req.usuario.id },
      data: {
        telefone,
        cpf,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        habilidades,
        fotoUrl,
        possuiCnh,
        categoriaCnh,
        possuiVeiculo,
        cargoDesejado,
        areaInteresse,
        pretensaoSalarial,
        diferencial,
        // A cada atualização, o front manda a lista completa mais recente,
        // então substituímos tudo: apaga o que existia e cria de novo.
        formacoes: formacoes
          ? { deleteMany: {}, create: formacoes }
          : undefined,
        cursos: cursos ? { deleteMany: {}, create: cursos } : undefined,
        experiencias: experiencias
          ? {
              deleteMany: {},
              create: experiencias.map((exp: any) => ({
                ...exp,
                dataInicio: exp.dataInicio ? new Date(exp.dataInicio) : undefined,
                dataFim: exp.dataFim ? new Date(exp.dataFim) : undefined,
              })),
            }
          : undefined,
      },
      include: { formacoes: true, cursos: true, experiencias: true },
    });

    res.status(200).json(candidatoAtualizado);

  } catch (erro: any) {
    if (erro.code === "P2002") {
      return res.status(400).json({ erro: "Este CPF já está cadastrado" });
    }

    if (erro.code === "P2025") {
      return res.status(404).json({ erro: "Este usuário não possui perfil de candidato" });
    }

    console.log("Erro ao atualizar candidato:", erro);
    res.status(400).json({ erro: "Dados inválidos" });
  }
}
