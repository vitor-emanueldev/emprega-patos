import { type CurriculoVisao, rotuloDuracao, rotuloTurno } from "@/lib/curriculo";
import { formatTelefone } from "@/lib/masks";
import { nomeDoLink } from "@/lib/links";

// Gera o currículo do candidato em PDF (no próprio navegador) para a empresa baixar
// e, se quiser, colocar no sistema de currículos dela.

type InfoCandidatura = {
  cargoVaga?: string | null;
  nomeEmpresa?: string | null;
  dataCandidatura?: string | null;
};

const AZUL: [number, number, number] = [15, 44, 74];
const AZUL_CLARO: [number, number, number] = [29, 111, 165];
const LARANJA: [number, number, number] = [240, 169, 60];
const CINZA: [number, number, number] = [100, 116, 139];
const TEXTO: [number, number, number] = [30, 41, 59];

function nomeDoArquivo(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `curriculo-${limpo || "candidato"}.pdf`;
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Foto redonda (PNG) a partir do link; se não der (sem foto, erro de rede), segue sem
async function fotoRedonda(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const resposta = await fetch(url, { mode: "cors" });
    if (!resposta.ok) return null;
    const bitmap = await createImageBitmap(await resposta.blob());
    const tam = 300;
    const canvas = document.createElement("canvas");
    canvas.width = tam;
    canvas.height = tam;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.beginPath();
    ctx.arc(tam / 2, tam / 2, tam / 2, 0, Math.PI * 2);
    ctx.clip();
    // recorta o centro da imagem (como object-cover)
    const lado = Math.min(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, tam, tam);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// Logo do MapVagas (PNG transparente que já fica em /public)
async function logoMapVagas(): Promise<string | null> {
  try {
    const resposta = await fetch("/logo-mapvagas.png");
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise((resolver) => {
      const leitor = new FileReader();
      leitor.onload = () => resolver(typeof leitor.result === "string" ? leitor.result : null);
      leitor.onerror = () => resolver(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function baixarCurriculoPdf(c: CurriculoVisao, info: InfoCandidatura = {}) {
  const [{ jsPDF }, foto, logo] = await Promise.all([import("jspdf"), fotoRedonda(c.fotoUrl), logoMapVagas()]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const LARGURA = 210;
  const ALTURA = 297;
  const MARGEM = 16;
  const UTIL = LARGURA - MARGEM * 2;
  const LIMITE = ALTURA - 24; // espaço do rodapé
  let y = 0;

  function novaPaginaSePreciso(espaco: number) {
    if (y + espaco > LIMITE) {
      doc.addPage();
      y = MARGEM;
    }
  }

  function texto(conteudo: string, opcoes: { tam?: number; negrito?: boolean; cor?: [number, number, number]; recuo?: number; entre?: number } = {}) {
    const { tam = 10, negrito = false, cor = TEXTO, recuo = 0, entre = 1.5 } = opcoes;
    doc.setFont("helvetica", negrito ? "bold" : "normal");
    doc.setFontSize(tam);
    doc.setTextColor(...cor);
    const linhas: string[] = doc.splitTextToSize(conteudo, UTIL - recuo);
    const alturaLinha = tam * 0.3528 * 1.25; // pt -> mm, com entrelinha
    for (const linha of linhas) {
      novaPaginaSePreciso(alturaLinha);
      doc.text(linha, MARGEM + recuo, y + alturaLinha * 0.8);
      y += alturaLinha;
    }
    y += entre;
  }

  function secao(titulo: string) {
    novaPaginaSePreciso(14);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...AZUL);
    doc.text(titulo.toUpperCase(), MARGEM, y + 4);
    doc.setDrawColor(...LARANJA);
    doc.setLineWidth(0.6);
    doc.line(MARGEM, y + 6.2, MARGEM + 14, y + 6.2);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(MARGEM + 15, y + 6.2, LARGURA - MARGEM, y + 6.2);
    y += 10;
  }

  // ─── Topo azul ───
  const ALTURA_TOPO = 38;
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, LARGURA, ALTURA_TOPO, "F");
  doc.setFillColor(...LARANJA);
  doc.rect(0, ALTURA_TOPO, LARGURA, 1.2, "F");

  const larguraTexto = foto ? UTIL - 30 : UTIL;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text(doc.splitTextToSize(c.nome, larguraTexto)[0], MARGEM, 15);

  const objetivo = c.cargoDesejado || c.areaInteresse;
  if (objetivo) {
    doc.setFontSize(11);
    doc.setTextColor(...LARANJA);
    doc.text(doc.splitTextToSize(objetivo, larguraTexto)[0], MARGEM, 22.5);
  }
  const dados = [c.idade != null ? `${c.idade} anos` : null, c.bairro ? `Bairro ${c.bairro}` : null, "Patos - PB"]
    .filter(Boolean)
    .join("  ·  ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(dados, MARGEM, objetivo ? 29.5 : 23);

  if (foto) {
    doc.addImage(foto, "PNG", LARGURA - MARGEM - 26, 6, 26, 26);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.circle(LARGURA - MARGEM - 13, 19, 13, "S");
  }
  y = ALTURA_TOPO + 7;

  // ─── Contato ───
  const contatos: string[] = [];
  if (c.telefone) contatos.push(`Telefone: ${formatTelefone(c.telefone)}${c.telefoneWhatsapp !== false ? " (WhatsApp)" : ""}`);
  if (c.email) contatos.push(`E-mail: ${c.email}`);
  for (const link of c.links || []) contatos.push(`${nomeDoLink(link)}: ${link}`);
  if (contatos.length) {
    secao("Contato");
    for (const linha of contatos) texto(linha, { entre: 0.6 });
  }

  // ─── Sobre ───
  if (c.sobreMim) {
    secao("Sobre mim");
    texto(c.sobreMim);
  }

  // ─── Experiência ───
  const experiencias = c.experiencias || [];
  secao("Experiência profissional");
  if (experiencias.length === 0) {
    texto(c.primeiroEmprego ? "Em busca do primeiro emprego." : "Nenhuma experiência informada.", { cor: CINZA });
  } else {
    for (const e of experiencias) {
      novaPaginaSePreciso(12);
      texto(e.cargo, { tam: 10.5, negrito: true, entre: 0.2 });
      const detalhe = [e.empresa, e.atual ? "Emprego atual" : rotuloDuracao(e.duracao)].filter(Boolean).join("  ·  ");
      texto(detalhe, { tam: 9.5, cor: AZUL_CLARO, entre: e.descricao ? 0.6 : 2.5 });
      if (e.descricao) texto(e.descricao, { tam: 9.5, entre: 2.5 });
    }
  }

  // ─── Formação ───
  const cursos = c.cursos || [];
  if (c.escolaridade || cursos.length) {
    secao("Formação");
    if (c.escolaridade) {
      texto(`${c.escolaridade}${c.estudandoAtualmente ? " (estudando atualmente)" : ""}`, { negrito: true, entre: cursos.length ? 2 : 1.5 });
    }
    for (const curso of cursos) {
      const extra = [curso.instituicao, curso.anoConclusao ? String(curso.anoConclusao) : null].filter(Boolean).join(" · ");
      texto(`• ${curso.nomeCurso}${extra ? ` — ${extra}` : ""}`, { entre: 0.6 });
    }
  }

  // ─── Habilidades ───
  if (c.habilidades && c.habilidades.length) {
    secao("Habilidades");
    texto(c.habilidades.join("  ·  "));
  }

  // ─── Disponibilidade e outras informações ───
  const outras: string[] = [];
  const turnos = (c.turnos || []).map(rotuloTurno);
  if (turnos.length) outras.push(`Turnos: ${turnos.join(", ")}`);
  if (c.disponivelFimDeSemana) outras.push("Disponível aos fins de semana");
  if (c.inicioImediato) outras.push("Pode começar imediatamente");
  if (c.possuiCnh) outras.push(`CNH${c.categoriaCnh ? ` categoria ${c.categoriaCnh}` : ""}`);
  if (c.possuiVeiculo) outras.push("Possui veículo próprio");
  if (c.pretensaoSalarial) outras.push(`Pretensão salarial: ${moeda(c.pretensaoSalarial)}`);
  if (outras.length) {
    secao("Disponibilidade e outras informações");
    for (const linha of outras) texto(`• ${linha}`, { entre: 0.6 });
  }

  // ─── Referência ───
  if (c.referencia?.nome) {
    secao("Referência");
    const r = c.referencia;
    texto([r.nome, r.relacao, r.telefone ? formatTelefone(r.telefone) : null].filter(Boolean).join("  ·  "));
  }

  // ─── Rodapé em todas as páginas ───
  const dataCand = info.dataCandidatura ? new Date(info.dataCandidatura).toLocaleDateString("pt-BR") : null;
  const origem = [
    info.cargoVaga ? `Candidatura para ${info.cargoVaga}` : null,
    info.nomeEmpresa,
    dataCand ? `em ${dataCand}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, ALTURA - 16, LARGURA - MARGEM, ALTURA - 16);

    // Logo no canto direito (proporção do arquivo: 584 x 112)
    const alturaLogo = 6;
    const larguraLogo = (alturaLogo * 584) / 112;
    if (logo) doc.addImage(logo, "PNG", LARGURA - MARGEM - larguraLogo, ALTURA - 13.2, larguraLogo, alturaLogo);

    const larguraRodape = UTIL - (logo ? larguraLogo + 6 : 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    if (origem) doc.text(doc.splitTextToSize(origem, larguraRodape)[0], MARGEM, ALTURA - 10.5);
    const pagina = total > 1 ? `  ·  página ${p} de ${total}` : "";
    doc.text(`Currículo enviado pelo MapVagas · mapvagas.app.br${pagina}`, MARGEM, origem ? ALTURA - 6.8 : ALTURA - 9);
  }

  doc.setProperties({ title: `Currículo - ${c.nome}`, creator: "MapVagas" });
  doc.save(nomeDoArquivo(c.nome));
}
