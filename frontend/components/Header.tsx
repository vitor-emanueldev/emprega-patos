"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { usuario, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <header className="bg-white border-b-4 border-[#0F2C4A] px-8 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-[#1D6FA5] flex items-center justify-center text-white text-xs font-bold">
          EP
        </div>
        <span className="font-extrabold text-[#0F2C4A] tracking-wide text-sm">
          EMPREGA PATOS
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-3">
        {!usuario && (
          <Link
            href="/login"
            className="text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-slate-50"
          >
            Entrar
          </Link>
        )}

        <Link
          href="/publicar-vaga"
          className="text-sm font-medium text-white bg-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-[#123a63]"
        >
          Publicar Vaga
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className="flex items-center gap-1 text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-slate-50"
          >
            {usuario ? `Olá, ${usuario.nome}` : "Menu"}
            <span className={`transition-transform ${menuAberto ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>

          {menuAberto && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
              <Link
                href={usuario ? "/perfil" : "/login"}
                onClick={() => setMenuAberto(false)}
                className="block px-4 py-2 text-sm text-[#0F2C4A] hover:bg-slate-50"
              >
                Perfil
              </Link>
              <Link
                href="/empresas"
                onClick={() => setMenuAberto(false)}
                className="block px-4 py-2 text-sm text-[#0F2C4A] hover:bg-slate-50"
              >
                Empresas
              </Link>
              <Link
                href="/cadastrar-empresa"
                onClick={() => setMenuAberto(false)}
                className="block px-4 py-2 text-sm text-[#0F2C4A] hover:bg-slate-50"
              >
                Cadastrar Empresa
              </Link>
              {usuario && (
                <button
                  onClick={() => {
                    setMenuAberto(false);
                    sair();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#0F2C4A] hover:bg-slate-50"
                >
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
