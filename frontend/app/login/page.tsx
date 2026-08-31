"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { loginComGoogle } from "@/lib/api";

declare global {
  interface Window {
    google: any;
  }
}

const BENEFICIOS = [
  {
    texto: "Publique vagas gratuitamente",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    texto: "Vagas com localização real no mapa",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    texto: "Currículo simples, pronto em minutos",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { salvarLogin } = useAuth();
  const botaoRef = useRef<HTMLDivElement>(null);

  async function handleCredentialResponse(response: any) {
    try {
      const dados = await loginComGoogle(response.credential);
      salvarLogin(dados.token, dados.usuario);
      router.push("/");
    } catch (erro) {
      console.error("Erro ao entrar com Google:", erro);
      alert("Não foi possível entrar. Tenta de novo.");
    }
  }

  function inicializarGoogle() {
    if (window.google && botaoRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(botaoRef.current, {
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        width: 320,
        shape: "pill",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#0F2C4A]">
      <Header />
      <Script
        src="https://accounts.google.com/gsi/client"
        onReady={inicializarGoogle}
      />

      <main className="flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl px-8 pt-10 pb-8 text-center">
            {/* Ícone de perfil (padrão) */}
            <div className="w-16 h-16 mx-auto rounded-full bg-[#1D6FA5] flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-[#0F2C4A] mb-1">Bem-vindo ao MapVagas</h1>
            <p className="text-sm text-slate-500 mb-7">
              Entre com sua conta Google. Se for a primeira vez, sua conta é criada automaticamente.
            </p>

            <div className="flex justify-center mb-1">
              <div ref={botaoRef} />
            </div>

            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              Ao continuar, você concorda com o uso dos seus dados básicos do Google
              (nome, email e foto) apenas para criar sua conta no MapVagas.
            </p>
          </div>

          {/* Benefícios */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BENEFICIOS.map((b) => (
              <div
                key={b.texto}
                className="bg-white/10 rounded-lg px-3 py-4 text-center flex flex-col items-center gap-2"
              >
                {b.icone}
                <p className="text-white/80 text-xs leading-snug">{b.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}