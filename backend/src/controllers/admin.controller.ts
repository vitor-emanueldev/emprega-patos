import { Response } from "express";
import { prisma } from "../prisma";
import { RequisicaoAutenticada } from "../middlewares/verificarToken";
import { enviarAviso } from "../utils/enviarEmail";
import { emailEmpresaAprovada, emailEmpresaRecusada } from "../utils/modelosEmail";
import { apenasDigitos, consultarCnpjReceita } from "../utils/cnpj";

const SITUACOES = ["pendente", "aprovada", "recusada"] as const;

// GET /admin/eu — o site usa para saber se mostra a área de administração
export function souAdmin(_req: RequisicaoAutenticada, res: Response) {
  return res.json({ admin: true }); // só chega aqui quem passou pelo verificarAdmin
}

// GET /admin/empresas?situacao=pendente
export async function listarEmpresasAdmin(req: RequisicaoAutenticada, res: Response) {
  const pedido = String(req.query.situacao || "pendente");
  const situacao = (SITUACOES as readonly string[]).includes(pedido) ? pedido : "pendente";

  try {
    const [empresas, contagem] = await Promise.all([
      prisma.empresa.findMany({
        where: { verificacao: situacao },
        orderBy: { createdAt: situacao === "pendente" ? "asc" : "desc" }, // pendentes: a mais antiga primeiro
        take: 200,
        select: {
          id: true,
          nomeEmpresa: true,
          cnpj: true,
          setor: true,
          descricao: true,
          telefone: true,
          endereco: true,
          bairro: true,
          latitude: true,
          longitude: true,
          logoUrl: true,
          instagram: true,
          verificacao: true,
          verificadaEm: true,
          motivoRecusa: true,
          createdAt: true,
          usuario: { select: { nome: true, email: true } },
          _count: { select: { vagas: true } },
        },
      }),
      prisma.empresa.groupBy({ by: ["verificacao"], _count: { _all: true } }),
    ]);

    const totais = Object.fromEntries(SITUACOES.map((s) => [s, 0])) as Record<string, number>;
    for (const c of contagem) totais[c.verificacao] = c._count._all;

    return res.json({ empresas, totais });
  } catch (erro) {
    console.error("Erro ao listar empresas (admin):", erro);
    return res.status(500).json({ erro: "Erro ao listar empresas." });
  }
}

async function buscarEmpresa(id: string) {
  return prisma.empresa.findUnique({
    where: { id },
    select: { id: true, nomeEmpresa: true, verificacao: true, usuario: { select: { nome: true, email: true } } },
  });
}

// PATCH /admin/empresas/:id/aprovar
export async function aprovarEmpresa(req: RequisicaoAutenticada, res: Response) {
  try {
    const empresa = await buscarEmpresa(req.params.id);
    if (!empresa) return res.status(404).json({ erro: "Empresa não encontrada." });

    const atualizada = await prisma.empresa.update({
      where: { id: empresa.id },
      data: { verificacao: "aprovada", verificadaEm: new Date(), motivoRecusa: null },
      select: { id: true, verificacao: true, verificadaEm: true, motivoRecusa: true },
    });

    if (empresa.verificacao !== "aprovada") {
      enviarAviso(
        empresa.usuario?.email,
        emailEmpresaAprovada({ nomeEmpresa: empresa.nomeEmpresa, nomeResponsavel: empresa.usuario?.nome || "" })
      );
    }

    return res.json(atualizada);
  } catch (erro) {
    console.error("Erro ao aprovar empresa:", erro);
    return res.status(500).json({ erro: "Erro ao aprovar empresa." });
  }
}

// PATCH /admin/empresas/:id/recusar  { motivo }
export async function recusarEmpresa(req: RequisicaoAutenticada, res: Response) {
  const { motivo } = req.body; // já validado (recusarEmpresaSchema)
  try {
    const empresa = await buscarEmpresa(req.params.id);
    if (!empresa) return res.status(404).json({ erro: "Empresa não encontrada." });

    const atualizada = await prisma.empresa.update({
      where: { id: empresa.id },
      data: { verificacao: "recusada", verificadaEm: new Date(), motivoRecusa: motivo },
      select: { id: true, verificacao: true, verificadaEm: true, motivoRecusa: true },
    });

    enviarAviso(
      empresa.usuario?.email,
      emailEmpresaRecusada({ nomeEmpresa: empresa.nomeEmpresa, nomeResponsavel: empresa.usuario?.nome || "", motivo })
    );

    return res.json(atualizada);
  } catch (erro) {
    console.error("Erro ao recusar empresa:", erro);
    return res.status(500).json({ erro: "Erro ao recusar empresa." });
  }
}

// POST /admin/empresas/:id/consultar-cnpj
// Consulta o CNPJ de novo (útil quando o serviço da Receita estava fora do ar no cadastro).
// Se estiver ATIVO, aprova na hora e avisa a empresa por e-mail.
export async function consultarCnpjEmpresa(req: RequisicaoAutenticada, res: Response) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: req.params.id },
      select: { id: true, nomeEmpresa: true, cnpj: true, verificacao: true, usuario: { select: { nome: true, email: true } } },
    });
    if (!empresa) return res.status(404).json({ erro: "Empresa não encontrada." });
    if (!apenasDigitos(empresa.cnpj)) return res.status(400).json({ erro: "Essa empresa não informou CNPJ." });

    const r = await consultarCnpjReceita(empresa.cnpj!);
    console.log(`Admin consultou CNPJ de ${empresa.nomeEmpresa}: ${r.tipo}`);

    if (r.tipo === "ativa") {
      if (empresa.verificacao !== "aprovada") {
        await prisma.empresa.update({
          where: { id: empresa.id },
          data: { verificacao: "aprovada", verificadaEm: new Date(), motivoRecusa: null },
        });
        enviarAviso(
          empresa.usuario?.email,
          emailEmpresaAprovada({ nomeEmpresa: empresa.nomeEmpresa, nomeResponsavel: empresa.usuario?.nome || "" })
        );
      }
      return res.json({ resultado: "ativa", razaoSocial: r.razaoSocial, fonte: r.fonte });
    }
    if (r.tipo === "inativa") return res.json({ resultado: "inativa", razaoSocial: r.razaoSocial, situacao: r.situacao });
    if (r.tipo === "nao_encontrado") return res.json({ resultado: "nao_encontrado" });
    return res.json({ resultado: "indisponivel" });
  } catch (erro) {
    console.error("Erro ao consultar CNPJ (admin):", erro);
    return res.status(500).json({ erro: "Erro ao consultar o CNPJ." });
  }
}
