"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { usuario, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <header className="bg-white border-b-4 border-[#0F2C4A] px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-[#1D6FA5] flex items-center justify-center text-white text-xs font-bold">
          EP
        </div>
        <span className="font-extrabold text-[#0F2C4A] tracking-wide text-sm">
          EMPREGA PATOS
        </span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6 text-sm text-[#0F2C4A] font-medium">
          <Link href="/" className="hover:text-[#1D6FA5]">Início</Link>
          <Link href="/vagas" className="hover:text-[#1D6FA5]">Vagas</Link>
          <Link href="/mapa" className="hover:text-[#1D6FA5]">Mapa</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/publicar-vaga"
            className="text-sm font-medium text-white bg-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-[#123a63]"
          >
            Publicar Vaga
          </Link>

          {usuario ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuAberto((prev) => !prev)}
                className="flex items-center gap-2 text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-slate-50"
              >
                <span className="w-5 h-5 rounded-full bg-[#F0A93C] text-white text-[10px] font-bold flex items-center justify-center">
                  {usuario.nome.charAt(0).toUpperCase()}
                </span>
                {usuario.nome}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${menuAberto ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {menuAberto && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-slate-100 overflow-hidden z-50">
                  <Link
                    href="/perfil"
                    onClick={() => setMenuAberto(false)}
                    className="block px-4 py-2.5 text-sm text-[#0F2C4A] hover:bg-slate-50"
                  >
                    Ver perfil
                  </Link>
                  <button
                    onClick={() => {
                      setMenuAberto(false);
                      sair();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-slate-50"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}