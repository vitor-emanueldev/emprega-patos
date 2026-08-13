"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // quando a página carrega, verifica se já tem token salvo
  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");

    if (tokenSalvo && usuarioSalvo) {
      try {
        setToken(tokenSalvo);
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (erro) {
        console.warn("Dados de sessão corrompidos, limpando localStorage:", erro);
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }
    }
  }, []);

  function salvarLogin(token: string, usuario: Usuario) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    setToken(token);
    setUsuario(usuario);
  }

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
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