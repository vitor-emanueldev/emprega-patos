import { Car, Footprints, Loader2 } from "lucide-react";
import type { Rota } from "@/lib/api";
import { formatarDistancia } from "@/lib/formatar";

const VELOCIDADE_A_PE_KMH = 4.5;

export function formatarTempo(minutos: number) {
  const m = Math.max(1, Math.round(minutos));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

// Link do Google Maps com a rota (com ou sem ponto de partida)
export function linkGoogleMaps(destino: { latitude: number; longitude: number }, origem?: { latitude: number; longitude: number } | null) {
  const d = `${destino.latitude},${destino.longitude}`;
  return origem
    ? `https://www.google.com/maps/dir/?api=1&origin=${origem.latitude},${origem.longitude}&destination=${d}`
    : `https://www.google.com/maps/dir/?api=1&destination=${d}`;
}

// Tempo e distância de carro + tempo estimado a pé
export default function ResumoRota({ rota, calculando, erro }: { rota: Rota | null; calculando: boolean; erro: string }) {
  if (calculando) {
    return (
      <p className="text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Calculando a rota...
      </p>
    );
  }
  if (erro) return <p className="text-xs text-red-600">{erro}</p>;
  if (!rota) return null;

  const minutosAPe = (rota.distanciaM / 1000 / VELOCIDADE_A_PE_KMH) * 60;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Car className="w-3.5 h-3.5" /> De carro
        </p>
        <p className="text-base font-bold text-[#0F2C4A]">{formatarTempo(rota.duracaoS / 60)}</p>
        <p className="text-xs text-slate-500">{formatarDistancia(rota.distanciaM / 1000)}</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Footprints className="w-3.5 h-3.5" /> A pé
        </p>
        <p className="text-base font-bold text-[#0F2C4A]">~{formatarTempo(minutosAPe)}</p>
        <p className="text-xs text-slate-500">aproximado</p>
      </div>
    </div>
  );
}
