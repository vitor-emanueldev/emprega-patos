import bcrypt from "bcrypt";

export async function criptografarSenha(senha: string): Promise<string> {
  const saltRounds = 10;
  const hash = await bcrypt.hash(senha, saltRounds);
  return hash;
}

export async function compararSenha(senha: string, hashSalvo: string): Promise<boolean> {
  const senhaCorreta = await bcrypt.compare(senha, hashSalvo);
  return senhaCorreta;
}