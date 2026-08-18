"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

export default function EsqueciSenhaPage() {
  const [valor, setValor] = useState("");
  const [naoSouRobo, setNaoSouRobo] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  function handleEnviar() {
    setErro("");

    if (!valor.trim()) {
      setErro("Informe seu e-mail ou nome completo.");
      return;
    }

    if (!naoSouRobo) {
      setErro("Confirme que você não é um robô.");
      return;
    }

    // TODO: ainda não existe rota no backend para recuperação de senha.
    // Por enquanto, só simulamos o envio no front.
    setEnviado(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleEnviar();
  }

  return (
    <div className="min-h-screen bg-[#0F2C4A]">
      <Header />
      <main className="flex flex-col items-center pt-16 pb-24 px-4">
        <h1 className="text-white text-2xl font-bold mb-8">Esqueceu a Senha?</h1>

        <div className="w-20 h-20 rounded-full bg-[#1D6FA5] flex items-center justify-center -mb-10 relative z-10 shadow-lg">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-xl pt-14 pb-8 px-8">
          {enviado ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-3">
                Se o e-mail informado estiver cadastrado, você receberá um
                link para redefinir sua senha em instantes.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-[#1D6FA5] hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Insira o seu nome ou seu e-mail para que nós lhe enviemos um
                link para alterar sua senha:
              </p>

              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                  E-mail ou Nome completo:
                </label>
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                />
              </div>

              <label className="flex items-center gap-3 border border-slate-200 rounded-md px-3 py-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={naoSouRobo}
                  onChange={(e) => setNaoSouRobo(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 flex-1">Não sou um robô</span>
                <span className="text-[9px] text-slate-400 leading-tight text-right">
                  reCAPTCHA
                </span>
              </label>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {erro}
                </p>
              )}

              <button
                onClick={handleEnviar}
                className="w-full rounded-md bg-[#F0A93C] text-white font-semibold py-2.5 hover:bg-[#dd9a30] transition-colors"
              >
                Enviar e-mail
              </button>

              <p className="text-center text-sm text-slate-600">
                Lembrou a senha?{" "}
                <Link href="/login" className="text-[#1D6FA5] hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}