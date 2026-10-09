// Modelos dos e-mails de aviso do MapVagas.
// HTML simples com estilos inline (é o que funciona no Gmail, Outlook e celular).

export type EmailPronto = { assunto: string; html: string; texto: string };

const AZUL = "#0F2C4A";
const LARANJA = "#F0A93C";

function urlDoSite(caminho: string) {
  const base = (process.env.FRONTEND_URL || "https://emprega-patos.vercel.app").split(",")[0].trim().replace(/\/+$/, "");
  return `${base}${caminho}`;
}

// Tudo que vem do usuário passa por aqui antes de entrar no HTML
function esc(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] || nome;
}

export function formatarDataEntrevista(data: Date) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
  // "sexta-feira, 16 de outubro às 14:00" → primeira letra maiúscula
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function caixaDeMensagem(titulo: string, mensagem: string) {
  return `
    <div style="margin:20px 0 0;padding:14px 16px;background:#F4F6F9;border-left:4px solid ${LARANJA};border-radius:6px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#64748B;text-transform:uppercase;letter-spacing:.5px;">${titulo}</p>
      <p style="margin:0;font-size:15px;line-height:1.5;color:#1E293B;white-space:pre-line;">${esc(mensagem)}</p>
    </div>`;
}

function layout(opcoes: { preHeader: string; corpo: string; botaoTexto: string; botaoLink: string; rodape: string }) {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF1F5;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opcoes.preHeader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:${AZUL};padding:18px 24px;">
            <span style="font-size:20px;font-weight:bold;color:#FFFFFF;">Map<span style="color:${LARANJA};">Vagas</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 8px;color:#1E293B;font-size:15px;line-height:1.6;">
            ${opcoes.corpo}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px 28px;">
            <a href="${opcoes.botaoLink}" style="display:inline-block;background:${AZUL};color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:8px;">${opcoes.botaoTexto}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #E2E8F0;font-size:12px;line-height:1.5;color:#94A3B8;">
            ${opcoes.rodape}<br>
            Este é um aviso automático do MapVagas. Não é preciso responder.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── 1. Empresa: chegou um candidato novo ───
export function emailNovoCandidato(d: {
  nomeEmpresa: string;
  nomeCandidato: string;
  cargo: string;
  vagaId: string;
  mensagemCandidato?: string | null;
}): EmailPronto {
  const link = urlDoSite(`/vagas/${d.vagaId}/candidatos`);
  const assunto = `Novo candidato para ${d.cargo}`;
  const corpo = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:${AZUL};">Você tem um novo candidato 🎉</p>
    <p style="margin:12px 0 0;">Olá, <b>${esc(d.nomeEmpresa)}</b>!</p>
    <p style="margin:8px 0 0;"><b>${esc(d.nomeCandidato)}</b> se candidatou à vaga de <b>${esc(d.cargo)}</b>.</p>
    ${d.mensagemCandidato ? caixaDeMensagem("Mensagem do candidato", d.mensagemCandidato) : ""}
    <p style="margin:20px 0 0;">Veja o currículo completo e responda pelo MapVagas.</p>`;
  return {
    assunto,
    html: layout({
      preHeader: `${d.nomeCandidato} se candidatou à vaga de ${d.cargo}.`,
      corpo,
      botaoTexto: "Ver candidatos",
      botaoLink: link,
      rodape: "Você recebeu este e-mail porque publicou esta vaga no MapVagas.",
    }),
    texto:
      `Olá, ${d.nomeEmpresa}!\n\n${d.nomeCandidato} se candidatou à vaga de ${d.cargo}.\n` +
      (d.mensagemCandidato ? `\nMensagem do candidato:\n${d.mensagemCandidato}\n` : "") +
      `\nVeja o currículo e responda: ${link}\n\n— MapVagas`,
  };
}

// ─── 2. Candidato: foi aprovado (com data da entrevista) ───
export function emailCandidaturaAprovada(d: {
  nomeCandidato: string;
  cargo: string;
  nomeEmpresa: string;
  enderecoVaga?: string | null;
  dataEntrevista?: Date | null;
  mensagem?: string | null;
}): EmailPronto {
  const link = urlDoSite("/perfil/candidato/candidaturas");
  const assunto = `Boa notícia! ${d.nomeEmpresa} quer te entrevistar`;
  const quando = d.dataEntrevista ? formatarDataEntrevista(d.dataEntrevista) : null;
  const detalhes = quando
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0;width:100%;background:#FFF7EA;border:1px solid #F6D9A8;border-radius:8px;">
      <tr><td style="padding:14px 16px;">
        <p style="margin:0;font-size:12px;font-weight:bold;color:#B26B00;text-transform:uppercase;letter-spacing:.5px;">Entrevista</p>
        <p style="margin:6px 0 0;font-size:17px;font-weight:bold;color:${AZUL};">📅 ${esc(quando)}</p>
        ${d.enderecoVaga ? `<p style="margin:6px 0 0;font-size:14px;color:#475569;">📍 ${esc(d.enderecoVaga)}</p>` : ""}
      </td></tr>
    </table>`
    : "";
  const corpo = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:${AZUL};">Você foi aprovado(a)! 🎉</p>
    <p style="margin:12px 0 0;">Olá, <b>${esc(primeiroNome(d.nomeCandidato))}</b>!</p>
    <p style="margin:8px 0 0;">A empresa <b>${esc(d.nomeEmpresa)}</b> aprovou sua candidatura para <b>${esc(d.cargo)}</b>.</p>
    ${detalhes}
    ${d.mensagem ? caixaDeMensagem(`Mensagem de ${d.nomeEmpresa}`, d.mensagem) : ""}
    <p style="margin:20px 0 0;">Boa sorte! 🍀</p>`;
  return {
    assunto,
    html: layout({
      preHeader: quando ? `Entrevista: ${quando}` : `Sua candidatura para ${d.cargo} foi aprovada.`,
      corpo,
      botaoTexto: "Ver minhas candidaturas",
      botaoLink: link,
      rodape: "Você recebeu este e-mail porque se candidatou a esta vaga no MapVagas.",
    }),
    texto:
      `Olá, ${primeiroNome(d.nomeCandidato)}!\n\nA empresa ${d.nomeEmpresa} aprovou sua candidatura para ${d.cargo}.\n` +
      (quando ? `\nEntrevista: ${quando}\n` : "") +
      (quando && d.enderecoVaga ? `Local: ${d.enderecoVaga}\n` : "") +
      (d.mensagem ? `\nMensagem de ${d.nomeEmpresa}:\n${d.mensagem}\n` : "") +
      `\nVeja suas candidaturas: ${link}\n\nBoa sorte!\n— MapVagas`,
  };
}

// ─── 3. Candidato: não foi selecionado ───
export function emailCandidaturaRecusada(d: {
  nomeCandidato: string;
  cargo: string;
  nomeEmpresa: string;
  mensagem?: string | null;
}): EmailPronto {
  const link = urlDoSite("/vagas");
  const assunto = `Atualização da sua candidatura para ${d.cargo}`;
  const corpo = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:${AZUL};">Sua candidatura teve uma resposta</p>
    <p style="margin:12px 0 0;">Olá, <b>${esc(primeiroNome(d.nomeCandidato))}</b>!</p>
    <p style="margin:8px 0 0;">A empresa <b>${esc(d.nomeEmpresa)}</b> analisou sua candidatura para <b>${esc(d.cargo)}</b> e, desta vez, seguiu com outro perfil.</p>
    ${d.mensagem ? caixaDeMensagem(`Mensagem de ${d.nomeEmpresa}`, d.mensagem) : ""}
    <p style="margin:20px 0 0;">Não desanime: tem outras vagas esperando por você no MapVagas.</p>`;
  return {
    assunto,
    html: layout({
      preHeader: `Resposta da ${d.nomeEmpresa} sobre a vaga de ${d.cargo}.`,
      corpo,
      botaoTexto: "Ver outras vagas",
      botaoLink: link,
      rodape: "Você recebeu este e-mail porque se candidatou a esta vaga no MapVagas.",
    }),
    texto:
      `Olá, ${primeiroNome(d.nomeCandidato)}!\n\nA empresa ${d.nomeEmpresa} analisou sua candidatura para ${d.cargo} e, desta vez, seguiu com outro perfil.\n` +
      (d.mensagem ? `\nMensagem de ${d.nomeEmpresa}:\n${d.mensagem}\n` : "") +
      `\nVeja outras vagas: ${link}\n\n— MapVagas`,
  };
}
