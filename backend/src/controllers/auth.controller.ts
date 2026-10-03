import { Request, Response } from "express";
import { prisma } from "../prisma";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /auth/google
export async function loginGoogle(req: Request, res: Response) {
  const { credential } = req.body; // token que o Google Identity Services manda

  if (!credential) {
    return res.status(400).json({ erro: "Token do Google não fornecido." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ erro: "Não foi possível validar sua conta Google." });
    }

    // Só aceita contas cujo e-mail o próprio Google confirmou
    if (payload.email_verified !== true) {
      return res.status(401).json({ erro: "Seu e-mail do Google ainda não foi verificado." });
    }

    const { sub: googleId, name, picture } = payload;
    const email = payload.email.toLowerCase();

    // Primeiro procura pela conta Google (identificador fixo); depois pelo e-mail
    let usuario =
      (await prisma.usuario.findUnique({ where: { googleId } })) ??
      (await prisma.usuario.findUnique({ where: { email } }));

    // Se o e-mail já pertence a OUTRA conta Google, não deixa entrar nela
    if (usuario && usuario.googleId && usuario.googleId !== googleId) {
      return res.status(401).json({ erro: "Falha ao autenticar com Google." });
    }

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          email,
          nome: name || email.split("@")[0],
          googleId,
          fotoUrl: picture,
        },
      });
    } else if (!usuario.googleId) {
      // Usuário já existia (ex: dado de teste antigo) — vincula a conta Google
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { googleId, fotoUrl: picture },
      });
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
        fotoUrl: usuario.fotoUrl,
      },
    });

  } catch (erro) {
    console.error("Erro no login com Google:", erro);
    res.status(401).json({ erro: "Falha ao autenticar com Google." });
  }
}