"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { idsVagasSalvas, salvarVaga } from "@/lib/api";

type VagasSalvasContextType = {
  estaSalva: (vagaId: string) => boolean;
  // devolve false se a pessoa não está logada (quem chamou decide o que fazer)
  alternar: (vagaId: string) => Promise<boolean>;
  // espera terminar os salvamentos que ainda estão indo para o servidor
  aguardarPendentes: () => Promise<void>;
};

const VagasSalvasContext = createContext<VagasSalvasContextType | null>(null);

export function VagasSalvasProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const pendentes = useRef(new Set<Promise<unknown>>());

  // Carrega as vagas salvas quando a pessoa entra (e limpa quando sai)
  useEffect(() => {
    if (!token) {
      setIds(new Set());
      return;
    }
    idsVagasSalvas(token)
      .then((lista) => setIds(new Set(lista)))
      .catch(() => {});
  }, [token]);

  const estaSalva = useCallback((vagaId: string) => ids.has(vagaId), [ids]);

  const alternar = useCallback(
    async (vagaId: string) => {
      if (!token) return false;
      const salvar = !ids.has(vagaId);

      // Atualiza na hora (sem esperar o servidor) e desfaz se der erro
      setIds((atual) => {
        const novo = new Set(atual);
        if (salvar) novo.add(vagaId);
        else novo.delete(vagaId);
        return novo;
      });

      const pedido = salvarVaga(token, vagaId, salvar);
      pendentes.current.add(pedido);
      try {
        await pedido;
      } catch (erro) {
        setIds((atual) => {
          const novo = new Set(atual);
          if (salvar) novo.delete(vagaId);
          else novo.add(vagaId);
          return novo;
        });
        alert(erro instanceof Error ? erro.message : "Não foi possível salvar a vaga.");
      } finally {
        pendentes.current.delete(pedido);
      }
      return true;
    },
    [token, ids]
  );

  const aguardarPendentes = useCallback(async () => {
    await Promise.allSettled([...pendentes.current]);
  }, []);

  return <VagasSalvasContext.Provider value={{ estaSalva, alternar, aguardarPendentes }}>{children}</VagasSalvasContext.Provider>;
}

export function useVagasSalvas() {
  const contexto = useContext(VagasSalvasContext);
  if (!contexto) throw new Error("useVagasSalvas precisa estar dentro do VagasSalvasProvider");
  return contexto;
}
