"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { usuario } = useAuth();

  return (
    <header className="bg-white border-b-4 border-[#0F2C4A] px-8 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-9 h-9 rounded-full bg-[#1D6FA5] flex items-center justify-center text-white text-xs font-bold">
          EP
        </div>
        <span className="font-extrabold text-[#0F2C4A] tracking-wide text-sm transition-colors group-hover:text-[#1D6FA5]">
          EMPREGA PATOS
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-5">
        {!usuario && (
          <Link
            href="/login"
            className="text-sm font-medium text-[#0F2C4A] hover:text-[#1D6FA5]"
          >
            Entrar
          </Link>
        )}

        <Link
          href="/vagas"
          className="text-sm font-medium text-[#0F2C4A] hover:text-[#1D6FA5]"
        >
          Vagas
        </Link>

        <Link
          href="/cadastrar-empresa"
          className="text-sm font-medium text-[#0F2C4A] hover:text-[#1D6FA5]"
        >
          Cadastrar Empresa
        </Link>

        <Link
          href="/publicar-vaga"
          className="text-sm font-medium text-white bg-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-[#123a63]"
        >
          Publicar Vaga
        </Link>

        <Link
          href={usuario ? "/perfil" : "/login"}
          className="text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-slate-50"
        >
          {usuario ? `Olá, ${usuario.nome}` : "Perfil"}
        </Link>
      </div>
    </header>
  );
}