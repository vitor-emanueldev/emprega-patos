"use client";

import { limparInstagram } from "@/lib/instagram";

// Campo opcional do Instagram da empresa, com o "@" fixo na frente
export default function CampoInstagram({
  valor,
  aoMudar,
  className = "py-2",
}: {
  valor: string;
  aoMudar: (v: string) => void;
  className?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
        Instagram da empresa <span className="font-normal text-slate-400">(opcional)</span>
      </label>
      <div className="flex rounded-md bg-slate-100 border border-slate-200 focus-within:ring-2 focus-within:ring-[#1D6FA5]">
        <span className="pl-3 pr-1 flex items-center text-sm text-slate-400 select-none">@</span>
        <input
          value={valor}
          onChange={(e) => aoMudar(limparInstagram(e.target.value))}
          placeholder="nomedaempresa"
          maxLength={60}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`flex-1 min-w-0 bg-transparent pr-3 ${className} text-sm text-gray-900 focus:outline-none`}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">Aparece na vaga para o candidato conhecer a empresa.</p>
    </div>
  );
}
