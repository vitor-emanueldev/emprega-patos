"use client";

import { useState } from "react";
import type { Posicao } from "@/lib/filtrosVagas";

// Pede a localização do aparelho (só quando a pessoa toca em "Perto de mim").
// A posição fica só no navegador: não é enviada para o servidor.
export function useMinhaLocalizacao() {
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  function pedir() {
    setErro("");
    if (!("geolocation" in navigator)) {
      setErro("Seu navegador não permite usar a localização.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosicao({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setBuscando(false);
      },
      (e) => {
        setBuscando(false);
        setErro(
          e.code === e.PERMISSION_DENIED
            ? "Você não permitiu o acesso à localização. Libere nas configurações do navegador para ver as vagas mais perto."
            : "Não foi possível descobrir sua localização agora. Tente de novo."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  }

  function limpar() {
    setPosicao(null);
    setErro("");
  }

  return { posicao, buscando, erro, pedir, limpar };
}
