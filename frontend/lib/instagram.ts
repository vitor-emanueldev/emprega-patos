// Instagram da empresa: guardamos só o nome de usuário (sem @ e sem link).
// Aceita o que a pessoa colar: "@loja", "loja", "instagram.com/loja", "https://www.instagram.com/loja/?hl=pt".
export function limparInstagram(valor: string): string {
  let v = valor.trim();
  const link = v.match(/instagram\.com\/([^/?#\s]+)/i);
  if (link) v = link[1];
  return v.replace(/^@+/, "").replace(/\s+/g, "").toLowerCase().slice(0, 30);
}

export function instagramValido(usuario: string): boolean {
  return usuario === "" || /^[a-z0-9._]{1,30}$/.test(usuario);
}

export function linkInstagram(usuario: string): string {
  return `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
}
