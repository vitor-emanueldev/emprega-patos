"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { Building2, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { enviarLogoEmpresa } from "@/lib/api";

type Props = {
  token: string | null;
  logoUrl: string;
  aoMudar: (url: string) => void;
};

const TAMANHO_MAXIMO_ARQUIVO = 15 * 1024 * 1024; // 15 MB (antes de reduzir)
const LADO_MAXIMO = 800; // px — o servidor reduz de novo para 400

// Reduz a imagem SEM cortar (logo costuma ser retangular) e mantém a transparência
async function prepararLogo(arquivo: File): Promise<Blob> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () => reject(new Error("Não foi possível abrir essa imagem. Tente outra (JPG ou PNG)."));
      elemento.src = url;
    });

    const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
    const largura = Math.max(1, Math.round(img.naturalWidth * escala));
    const altura = Math.max(1, Math.round(img.naturalHeight * escala));

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
    ctx.drawImage(img, 0, 0, largura, altura);

    // WebP guarda transparência; navegadores sem WebP devolvem PNG (também serve)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível processar a imagem."))),
        "image/webp",
        0.92
      )
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function LogoUpload({ token, logoUrl, aoMudar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setErro("");

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErro("Imagem grande demais. Escolha uma de até 15 MB.");
      return;
    }
    if (!token) {
      setErro("Entre na sua conta para enviar a logo.");
      return;
    }

    setEnviando(true);
    try {
      const imagem = await prepararLogo(arquivo);
      const url = await enviarLogoEmpresa(token, imagem);
      aoMudar(url);
    } catch (e: any) {
      setErro(e.message || "Não foi possível enviar a logo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
        {enviando ? (
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        ) : logoUrl ? (
          <img src={logoUrl} alt="Logo da empresa" className="w-full h-full object-contain p-1" />
        ) : (
          <Building2 className="w-8 h-8 text-slate-300" />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D6FA5] border border-[#1D6FA5] rounded-md px-3 py-1.5 hover:bg-[#1D6FA5]/5 disabled:opacity-60"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            {logoUrl ? "Trocar logo" : "Enviar logo"}
          </button>
          {logoUrl && !enviando && (
            <button
              type="button"
              onClick={() => aoMudar("")}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">JPG, PNG ou WebP. A logo aparece nas suas vagas e no mapa.</p>
        {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={aoEscolher} className="hidden" />
    </div>
  );
}
