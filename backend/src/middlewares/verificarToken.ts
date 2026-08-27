import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface PayloadToken {
  id: string;
}

export interface RequisicaoAutenticada extends Request {
  usuario?: PayloadToken;
}

export function verificarToken(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não fornecido." });
  }

  const partes = authHeader.split(" ");

  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return res.status(401).json({ erro: "Token mal formatado." });
  }

  const token = partes[1];

  try {
    const decodificado = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as PayloadToken;

    req.usuario = decodificado;
    return next();
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}