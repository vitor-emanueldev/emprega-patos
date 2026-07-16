"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cadastrar } from "@/lib/api";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const { salvarLogin } = useAuth();

  async function handleCadastro() {
    setErro("");

    if (!nome || !email || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const dados = await cadastrar(nome, email, senha);
      salvarLogin(dados.token, dados.usuario);
      router.push("/");
    } catch (erro) {
      setErro("Não foi possível cadastrar. Verifique os dados.");
    } finally {
      setCarregando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCadastro();
  }

  return (
    <div className="min-h-screen bg-[#0F2C4A]">
      <Header />
      <main className="flex flex-col items-center pt-16 pb-24 px-4">
        <h1 className="text-white text-2xl font-bold mb-8">Faça seu Cadastro!</h1>

        <div className="w-20 h-20 rounded-full bg-[#1D6FA5] flex items-center justify-center -mb-10 relative z-10 shadow-lg">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-xl pt-14 pb-8 px-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Nome completo:</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">E-mail:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Senha:</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Confirmar senha:</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {erro}
              </p>
            )}

            <button
              onClick={handleCadastro}
              disabled={carregando}
              className="w-full rounded-md bg-[#F0A93C] text-white font-semibold py-2.5 hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {carregando ? "Cadastrando..." : "Cadastrar"}
            </button>

            <p className="text-center text-sm text-slate-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-[#1D6FA5] hover:underline">Logue!</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}