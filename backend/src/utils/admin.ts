// Quem é administrador do MapVagas: lista de e-mails na variável ADMIN_EMAILS
// (no .env e no Render), separados por vírgula. Ex:
//   ADMIN_EMAILS="voce@gmail.com,colega@gmail.com"
// Não existe nenhum jeito de virar administrador pelo site.

export function emailsAdmin(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ehAdmin(email: string | null | undefined): boolean {
  return Boolean(email && emailsAdmin().includes(email.trim().toLowerCase()));
}
