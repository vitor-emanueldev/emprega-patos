"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { EVENTO_SESSAO_EXPIRADA } from "@/lib/api";

type Usuario = {
  id: string;
  nome: string;
  email: string;
};

type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  salvarLogin: (token: string, usuario: Usuario) => void;
  sair: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Lê a data de expiração de dentro do token (JWT) sem precisar do servidor.
// Não valida a assinatura — isso é papel do backend. Serve só para não
// manter na tela uma sessão que já sabemos que venceu.
function tokenExpirado(token: string): boolean {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true; // token ilegível = trata como inválido
  }
}

function limparSessaoSalva() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // quando a página carrega, verifica se já tem token salvo e se ainda vale
  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (tokenSalvo && usuarioSalvo) {
      if (tokenExpirado(tokenSalvo)) {
        limparSessaoSalva();
        return;
      }
      try {
        setToken(tokenSalvo);
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (erro) {
        console.warn("Dados de sessão corrompidos, limpando localStorage:", erro);
        limparSessaoSalva();
      }
    }
  }, []);

  // Se alguma chamada à API responder 401 (token vencido ou inválido),
  // encerra a sessão e manda para o login com um aviso.
  useEffect(() => {
    function aoExpirar() {
      limparSessaoSalva();
      setToken(null);
      setUsuario(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?sessao=expirada";
      }
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  function salvarLogin(token: string, usuario: Usuario) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    setToken(token);
    setUsuario(usuario);
  }

  function sair() {
    limparSessaoSalva();
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, token, salvarLogin, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider");
  }
  return context;
}
