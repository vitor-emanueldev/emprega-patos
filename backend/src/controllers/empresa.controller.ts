import { Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";
import {
  apagarFoto,
  ehFotoNossa,
  enviarFoto,
  ErroImagemInvalida,
  processarLogo,
  uploadDeFotoConfigurado,
} from "../utils/armazenamento";
import { apenasDigitos, cnpjValido, consultarCnpjReceita } from "../utils/cnpj";
import { emailsAdmin } from "../utils/admin";
import { enviarAviso } from "../utils/enviarEmail";
import { emailNovaEmpresaParaVerificar } from "../utils/modelosEmail";

// Avisa os administradores que tem empresa esperando verificação
function avisarAdmins(nomeEmpresa: string, motivo: "nova" | "corrigida") {
  for (const email of emailsAdmin()) {
    enviarAviso(email, emailNovaEmpresaParaVerificar({ nomeEmpresa, motivo }));
  }
}

// Decide a verificação a partir do CNPJ informado.
// Devolve um erro (para mostrar à pessoa) ou a situação da empresa.
async function verificarPeloCnpj(
  cnpj: string
): Promise<{ erro: string } | { verificacao: "aprovada" | "pendente" }> {
  if (!cnpjValido(cnpj)) {
    return { erro: "CNPJ inválido. Confira os números ou deixe o campo em branco." };
  }
  const resultado = await consultarCnpjReceita(cnpj);
  if (resultado.tipo === "nao_encontrado") {
    return { erro: "CNPJ não encontrado na Receita Federal. Confira os números ou deixe o campo em branco." };
  }
  // CNPJ ativo: aprovada na hora. Inativo ou Receita fora do ar: um administrador confere.
  return { verificacao: resultado.tipo === "ativa" ? "aprovada" : "pendente" };
}

// Só aceita logo que veio do nosso botão de envio (nada de link de fora)
function logoPermitida(logoNova: string | null | undefined, logoAtual: string | null) {
  if (logoNova === undefined || logoNova === null) return true;
  return ehFotoNossa(logoNova) || logoNova === logoAtual;
}

// POST /empresas/logo — recebe a imagem, ajusta e guarda. Devolve o link.
export async function enviarLogoEmpresa(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  if (!uploadDeFotoConfigurado()) {
    return res.status(503).json({ erro: "O envio de imagens ainda não está disponível. Tente mais tarde." });
  }

  const bytes = req.body;
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    return res.status(400).json({ erro: "Nenhuma imagem recebida. Escolha uma logo JPG, PNG ou WebP." });
  }

  try {
    const logo = await processarLogo(bytes);
    const url = await enviarFoto(`empresas/${req.usuario.id}`, logo);
    return res.status(201).json({ url });
  } catch (erro) {
    if (erro instanceof ErroImagemInvalida) {
      return res.status(400).json({ erro: erro.message });
    }
    console.error("Erro ao enviar logo:", erro);
    return res.status(500).json({ erro: "Não foi possível salvar a logo. Tente novamente." });
  }
}

export async function tornarEmpresa(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { nomeEmpresa, cnpj, endereco, bairro, setor, descricao, telefone, latitude, longitude, logoUrl } = req.body;

  if (!logoPermitida(logoUrl, null)) {
    return res.status(400).json({ erro: "Envie a logo pelo botão de logo.", campo: "logoUrl" });
  }

  try {
    const empresaExistente = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
    });

    if (empresaExistente) {
      return res.status(400).json({ erro: "Este usuário já possui uma empresa vinculada" });
    }

    // Sem CNPJ: fica pendente até um administrador aprovar
    let verificacao: "aprovada" | "pendente" = "pendente";
    if (apenasDigitos(cnpj)) {
      const r = await verificarPeloCnpj(cnpj);
      if ("erro" in r) return res.status(400).json({ erro: r.erro, campo: "cnpj" });
      verificacao = r.verificacao;
    }

    const novaEmpresa = await prisma.empresa.create({
      data: {
        nomeEmpresa,
        cnpj: cnpj ?? undefined,
        endereco,
        bairro,
        setor,
        descricao,
        telefone,
        logoUrl: logoUrl ?? undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        usuarioId: req.usuario.id,
        verificacao,
        verificadaEm: verificacao === "aprovada" ? new Date() : null,
      },
    });

    if (verificacao === "pendente") avisarAdmins(novaEmpresa.nomeEmpresa, "nova");

    res.status(201).json(novaEmpresa);

  } catch (erro) {
    console.error("Erro ao tornar empresa:", erro);
    res.status(400).json({ erro: "CNPJ já cadastrado ou dados inválidos" });
  }
}

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

export async function atualizarMinhaEmpresa(req: RequisicaoAutenticada, res: Response) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const { nomeEmpresa, cnpj, endereco, bairro, setor, descricao, telefone, latitude, longitude, logoUrl } = req.body;

  try {
    const atual = await prisma.empresa.findUnique({
      where: { usuarioId: req.usuario.id },
      select: { logoUrl: true, cnpj: true, verificacao: true },
    });

    if (!atual) {
      return res.status(404).json({ erro: "Este usuário não possui empresa vinculada" });
    }

    if (!logoPermitida(logoUrl, atual.logoUrl)) {
      return res.status(400).json({ erro: "Envie a logo pelo botão de logo.", campo: "logoUrl" });
    }

    // CNPJ novo: verifica de novo. Empresa recusada que corrigiu os dados: volta para a fila.
    let verificacao: string | undefined;
    const cnpjNovo = apenasDigitos(cnpj);
    if (cnpjNovo && cnpjNovo !== apenasDigitos(atual.cnpj)) {
      const r = await verificarPeloCnpj(cnpjNovo);
      if ("erro" in r) return res.status(400).json({ erro: r.erro, campo: "cnpj" });
      verificacao = r.verificacao;
    } else if (atual.verificacao === "recusada") {
      verificacao = "pendente";
    }

    const empresaAtualizada = await prisma.empresa.update({
      where: { usuarioId: req.usuario.id },
      data: {
        ...(verificacao
          ? {
              verificacao,
              verificadaEm: verificacao === "aprovada" ? new Date() : null,
              motivoRecusa: verificacao === "aprovada" ? null : undefined,
            }
          : {}),
        nomeEmpresa,
        cnpj: cnpj ?? undefined,
        endereco,
        bairro,
        setor,
        descricao,
        telefone,
        logoUrl, // null tira a logo; undefined mantém
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      },
    });

    if (verificacao === "pendente" && atual.verificacao !== "pendente") {
      avisarAdmins(empresaAtualizada.nomeEmpresa, atual.verificacao === "recusada" ? "corrigida" : "nova");
    }

    // Trocou ou tirou a logo: apaga a antiga do armazenamento
    if (logoUrl !== undefined && atual.logoUrl && atual.logoUrl !== empresaAtualizada.logoUrl) {
      apagarFoto(atual.logoUrl);
    }

    res.status(200).json(empresaAtualizada);

  } catch (erro: any) {
    if (erro.code === "P2002") {
      return res.status(400).json({ erro: "Este CNPJ já está cadastrado" });
    }

    if (erro.code === "P2025") {
      return res.status(404).json({ erro: "Este usuário não possui empresa vinculada" });
    }

    console.error("Erro ao atualizar empresa:", erro);
    res.status(400).json({ erro: "Dados inválidos" });
  }
}