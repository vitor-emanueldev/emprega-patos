// Lista única de categorias (área/função) de vaga.
// A empresa só pode escolher daqui: assim os filtros e os atalhos da página inicial
// sempre batem com as vagas. Quem não achar a função escolhe "Outros".
//
// ATENÇÃO: existe uma cópia desta lista no backend (backend/src/validacao/categoriasVagas.ts),
// que recusa áreas fora dela. Ao mudar aqui, mude lá também.

const FUNCOES = [
  "Açougueiro",
  "Ajudante de Pedreiro",
  "Ajudante Geral",
  "Atendente",
  "Atendente de Telemarketing",
  "Auxiliar Administrativo",
  "Auxiliar de Almoxarifado",
  "Auxiliar de Cozinha",
  "Auxiliar de Depósito",
  "Auxiliar de Limpeza",
  "Auxiliar de Produção",
  "Babá",
  "Balconista",
  "Barbeiro",
  "Borracheiro",
  "Cabeleireiro",
  "Carregador",
  "Chapeiro",
  "Confeiteiro",
  "Costureira",
  "Cozinheiro",
  "Cuidador de Idosos",
  "Descarregador",
  "Diarista",
  "Doméstica",
  "Eletricista",
  "Empacotador",
  "Encanador",
  "Entregador",
  "Estagiário",
  "Estoquista",
  "Faxineiro",
  "Frentista",
  "Garçom",
  "Jardineiro",
  "Lavador de Veículos",
  "Manicure",
  "Marceneiro",
  "Mecânico",
  "Motoboy",
  "Motorista",
  "Operador de Caixa",
  "Padeiro",
  "Panfleteiro",
  "Pedreiro",
  "Pintor",
  "Pizzaiolo",
  "Porteiro",
  "Professor",
  "Promotor de Vendas",
  "Recepcionista",
  "Repositor de Mercadorias",
  "Secretária",
  "Separador de Mercadorias",
  "Servente",
  "Soldador",
  "Técnico de Enfermagem",
  "Vendedor",
  "Vigia",
  "Zelador",
] as const;

export const CATEGORIA_OUTROS = "Outros";

// Em ordem alfabética, com "Outros" sempre no fim
export const CATEGORIAS_VAGA = [...FUNCOES, CATEGORIA_OUTROS] as const;

export function ehCategoriaValida(area: string | null | undefined) {
  return Boolean(area && (CATEGORIAS_VAGA as readonly string[]).includes(area));
}
