import { Request, Response } from "express";
import { prisma } from "../prisma";
import { criptografarSenha, compararSenha } from "../utils/hash";
import jwt from "jsonwebtoken";

// parte do cadastro
export async function cadastrar(req: Request, res: Response) {
  const { nome, email, senha } = req.body;

  try {
    const senhaCriptografada = await criptografarSenha(senha);

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaCriptografada },
    });

    res.status(201).json({
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
    });

  } catch (erro) {
    console.log("Erro no cadastro:", erro);
    res.status(400).json({ erro: "Email já cadastrado" });
  }
}

// parte do login
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const senhaCorreta = await compararSenha(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    });

  } catch (erro) {
    res.status(500).json({ erro: "Erro ao fazer login" });
  }
}