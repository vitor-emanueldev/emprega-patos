import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";
import { enviarAviso } from "../utils/enviarEmail";
import { emailsAdmin } from "../utils/admin";
import { emailNovoReporte } from "../utils/modelosEmail";

// Quem envia não precisa estar logado. Se estiver, guardamos quem foi
// (ajuda a entender o problema). Token inválido/vencido: segue como visitante.
function usuarioDoToken(req: Request): string | null {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) return null;
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET as string) as { id?: string };
    return dados.id || null;
  } catch {
    return null;
  }
}

// POST /reportes  { tipo, mensagem, contato?, pagina?, navegador? }
export async function criarReporte(req: Request, res: Response) {
  const { tipo, mensagem, contato, pagina, navegador } = req.body; // já validado (criarReporteSchema)
  try {
    const idUsuario = usuarioDoToken(req);
    const usuario = idUsuario
      ? await prisma.usuario.findUnique({ where: { id: idUsuario }, select: { id: true, nome: true, email: true } })
      : null;

    await prisma.reporte.create({
      data: { tipo, mensagem, contato, pagina, navegador, usuarioId: usuario?.id ?? null },
    });

    const quem = usuario ? `${usuario.nome} (${usuario.email})` : contato || null;
    for (const email of emailsAdmin()) {
      enviarAviso(email, emailNovoReporte({ tipo, mensagem, pagina, quem }));
    }

    return res.status(201).json({ ok: true });
  } catch (erro) {
    console.error("Erro ao salvar reporte:", erro);
    return res.status(500).json({ erro: "Não foi possível enviar agora. Tente de novo em instantes." });
  }
}

// GET /admin/reportes?situacao=novo
export async function listarReportesAdmin(req: RequisicaoAutenticada, res: Response) {
  const situacao = req.query.situacao === "resolvido" ? "resolvido" : "novo";
  try {
    const [reportes, contagem] = await Promise.all([
      prisma.reporte.findMany({
        where: { situacao },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          tipo: true,
          mensagem: true,
          contato: true,
          pagina: true,
          navegador: true,
          situacao: true,
          createdAt: true,
          usuario: { select: { nome: true, email: true } },
        },
      }),
      prisma.reporte.groupBy({ by: ["situacao"], _count: { _all: true } }),
    ]);

    const totais: Record<string, number> = { novo: 0, resolvido: 0 };
    for (const c of contagem) totais[c.situacao] = c._count._all;

    return res.json({ reportes, totais });
  } catch (erro) {
    console.error("Erro ao listar reportes:", erro);
    return res.status(500).json({ erro: "Erro ao listar reportes." });
  }
}

// PATCH /admin/reportes/:id  { situacao }
export async function atualizarReporteAdmin(req: RequisicaoAutenticada, res: Response) {
  try {
    const existe = await prisma.reporte.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!existe) return res.status(404).json({ erro: "Reporte não encontrado." });

    const atualizado = await prisma.reporte.update({
      where: { id: existe.id },
      data: { situacao: req.body.situacao },
      select: { id: true, situacao: true },
    });
    return res.json(atualizado);
  } catch (erro) {
    console.error("Erro ao atualizar reporte:", erro);
    return res.status(500).json({ erro: "Erro ao atualizar reporte." });
  }
}
