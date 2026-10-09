"use client";

import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import type { Vaga } from "@/lib/api";
import { getIconePorCargo } from "@/lib/icones";
import { formatarDistancia, formatarSalario, tempoPublicacao } from "@/lib/formatar";
import BotaoSalvarVaga from "@/components/BotaoSalvarVaga";

type Props = {
  vaga: Vaga;
  distanciaKm?: number | null;
  compacto?: boolean;
  selecionado?: boolean;
  aoSelecionar?: () => void; // no mapa: destacar o pino em vez de abrir a vaga
};

export default function VagaCard({ vaga, distanciaKm, compacto = false, selecionado = false, aoSelecionar }: Props) {
  const Icone = getIconePorCargo(vaga.cargo);
  const encerrada = vaga.status && vaga.status !== "aberta";

  const conteudo = (
    <div className="flex items-start gap-3">
      <div
        className={`${compacto ? "w-10 h-10" : "w-12 h-12"} shrink-0 rounded-xl bg-[#F0A93C]/15 text-[#c47f12] flex items-center justify-center`}
      >
        <Icone className={compacto ? "w-5 h-5" : "w-6 h-6"} />
      </div>

      <div className="flex-1 min-w-0">
        {aoSelecionar ? (
          <p className="font-semibold text-[#0F2C4A] leading-tight truncate">{vaga.cargo}</p>
        ) : (
          // "link esticado": o card inteiro abre a vaga, mas o coração continua clicável à parte
          <Link href={`/vagas/${vaga.id}`} className="block font-semibold text-[#0F2C4A] leading-tight truncate after:absolute after:inset-0 after:content-['']">
            {vaga.cargo}
          </Link>
        )}
        <p className="text-sm text-[#1D6FA5] truncate">{vaga.empresa.nomeEmpresa}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {vaga.bairro}
            {distanciaKm != null && <strong className="text-[#0F2C4A] font-semibold">· {formatarDistancia(distanciaKm)}</strong>}
          </span>
          {!compacto && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tempoPublicacao(vaga.createdAt)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-sm font-semibold text-[#0F2C4A] mr-1">{formatarSalario(vaga.salario)}</span>
          <span className="text-[11px] font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{vaga.tipoContrato}</span>
          {encerrada && (
            <span className="text-[11px] font-medium bg-red-50 text-red-600 rounded-full px-2 py-0.5">
              {vaga.status === "pausada" ? "Pausada" : "Encerrada"}
            </span>
          )}
        </div>
      </div>

      <BotaoSalvarVaga vagaId={vaga.id} className="relative z-10" />
    </div>
  );

  const classe = `relative block w-full text-left bg-white rounded-xl border transition-all ${compacto ? "p-3" : "p-4"} ${
    selecionado ? "border-[#F0A93C] ring-2 ring-[#F0A93C]/30" : "border-slate-200 hover:border-[#1D6FA5]/40 hover:shadow-md"
  }`;

  if (aoSelecionar) {
    return (
      <div role="button" tabIndex={0} onClick={aoSelecionar} onKeyDown={(e) => e.key === "Enter" && aoSelecionar()} className={`${classe} cursor-pointer`}>
        {conteudo}
        {selecionado && (
          <Link
            href={`/vagas/${vaga.id}`}
            className="mt-3 block text-center text-sm font-semibold text-white bg-[#0F2C4A] rounded-md py-2 hover:bg-[#17436f]"
          >
            Ver vaga completa
          </Link>
        )}
      </div>
    );
  }

  return <div className={classe}>{conteudo}</div>;
}
