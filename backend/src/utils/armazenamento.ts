import crypto from "crypto";
import sharp from "sharp";

// Fotos ficam no Supabase Storage, num "bucket" público chamado "fotos".
// Precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env (só no backend!).

const BUCKET = "fotos";
const TAMANHO_FOTO = 512; // px (quadrada)

function configuracao() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return { url, chave };
}

export function uploadDeFotoConfigurado(): boolean {
  return configuracao() !== null;
}

// Endereço público de uma foto nossa (para conferir se um link é do nosso bucket)
export function prefixoPublicoFotos(): string | null {
  const cfg = configuracao();
  return cfg ? `${cfg.url}/storage/v1/object/public/${BUCKET}/` : null;
}

export function ehFotoNossa(link: string | null | undefined): boolean {
  const prefixo = prefixoPublicoFotos();
  return Boolean(link && prefixo && link.startsWith(prefixo));
}

let bucketVerificado = false;

// Cria o bucket na primeira vez, se ainda não existir
async function garantirBucket() {
  if (bucketVerificado) return;
  const cfg = configuracao()!;
  const resposta = await fetch(`${cfg.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.chave}`, apikey: cfg.chave, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 1024 * 1024, // 1 MB (as fotos processadas têm ~30-80 KB)
      allowed_mime_types: ["image/webp"],
    }),
  });
  // 200 = criado; 400/409 = já existia. Qualquer outro código é problema de configuração.
  if (!resposta.ok && resposta.status !== 400 && resposta.status !== 409) {
    throw new Error(`Não foi possível preparar o armazenamento de fotos (HTTP ${resposta.status}).`);
  }
  bucketVerificado = true;
}

export class ErroImagemInvalida extends Error {}

// Recebe os bytes enviados, confere se é imagem de verdade, recorta em quadrado,
// reduz para 512x512, converte para WebP e REMOVE metadados (como GPS da câmera).
export async function processarFoto(bytes: Buffer): Promise<Buffer> {
  try {
    const imagem = sharp(bytes, { limitInputPixels: 40_000_000 }).rotate(); // .rotate() respeita a orientação do celular
    const info = await imagem.metadata();
    if (!info.format || !["jpeg", "png", "webp", "heif", "avif"].includes(info.format)) {
      throw new ErroImagemInvalida("Formato de imagem não suportado. Use JPG, PNG ou WebP.");
    }
    return await imagem
      .resize(TAMANHO_FOTO, TAMANHO_FOTO, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (erro) {
    if (erro instanceof ErroImagemInvalida) throw erro;
    throw new ErroImagemInvalida("O arquivo enviado não é uma imagem válida.");
  }
}

export async function enviarFoto(pasta: string, conteudo: Buffer): Promise<string> {
  const cfg = configuracao();
  if (!cfg) throw new Error("Upload de fotos não configurado.");
  await garantirBucket();

  const nome = `${pasta}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;
  const resposta = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${nome}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.chave}`,
      apikey: cfg.chave,
      "Content-Type": "image/webp",
      "Cache-Control": "max-age=31536000",
    },
    body: new Uint8Array(conteudo),
  });

  if (!resposta.ok) {
    throw new Error(`Falha ao salvar a foto (HTTP ${resposta.status}).`);
  }

  return `${prefixoPublicoFotos()}${nome}`;
}

// Apaga uma foto antiga do nosso bucket (ignora links de fora e erros)
export async function apagarFoto(link: string | null | undefined) {
  const cfg = configuracao();
  const prefixo = prefixoPublicoFotos();
  if (!cfg || !prefixo || !link || !link.startsWith(prefixo)) return;
  const caminho = link.slice(prefixo.length);
  try {
    await fetch(`${cfg.url}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.chave}`, apikey: cfg.chave, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [caminho] }),
    });
  } catch (erro) {
    console.warn("Não foi possível apagar a foto antiga:", erro);
  }
}
