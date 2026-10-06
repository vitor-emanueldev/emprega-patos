import { Request, Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";
import {
  apagarFoto,
  ehFotoNossa,
  enviarFoto,
  ErroImagemInvalida,
  processarFoto,
  uploadDeFotoConfigurado,
} from "../utils/armazenamento";

// Obs: req.body já chega validado e limpo pelo middleware validar(candidatoSchema)

const incluirListas = { formacoes: true, cursos: true, experiencias: true } as const;

// Separa os campos simples das listas (formações, cursos, experiências)
function separarDados(body: any) {
  const { formacoes, cursos, experiencias, ...simples } = body;
  return { simples, formacoes, cursos, experiencias };
}

// Só aceita foto enviada pelo nosso upload (ou a mesma que já estava salva)
function fotoPermitida(fotoNova: string | null | undefined, fotoAtual: string | null | undefined) {
  if (fotoNova === undefined || fotoNova === null) return true;
  return ehFotoNossa(fotoNova) || fotoNova === fotoAtual;
}

export async function tornarCandidato(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { simples, formacoes, cursos, experiencias } = separarDados(req.body);

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

    if (!fotoPermitida(simples.fotoUrl, null)) {
      return res.status(400).json({ erro: "Envie a foto pelo botão de foto do currículo.", campo: "fotoUrl" });
    }

    const novoCandidato = await prisma.candidato.create({
      data: {
        ...simples,
        nome: usuario.nome,
        usuarioId: req.usuario.id,
        formacoes: formacoes?.length ? { create: formacoes } : undefined,
        cursos: cursos?.length ? { create: cursos } : undefined,
        experiencias: experiencias?.length ? { create: experiencias } : undefined,
      },
      include: incluirListas,
    });

    res.status(201).json(novoCandidato);
  } catch (erro: any) {
    console.error("Erro ao tornar candidato:", erro);
    res.status(400).json({ erro: "Dados inválidos" });
  }
}

export async function buscarMinhaFicha(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
      include: incluirListas,
    });

    if (!candidato) {
      return res.status(404).json({ erro: "Este usuário não possui perfil de candidato" });
    }

    res.status(200).json(candidato);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao buscar ficha do candidato" });
  }
}

export async function atualizarMinhaFicha(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { simples, formacoes, cursos, experiencias } = separarDados(req.body);

  try {
    const atual = await prisma.candidato.findUnique({
      where: { usuarioId: req.usuario.id },
      select: { fotoUrl: true },
    });

    if (!atual) {
      return res.status(404).json({ erro: "Este usuário não possui perfil de candidato" });
    }

    if (!fotoPermitida(simples.fotoUrl, atual.fotoUrl)) {
      return res.status(400).json({ erro: "Envie a foto pelo botão de foto do currículo.", campo: "fotoUrl" });
    }

    const candidatoAtualizado = await prisma.candidato.update({
      where: { usuarioId: req.usuario.id },
      data: {
        ...simples,
        // LGPD: o CPF não é mais coletado. Ao salvar o currículo novo, o antigo é apagado.
        cpf: null,
        formacoes: formacoes ? { deleteMany: {}, create: formacoes } : undefined,
        cursos: cursos ? { deleteMany: {}, create: cursos } : undefined,
        experiencias: experiencias ? { deleteMany: {}, create: experiencias } : undefined,
      },
      include: incluirListas,
    });

    // Trocou ou removeu a foto: apaga a antiga do armazenamento
    if (simples.fotoUrl !== undefined && atual.fotoUrl && atual.fotoUrl !== candidatoAtualizado.fotoUrl) {
      apagarFoto(atual.fotoUrl);
    }

    res.status(200).json(candidatoAtualizado);
  } catch (erro: any) {
    console.error("Erro ao atualizar candidato:", erro);
    res.status(400).json({ erro: "Dados inválidos" });
  }
}

// POST /candidatos/foto  (corpo = a imagem, Content-Type image/*)
// Devolve { url }. A foto só fica no currículo quando ele for salvo.
export async function enviarFotoCandidato(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  if (!uploadDeFotoConfigurado()) {
    return res.status(503).json({ erro: "O envio de fotos ainda não está disponível. Tente mais tarde." });
  }

  const bytes = req.body;
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    return res.status(400).json({ erro: "Nenhuma imagem recebida. Escolha uma foto JPG, PNG ou WebP." });
  }

  try {
    const foto = await processarFoto(bytes);
    const url = await enviarFoto(`candidatos/${req.usuario.id}`, foto);
    return res.status(201).json({ url });
  } catch (erro) {
    if (erro instanceof ErroImagemInvalida) {
      return res.status(400).json({ erro: erro.message });
    }
    console.error("Erro ao enviar foto:", erro);
    return res.status(500).json({ erro: "Não foi possível salvar a foto. Tente novamente." });
  }
}

// Erro de upload grande demais (vem do express.raw)
export function tratarErroUpload(erro: any, req: Request, res: Response, next: (e?: any) => void) {
  if (erro?.type === "entity.too.large") {
    return res.status(413).json({ erro: "A foto é grande demais. Escolha uma imagem de até 8 MB." });
  }
  return next(erro);
}
