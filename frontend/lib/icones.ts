// lib/iconesCargos.tsx
import {
  Bike, Package, ShoppingCart, User, Shield, Fuel,
  Wrench, Sparkles, TreePine, Utensils, ChefHat, Cake,
  HardHat, Paintbrush, Zap, Droplet, Hammer, Flame,
  Scissors, Baby, HeartHandshake, Home, UserRound,BriefcaseBusiness,
  HandCoins,

} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONES_POR_CARGO: Record<string, LucideIcon> = {
  "Ajudante de Pedreiro": HardHat,
  "Ajudante Geral": Hammer,
  "Atendente": User,
  "Auxiliar de Almoxarifado": Package,
  "Auxiliar de Cozinha": ChefHat,
  "Auxiliar de Depósito": Package,
  "Auxiliar de Limpeza": Sparkles,
  "Babá": Baby,
  "Balconista": ShoppingCart,
  "Barbeiro": Scissors,
  "Borracheiro": Wrench,
  "Cabeleireiro": Scissors,
  "Carregador": Package,
  "Chapeiro": ChefHat,
  "Confeiteiro": Cake,
  "Costureira": Scissors,
  "Cozinheiro": ChefHat,
  "Cuidador de Idosos": HeartHandshake,
  "Descarregador": Package,
  "Diarista": Sparkles,
  "Doméstica": Home,
  "Eletricista": Zap,
  "Empacotador": Package,
  "Encanador": Droplet,
  "Entregador": Bike,
  "Estoquista": Package,
  "Faxineiro": Sparkles,
  "Frentista": Fuel,
  "Gerente": BriefcaseBusiness ,
  "Garçom": Utensils,
  "Jardineiro": TreePine,
  "Lavador de Veículos": Droplet,
  "Marceneiro": Hammer,
  "Mecânico": Wrench,
  "Motoboy": Bike,
  "Operador de Caixa": HandCoins,
  "Panfleteiro": User,
  "Pedreiro": HardHat,
  "Pintor": Paintbrush,
  "Pizzaiolo": ChefHat,
  "Porteiro": Shield,
  "Promotor de Vendas": ShoppingCart,
  "Recepcionista": User,
  "Repositor de Mercadorias": Package,
  "Separador de Mercadorias": Package,
  "Servente": Hammer,
  "Soldador": Flame,
  "Vendedor": ShoppingCart,
  "Vigia": Shield,
  "Zelador": Home,
};

const ICONE_PADRAO: LucideIcon = Package;

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


const ICONES_NORMALIZADOS: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(ICONES_POR_CARGO).map(([cargo, icone]) => [
    normalizar(cargo),
    icone,
  ])
);

export function getIconePorCargo(cargo: string): LucideIcon {
  if (!cargo) return ICONE_PADRAO;

  const cargoNormalizado = normalizar(cargo);

  
  if (ICONES_NORMALIZADOS[cargoNormalizado]) {
    return ICONES_NORMALIZADOS[cargoNormalizado];
  }

  
  for (const [chave, icone] of Object.entries(ICONES_NORMALIZADOS)) {
    if (cargoNormalizado.includes(chave) || chave.includes(cargoNormalizado)) {
      return icone;
    }
  }

  return ICONE_PADRAO;
}