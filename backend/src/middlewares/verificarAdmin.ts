import { Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "./verificarToken";
import { ehAdmin } from "../utils/admin";

// Usar sempre DEPOIS do verificarToken. Confere o e-mail no banco (não confia no navegador).
export async function verificarAdmin(req: RequisicaoAutenticada, res: Response, next: NextFunction) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id }, select: { email: true } });
    if (!usuario || !ehAdmin(usuario.email)) {
      return res.status(403).json({ erro: "Acesso permitido só para administradores." });
    }
    return next();
  } catch (erro) {
    console.error("Erro ao verificar administrador:", erro);
    return res.status(500).json({ erro: "Erro ao verificar permissão." });
  }
}
