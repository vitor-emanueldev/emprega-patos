"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, UserRound } from "lucide-react";
import { enviarFotoCandidato } from "@/lib/api";

type Props = {
  token: string | null;
  fotoUrl: string;
  aoMudar: (url: string) => void;
};

const TAMANHO_MAXIMO_ARQUIVO = 15 * 1024 * 1024; // 15 MB (antes de reduzir)
const LADO = 800; // px — o servidor reduz de novo para 512

// Recorta a imagem no centro (quadrado) e reduz, para enviar rápido mesmo com internet ruim
async function prepararFoto(arquivo: File): Promise<Blob> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () => reject(new Error("Não foi possível abrir essa imagem. Tente outra foto (JPG ou PNG)."));
      elemento.src = url;
    });

    const lado = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - lado) / 2;
    const sy = (img.naturalHeight - lado) / 2;
    const destino = Math.min(LADO, lado);

    const canvas = document.createElement("canvas");
    canvas.width = destino;
    canvas.height = destino;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu processar a foto.");
    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, destino, destino);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível processar a foto."))),
        "image/jpeg",
        0.9
      )
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function FotoUpload({ token, fotoUrl, aoMudar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setErro("");

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem (foto).");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      setErro("Essa foto é muito grande. Escolha uma de até 15 MB.");
      return;
    }
    if (!token) {
      setErro("Sua sessão expirou. Entre novamente para enviar a foto.");
      return;
    }

    setEnviando(true);
    try {
      const foto = await prepararFoto(arquivo);
      const url = await enviarFotoCandidato(token, foto);
      aoMudar(url);
    } catch (e: any) {
      setErro(e.message || "Não foi possível enviar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center group disabled:opacity-70"
        aria-label={fotoUrl ? "Trocar foto" : "Adicionar foto"}
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="Sua foto" className="w-full h-full object-cover" />
        ) : (
          <UserRound className="w-10 h-10 text-slate-400" />
        )}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </span>
        {enviando && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-medium text-[#0F2C4A]">
            Enviando...
          </span>
        )}
      </button>

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F2C4A] text-white text-sm font-medium px-3 py-2 hover:bg-[#17436f] disabled:opacity-60"
          >
            <Camera className="w-4 h-4" />
            {fotoUrl ? "Trocar foto" : "Adicionar foto"}
          </button>
          {fotoUrl && !enviando && (
            <button
              type="button"
              onClick={() => aoMudar("")}
              className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-red-600 px-3 py-2 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Uma foto do rosto, com boa luz e fundo simples, passa mais confiança para a empresa.
        </p>
        {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={aoEscolher}
        className="hidden"
      />
    </div>
  );
}
