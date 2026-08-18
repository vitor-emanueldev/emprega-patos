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
    return null;
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
    endereco?: string;
    bairro?: string;
    latitude?: number;
    longitude?: number;
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

export type DadosAtualizarEmpresa = {
  nomeEmpresa: string;
  cnpj: string;
  setor?: string;
  descricao?: string;
  telefone?: string;
  endereco?: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
};

export async function atualizarEmpresa(
  token: string,
  dados: DadosAtualizarEmpresa
) {
  const resposta = await fetch(`${API_URL}/empresas/minha-empresa`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao atualizar empresa");
  }

  return resultado;
}

export type Vaga = {
  id: string;
  cargo: string;
  descricao: string;
  tipoContrato: string;
  area: string;
  salario: number | null;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  requisitos: string[];
  responsabilidades: string[];
  beneficios: string[];
  status: string;
  createdAt: string;
  empresa: {
    nomeEmpresa: string;
    setor?: string;
  };
};

export async function listarVagas(): Promise<Vaga[]> {
  const resposta = await fetch(`${API_URL}/vagas`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao carregar vagas");
  }

  return dados;
}

export async function minhasVagas(token: string): Promise<Vaga[]> {
  const resposta = await fetch(`${API_URL}/vagas/minhas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao carregar suas vagas");
  }

  return dados;
}

export async function detalhesVaga(id: string): Promise<Vaga> {
  const resposta = await fetch(`${API_URL}/vagas/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao carregar vaga");
  }

  return dados;
}

export type DadosVaga = {
  cargo: string;
  descricao: string;
  tipoContrato: string;
  area: string;
  salario?: number | null;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  requisitos?: string[];
  responsabilidades: string[];
  beneficios?: string[];
};

export async function publicarVaga(token: string, dados: DadosVaga) {
  const resposta = await fetch(`${API_URL}/vagas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao publicar vaga");
  }

  return resultado;
}

// ─── Perfil do Candidato ─────────────────────────────────────────────────────

export type DadosFormacao = {
  nivelEscolaridade: string;
  instituicao: string;
  anoInicio?: number | null;
  anoConclusao?: number | null;
};

export type DadosCurso = {
  nomeCurso: string;
  cargaHoraria?: string;
  instituicao?: string;
  anoConclusao?: number | null;
};

export type DadosExperiencia = {
  cargo: string;
  empresa: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  atual?: boolean;
  descricao?: string;
};

export type DadosCandidato = {
  telefone: string;
  cpf: string;
  dataNascimento: string;
  habilidades: string[];
  fotoUrl?: string;
  possuiCnh?: boolean;
  categoriaCnh?: string;
  possuiVeiculo?: boolean;
  cargoDesejado?: string;
  areaInteresse?: string;
  pretensaoSalarial?: number | null;
  diferencial?: string;
  formacoes?: DadosFormacao[];
  cursos?: DadosCurso[];
  experiencias?: DadosExperiencia[];
};

export type Candidato = {
  id: string;
  nome: string;
  telefone: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  habilidades: string[];
  fotoUrl: string | null;
  possuiCnh: boolean | null;
  categoriaCnh: string | null;
  possuiVeiculo: boolean | null;
  cargoDesejado: string | null;
  areaInteresse: string | null;
  pretensaoSalarial: number | null;
  diferencial: string | null;
  createdAt: string;
  usuarioId: string;
  formacoes: (DadosFormacao & { id: string })[];
  cursos: (DadosCurso & { id: string })[];
  experiencias: (DadosExperiencia & { id: string })[];
};

export async function tornarCandidato(
  token: string,
  dados: DadosCandidato
): Promise<Candidato> {
  const resposta = await fetch(`${API_URL}/candidatos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao completar perfil de candidato");
  }

  return resultado;
}

export async function buscarMinhaFicha(token: string): Promise<Candidato | null> {
  const resposta = await fetch(`${API_URL}/candidatos/minha-ficha`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (resposta.status === 404) {
    return null; // usuário ainda não completou o currículo
  }

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao buscar perfil de candidato");
  }

  return resultado;
}

export async function atualizarMinhaFicha(
  token: string,
  dados: DadosCandidato
): Promise<Candidato> {
  const resposta = await fetch(`${API_URL}/candidatos/minha-ficha`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao atualizar perfil de candidato");
  }

  return resultado;
}

// ─── Candidatura ──────────────────────────────────────────────────────────────

export type Candidatura = {
  id: string;
  status: string;
  createdAt: string;
  vagaId: string;
  candidatoId: string;
  vaga: Vaga;
};

export async function candidatarVaga(
  token: string,
  vagaId: string
): Promise<Candidatura> {
  const resposta = await fetch(`${API_URL}/vagas/${vagaId}/candidatar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao candidatar-se à vaga");
  }

  return resultado;
}

export async function minhasCandidaturas(token: string): Promise<Candidatura[]> {
  const resposta = await fetch(`${API_URL}/candidato/minhas-candidaturas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao buscar candidaturas");
  }

  return dados;
}

export async function cancelarCandidatura(token: string, candidaturaId: string) {
  const resposta = await fetch(`${API_URL}/candidaturas/${candidaturaId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(resultado.erro || "Erro ao cancelar candidatura");
  }

  return resultado;
}

export type Estatisticas = {
  vagasAtivas: number;
  empresas: number;
  candidatos: number;
};

export async function buscarEstatisticas(): Promise<Estatisticas> {
  const resposta = await fetch(`${API_URL}/estatisticas`, {
    cache: "no-store",
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Erro ao buscar estatísticas");
  return dados;
}