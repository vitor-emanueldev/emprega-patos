import { Accessibility } from "lucide-react";
import { rotuloPcd } from "@/lib/opcoesVaga";

// Selo azul "Exclusiva para PcD" / "Também para PcD". Não mostra nada em vaga comum.
export default function SeloPcd({ pcd, pequeno = false }: { pcd?: string | null; pequeno?: boolean }) {
  const rotulo = rotuloPcd(pcd);
  if (!rotulo) return null;
  return (
    <span
      title="Vaga para pessoas com deficiência"
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-[#1D6FA5]/10 text-[#1D6FA5] ${
        pequeno ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1"
      }`}
    >
      <Accessibility className={pequeno ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {rotulo}
    </span>
  );
}
