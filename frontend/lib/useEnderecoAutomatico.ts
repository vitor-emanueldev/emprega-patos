"use client";

import { useRef, useState } from "react";
import { enderecoDoPonto, type EnderecoDoPonto } from "@/lib/enderecoDoPonto";

export type EstadoEndereco =
  | { tipo: "buscando" }
  | { tipo: "preenchido"; endereco: EnderecoDoPonto }
  | { tipo: "sugestao"; endereco: EnderecoDoPonto }
  | { tipo: "nada" }
  | { tipo: "erro" };

type Campos = {
  endereco: string;
  setEndereco: (v: string) => void;
  bairro: string;
  setBairro: (v: string) => void;
};

// Ao clicar no mapa, preenche endereço e bairro sozinho.
// Só sobrescreve o que estiver vazio ou o que ele mesmo preencheu antes:
// se a pessoa digitou algo diferente, mostra uma sugestão com botão "Usar este endereço".
export function useEnderecoAutomatico(campos: Campos) {
  const [estado, setEstado] = useState<EstadoEndereco | null>(null);
  const preenchidoAuto = useRef({ endereco: "", bairro: "" });
  const ultimoPedido = useRef(0);

  function aplicar(e: EnderecoDoPonto) {
    if (e.endereco) {
      campos.setEndereco(e.endereco);
      preenchidoAuto.current.endereco = e.endereco;
    }
    if (e.bairro) {
      campos.setBairro(e.bairro);
      preenchidoAuto.current.bairro = e.bairro;
    }
  }

  async function aoMarcarPonto(latitude: number, longitude: number) {
    const pedido = ++ultimoPedido.current;
    const enderecoAtual = campos.endereco.trim();
    const bairroAtual = campos.bairro.trim();
    setEstado({ tipo: "buscando" });

    try {
      const e = await enderecoDoPonto(latitude, longitude);
      if (pedido !== ultimoPedido.current) return; // a pessoa já clicou em outro ponto

      if (!e) {
        setEstado({ tipo: "nada" });
        return;
      }

      const podeEndereco = !enderecoAtual || enderecoAtual === preenchidoAuto.current.endereco;
      const podeBairro = !bairroAtual || bairroAtual === preenchidoAuto.current.bairro;

      if (podeEndereco && podeBairro) {
        aplicar(e);
        setEstado({ tipo: "preenchido", endereco: e });
      } else {
        setEstado({ tipo: "sugestao", endereco: e });
      }
    } catch {
      if (pedido === ultimoPedido.current) setEstado({ tipo: "erro" });
    }
  }

  function usarSugestao() {
    if (estado?.tipo === "sugestao") {
      aplicar(estado.endereco);
      setEstado({ tipo: "preenchido", endereco: estado.endereco });
    }
  }

  return { estado, aoMarcarPonto, usarSugestao };
}
