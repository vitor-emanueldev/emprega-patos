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

    const { sub: googleId, email, name, picture } = payload;

    let usuario = await prisma.usuario.findUnique({ where: { email } });

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