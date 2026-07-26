export type PontoReferencia = {
  id: string;
  nome: string;
  tipo: "faculdade" | "hospital" | "farmacia" | "emergencia" | "supermercado" | "shopping";
  latitude: number;
  longitude: number;
};

export const PONTOS_REFERENCIA: PontoReferencia[] = [
  // Faculdades
  { id: "1", nome: "Centro Universitário de Patos (UNIFIP)", tipo: "faculdade", latitude: -7.020407, longitude: -37.279342 },
  { id: "2", nome: "UFCG - Campus de Patos", tipo: "faculdade", latitude: -7.058523, longitude: -37.276878 },
  { id: "3", nome: "IFPB - Campus Patos", tipo: "faculdade", latitude: -7.074478, longitude: -37.286148 },

  // Supermercados / hortifruti / atacado
  { id: "4", nome: "Atacadão - Patos", tipo: "supermercado", latitude: -7.017470, longitude: -37.258548 },
  { id: "5", nome: "Guedes Supermercado", tipo: "supermercado", latitude: -7.028288, longitude: -37.281387 },
  { id: "6", nome: "Hiper Queiroz", tipo: "supermercado", latitude: -7.037418, longitude: -37.277603 },
  { id: "7", nome: "Mercadão do Mestre", tipo: "supermercado", latitude: -7.029956, longitude: -37.278593 },
  { id: "8", nome: "Supermercado Leandro", tipo: "supermercado", latitude: -7.033798, longitude: -37.278782 },
  { id: "9", nome: "Mix Mateus", tipo: "supermercado", latitude: -7.019883, longitude: -37.274679 },
  { id: "10", nome: "Ceasa - Patos (hortifruti)", tipo: "supermercado", latitude: -7.008242, longitude: -37.280573 },
  { id: "11", nome: "Mercado Central", tipo: "supermercado", latitude: -7.027828, longitude: -37.279082 },

  // Shoppings
  { id: "12", nome: "Patos Shopping", tipo: "shopping", latitude: -7.022032, longitude: -37.278564 },
  { id: "13", nome: "Guedes Shopping", tipo: "shopping", latitude: -7.028322, longitude: -37.281412 },
  { id: "14", nome: "Shopping Cidade", tipo: "shopping", latitude: -7.026892, longitude: -37.277882 },

  // Saúde (hospitais, UBS, maternidade, oncologia, cardiologia)
  { id: "15", nome: "Complexo de Saúde Segundo Brito", tipo: "hospital", latitude: -7.025799, longitude: -37.253375 },
  { id: "16", nome: "UBS Enaldo Torres", tipo: "hospital", latitude: -7.018664, longitude: -37.266771 },
  { id: "17", nome: "Complexo Hospitalar Regional de Patos", tipo: "hospital", latitude: -7.017225, longitude: -37.282890 },
  { id: "18", nome: "Hospital Infantil Noaldo Leite", tipo: "hospital", latitude: -7.015006, longitude: -37.281098 },
  { id: "19", nome: "Hospital São Francisco", tipo: "hospital", latitude: -7.027118, longitude: -37.274706 },
  { id: "20", nome: "Maternidade Dr. Peregrino Filho", tipo: "hospital", latitude: -7.034192, longitude: -37.289902 },
  { id: "21", nome: "Hospital do Bem (Oncologia do Sertão)", tipo: "hospital", latitude: -7.016269, longitude: -37.282302 },
  { id: "22", nome: "Cardiovasc HSF", tipo: "hospital", latitude: -7.027094, longitude: -37.274772 },

  // Farmácia
  { id: "23", nome: "Mega Farma", tipo: "farmacia", latitude: -7.018219, longitude: -37.272314 },

  // Emergência
  { id: "24", nome: "SAMU Regional Patos", tipo: "emergencia", latitude: -7.017936, longitude: -37.272231 },
  { id: "25", nome: "Corpo de Bombeiros", tipo: "emergencia", latitude: -7.022180, longitude: -37.289251 },
  { id: "26", nome: "UEPB - Universidade Estadual da Paraíba - Campus VII", tipo: "faculdade", latitude: -7.021591379869715, longitude: -37.26528254632004 },
];