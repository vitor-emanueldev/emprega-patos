// frontend/lib/habilidadesCatalogo.ts
//
// Lista curada de habilidades pra alimentar o autocomplete do currículo.
// Cobre ferramentas de escritório, tecnologia, idiomas, vendas/atendimento,
// operacional/logística e comportamentais — o tipo de coisa que empresas
// de Patos-PB costumam procurar (comércio, serviços, indústria, saúde).

export const HABILIDADES_CATALOGO: string[] = [
  // Informática / Escritório
  "Pacote Office",
  "Excel",
  "Excel avançado",
  "Word",
  "PowerPoint",
  "Google Sheets",
  "Google Docs",
  "Digitação rápida",
  "Informática básica",
  "Redes sociais",
  "Canva",
  "Photoshop",

  // Tecnologia / Programação
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C#",
  "PHP",
  "HTML e CSS",
  "React",
  "Node.js",
  "SQL",
  "Banco de dados",
  "Suporte técnico",
  "Manutenção de computadores",

  // Vendas / Atendimento
  "Atendimento ao cliente",
  "Vendas",
  "Vendas no varejo",
  "Negociação",
  "Pós-venda",
  "Telemarketing",
  "Operação de caixa",
  "Caixa",
  "Recepção",
  "Televendas",

  // Administrativo / Financeiro
  "Organização",
  "Rotinas administrativas",
  "Controle de estoque",
  "Contas a pagar e receber",
  "Emissão de nota fiscal",
  "Arquivo e documentação",
  "Digitação de dados",

  // Logística / Operacional
  "Entregas",
  "Direção defensiva",
  "Carga e descarga",
  "Conferência de mercadorias",
  "Operação de empilhadeira",
  "Manuseio de ferramentas",

  // Saúde / Cuidados
  "Primeiros socorros",
  "Cuidados com idosos",
  "Cuidados com crianças",
  "Noções de enfermagem",

  // Alimentação
  "Cozinha",
  "Manipulação de alimentos",
  "Boas práticas de higiene",
  "Confeitaria",
  "Atendimento em restaurante",

  // Construção / Indústria
  "Leitura de projetos",
  "Elétrica básica",
  "Hidráulica básica",
  "Solda",
  "Operação de máquinas",
  "Segurança do trabalho",

  // Idiomas
  "Inglês básico",
  "Inglês intermediário",
  "Inglês avançado",
  "Espanhol básico",
  "Espanhol intermediário",
  "Libras",

  // Comportamentais
  "Proatividade",
  "Comunicação",
  "Trabalho em equipe",
  "Liderança",
  "Resolução de problemas",
  "Flexibilidade",
  "Responsabilidade",
  "Pontualidade",
  "Criatividade",
  "Organização pessoal",
  "Facilidade de aprendizado",
  "Trabalho sob pressão",
  "Atenção aos detalhes",
  "Ética profissional",
  "Empatia",
  "Iniciativa",
];

/**
 * Retorna sugestões de habilidades que combinam com o texto digitado,
 * ignorando acentos e maiúsculas/minúsculas, e excluindo o que já foi
 * selecionado. Limita a quantidade de sugestões pra não poluir a tela.
 */
export function buscarSugestoesHabilidade(
  textoDigitado: string,
  jaSelecionadas: string[],
  limite: number = 6
): string[] {
  const normalizar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const termo = normalizar(textoDigitado);

  if (!termo) {
    return [];
  }

  const jaSelecionadasNormalizadas = jaSelecionadas.map(normalizar);

  return HABILIDADES_CATALOGO.filter((habilidade) => {
    const habilidadeNormalizada = normalizar(habilidade);

    return (
      habilidadeNormalizada.includes(termo) &&
      !jaSelecionadasNormalizadas.includes(habilidadeNormalizada)
    );
  }).slice(0, limite);
}
