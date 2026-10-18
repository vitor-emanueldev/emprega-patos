// Links do currículo (LinkedIn, GitHub, portfólio...): nome amigável pelo endereço

export function nomeDoLink(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Link";
  }
  if (host.endsWith("linkedin.com")) return "LinkedIn";
  if (host.endsWith("github.com")) return "GitHub";
  if (host.endsWith("behance.net")) return "Behance";
  if (host.endsWith("instagram.com")) return "Instagram";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "YouTube";
  if (host.endsWith("drive.google.com") || host.endsWith("docs.google.com")) return "Google Drive";
  return host || "Link";
}

// O que aparece no botão: "LinkedIn · /in/vitor" ou o endereço curto
export function textoDoLink(url: string) {
  try {
    const u = new URL(url);
    const caminho = u.pathname.replace(/\/+$/, "");
    const nome = nomeDoLink(url);
    return caminho && caminho !== "/" && nome !== u.hostname.replace(/^www\./, "") ? `${nome} · ${caminho}` : nome;
  } catch {
    return url;
  }
}
