const API_URL = "http://localhost:3001";

type LoginResponse = {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    [key: string]: unknown;
  };
};

export async function login(
  email: string,
  senha: string
): Promise<LoginResponse> {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao fazer login");
  }

  return dados;
}

export async function cadastrar(nome: string, email: string, senha: string) {
  const resposta = await fetch(`${API_URL}/auth/cadastro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao cadastrar");
  }

  return dados;
}

export async function verificarEmpresa(token: string) {
  const resposta = await fetch(`${API_URL}/empresas/minha-empresa`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (resposta.status === 404) {
    return null; // usuário não tem empresa cadastrada ainda
  }

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao verificar empresa");
  }

  return dados;
}

export async function cadastrarEmpresa(
  token: string,
  dados: {
    nomeEmpresa: string;
    cnpj: string;
    setor?: string;
    descricao?: string;
    telefone?: string;
  }
) {
  const resposta = await fetch(`${API_URL}/empresas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao cadastrar empresa");
  }

  return resultado;
}