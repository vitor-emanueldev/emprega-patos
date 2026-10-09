import { OAuth2Client } from "google-auth-library";
import type { EmailPronto } from "./modelosEmail";

// Envio pela API do Gmail (HTTPS, porta 443).
// Não usamos SMTP porque o plano grátis do Render bloqueia as portas de e-mail (25/465/587).
//
// Variáveis (.env e Render):
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET  → cliente OAuth "MapVagas e-mails" no Google Cloud
//   GMAIL_REFRESH_TOKEN                   → gerado no OAuth Playground com a conta de avisos
//   EMAIL_REMETENTE                       → ex: mapvagas.avisos@gmail.com

const URL_ENVIO = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

let cliente: OAuth2Client | null = null;

export function emailConfigurado() {
  return Boolean(
    process.env.GMAIL_CLIENT_ID?.trim() &&
      process.env.GMAIL_CLIENT_SECRET?.trim() &&
      process.env.GMAIL_REFRESH_TOKEN?.trim() &&
      process.env.EMAIL_REMETENTE?.trim()
  );
}

function obterCliente() {
  if (!cliente) {
    cliente = new OAuth2Client(process.env.GMAIL_CLIENT_ID!.trim(), process.env.GMAIL_CLIENT_SECRET!.trim());
    cliente.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN!.trim() });
  }
  return cliente;
}

// Cabeçalhos com acento precisam ser codificados (RFC 2047)
function cabecalho(texto: string) {
  return `=?UTF-8?B?${Buffer.from(texto, "utf8").toString("base64")}?=`;
}

function emBlocos(base64: string) {
  return base64.replace(/(.{76})/g, "$1\r\n");
}

function montarMensagem(para: string, email: EmailPronto) {
  const separador = `mapvagas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const remetente = process.env.EMAIL_REMETENTE!.trim();
  const linhas = [
    `From: ${cabecalho("MapVagas")} <${remetente}>`,
    `To: <${para}>`,
    `Subject: ${cabecalho(email.assunto)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${separador}"`,
    "",
    `--${separador}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    emBlocos(Buffer.from(email.texto, "utf8").toString("base64")),
    `--${separador}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    emBlocos(Buffer.from(email.html, "utf8").toString("base64")),
    `--${separador}--`,
    "",
  ];
  return Buffer.from(linhas.join("\r\n"), "utf8").toString("base64url");
}

function emailValido(endereco: string | null | undefined): endereco is string {
  // Também impede quebra de linha (que poderia injetar cabeçalhos na mensagem)
  return Boolean(endereco && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(endereco));
}

/**
 * Envia o aviso em segundo plano: nunca trava nem derruba a requisição.
 * Se o e-mail falhar, a candidatura continua valendo; só fica o registro no log.
 */
export function enviarAviso(para: string | null | undefined, email: EmailPronto) {
  if (!emailConfigurado()) return;
  if (!emailValido(para)) return;

  obterCliente()
    .request({ url: URL_ENVIO, method: "POST", data: { raw: montarMensagem(para, email) }, timeout: 15000 })
    .catch((erro: any) => {
      const detalhe = erro?.response?.data?.error ?? erro?.message ?? erro;
      console.error(`Falha ao enviar e-mail ("${email.assunto}"):`, detalhe);
    });
}
