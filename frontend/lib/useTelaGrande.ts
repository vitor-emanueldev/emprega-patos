"use client";

import { useEffect, useState } from "react";

// true em telas de computador (>= 1024px). Atualiza se a janela mudar de tamanho.
export function useTelaGrande() {
  const [grande, setGrande] = useState<boolean | null>(null);
  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 1024px)");
    const atualizar = () => setGrande(consulta.matches);
    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);
  return grande;
}
