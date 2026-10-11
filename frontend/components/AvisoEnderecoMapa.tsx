import { Loader2, MapPin } from "lucide-react";
import type { EstadoEndereco } from "@/lib/useEnderecoAutomatico";

// Mensagem que aparece embaixo do mapa depois de clicar num ponto
export default function AvisoEnderecoMapa({ estado, usarSugestao }: { estado: EstadoEndereco | null; usarSugestao: () => void }) {
  if (!estado) return null;

  if (estado.tipo === "buscando") {
    return (
      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Buscando o endereço desse ponto...
      </p>
    );
  }

  if (estado.tipo === "nada") {
    return <p className="text-xs text-slate-500 mt-2">Não achamos o nome da rua desse ponto. Preencha o endereço à mão.</p>;
  }

  if (estado.tipo === "erro") {
    return <p className="text-xs text-slate-500 mt-2">Não foi possível buscar o endereço agora. Preencha à mão.</p>;
  }

  const e = estado.endereco;
  const texto = [e.endereco, e.bairro].filter(Boolean).join(" – ");

  if (estado.tipo === "sugestao") {
    return (
      <div className="mt-2 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-3 flex-wrap">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#F0A93C] shrink-0" />
          Endereço desse ponto: <b className="text-[#0F2C4A]">{texto}</b>
        </span>
        <button type="button" onClick={usarSugestao} className="font-semibold text-[#1D6FA5] hover:underline">
          Usar este endereço
        </button>
      </div>
    );
  }

  return (
    <p className="mt-2 text-xs text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">
      ✓ Preenchemos pelo mapa: <b>{texto}</b>.{" "}
      {e.numero ? "Confira se está certo." : "Confira e coloque o número, se tiver."}
    </p>
  );
}
