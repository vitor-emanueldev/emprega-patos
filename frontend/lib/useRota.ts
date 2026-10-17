"use client";

import { useEffect, useState } from "react";
import { buscarRota, type Rota } from "@/lib/api";
import type { Posicao } from "@/lib/filtrosVagas";

// Calcula a rota de carro até a vaga sempre que a vaga ou o ponto de partida mudam.
// vagaId ou posicao nulos = sem rota.
export function useRota(vagaId: string | null, posicao: Posicao | null) {
  const [rota, setRota] = useState<Rota | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState("");

  const lat = posicao?.latitude;
  const lng = posicao?.longitude;

  useEffect(() => {
    if (!vagaId || lat == null || lng == null) {
      setRota(null);
      setErro("");
      setCalculando(false);
      return;
    }
    let cancelado = false;
    setCalculando(true);
    setErro("");
    buscarRota(vagaId, lat, lng)
      .then((r) => !cancelado && setRota(r))
      .catch((e) => {
        if (cancelado) return;
        setRota(null);
        setErro(e.message || "Não foi possível calcular a rota agora.");
      })
      .finally(() => !cancelado && setCalculando(false));
    return () => {
      cancelado = true;
    };
  }, [vagaId, lat, lng]);

  return { rota, calculando, erro };
}
