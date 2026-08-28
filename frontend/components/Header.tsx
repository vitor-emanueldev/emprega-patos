"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function Header() {
  const { usuario, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
      if (
        menuMobileRef.current &&
        !menuMobileRef.current.contains(event.target as Node)
      ) {
        setMenuMobileAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <header className="relative bg-white border-b-4 border-[#0F2C4A] px-4 sm:px-8 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-[#1D6FA5] flex items-center justify-center text-white text-xs font-bold">
          MV
        </div>

        <span className="font-extrabold text-[#0F2C4A] tracking-wide text-sm flex items-center">
          MAP

          <span className="relative inline-block w-3.5 h-3.5 -mx-0.2">
            <Image
              src="/Logo sem fundo.png"
              alt="V"
              fill
              className="object-contain"
            />
          </span>

          AGAS
        </span>
      </Link>

      {/* Botão hambúrguer - visível apenas no mobile */}
      <button
        onClick={() => setMenuMobileAberto((prev) => !prev)}
        aria-label="Abrir menu"
        aria-expanded={menuMobileAberto}
        className="md:hidden flex items-center justify-center w-10 h-10 text-[#0F2C4A]"
      >
        {menuMobileAberto ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {/* Menu mobile - dropdown abaixo do header */}
      {menuMobileAberto && (
        <div
          ref={menuMobileRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b-4 border-[#0F2C4A] shadow-lg z-50 flex flex-col p-4 gap-1"
        >
          <Link
            href="/"
            onClick={() => setMenuMobileAberto(false)}
            className="px-3 py-2.5 rounded-md text-sm font-medium text-[#0F2C4A] hover:bg-slate-50"
          >
            Início
          </Link>
          <Link
            href="/vagas"
            onClick={() => setMenuMobileAberto(false)}
            className="px-3 py-2.5 rounded-md text-sm font-medium text-[#0F2C4A] hover:bg-slate-50"
          >
            Vagas
          </Link>
          <Link
            href="/mapa"
            onClick={() => setMenuMobileAberto(false)}
            className="px-3 py-2.5 rounded-md text-sm font-medium text-[#0F2C4A] hover:bg-slate-50"
          >
            Mapa
          </Link>
          <Link
            href="/publicar-vaga"
            onClick={() => setMenuMobileAberto(false)}
            className="px-3 py-2.5 rounded-md text-sm font-medium text-white bg-[#0F2C4A] text-center mt-1 hover:bg-[#123a63]"
          >
            Publicar Vaga
          </Link>

          <div className="border-t border-slate-100 mt-1 pt-1">
            {usuario ? (
              <>
                <Link
                  href="/perfil"
                  onClick={() => setMenuMobileAberto(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-[#0F2C4A] hover:bg-slate-50"
                >
                  <span className="w-5 h-5 rounded-full bg-[#F0A93C] text-white text-[10px] font-bold flex items-center justify-center">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </span>
                  Ver perfil ({usuario.nome})
                </Link>
                <button
                  onClick={() => {
                    setMenuMobileAberto(false);
                    sair();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuMobileAberto(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] text-center hover:bg-slate-50"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}

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