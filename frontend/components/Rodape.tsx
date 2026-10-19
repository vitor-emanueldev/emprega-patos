"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShieldCheck, Mail, MessageSquareWarning } from "lucide-react";
import { abrirReportarProblema } from "@/components/ReportarProblema";

const EMAIL_CONTATO = "mapvagas.avisos@gmail.com";

const LINKS_SITE = [
  { href: "/", rotulo: "Início" },
  { href: "/vagas", rotulo: "Vagas" },
  { href: "/mapa", rotulo: "Mapa de vagas" },
  { href: "/perfil/vagas-salvas", rotulo: "Vagas salvas" },
];

const LINKS_EMPRESAS = [
  { href: "/publicar-vaga", rotulo: "Publicar vaga" },
  { href: "/cadastrar-empresa", rotulo: "Cadastrar empresa" },
  { href: "/perfil/empregador", rotulo: "Painel da empresa" },
];

// A aba Mapa ocupa a tela inteira (estilo aplicativo), então lá o rodapé não aparece
const SEM_RODAPE = ["/mapa"];

function Coluna({ titulo, links }: { titulo: string; links: { href: string; rotulo: string }[] }) {
  return (
    <div>
      <p className="text-sm font-bold text-white mb-3">{titulo}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-slate-300 hover:text-[#F0A93C] transition-colors">
              {l.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Rodape() {
  const pathname = usePathname();
  if (SEM_RODAPE.includes(pathname)) return null;

  return (
    <footer className="mt-auto bg-[#0F2C4A] border-t-4 border-[#F0A93C]">
      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <p className="text-lg font-extrabold text-white tracking-wide">
            MAP<span className="text-[#F0A93C]">VAGAS</span>
          </p>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Vagas de emprego no mapa de Patos-PB. Encontre oportunidades perto de você e candidate-se com um
            currículo simples.
          </p>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#F0A93C]" />
            Patos · Paraíba
          </p>
          <p className="text-xs text-slate-300 mt-4 leading-relaxed">
            <span className="text-slate-400">Parceria:</span> Prefeitura Municipal de Patos · CiTI-DE
            <br />
            <span className="text-slate-400">Desenvolvido por</span> <b className="text-white">DevGum</b>
          </p>
        </div>

        <Coluna titulo="Navegue" links={LINKS_SITE} />
        <Coluna titulo="Para empresas" links={LINKS_EMPRESAS} />

        <div>
          <p className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#F0A93C]" />
            Privacidade (LGPD)
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Usamos só os dados necessários para ligar candidatos e empresas. Não vendemos seus dados.
          </p>
          <ul className="space-y-2 mt-3">
            <li>
              <Link href="/privacidade" className="text-sm text-slate-300 underline underline-offset-2 hover:text-[#F0A93C]">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL_CONTATO}`}
                className="text-sm text-slate-300 hover:text-[#F0A93C] inline-flex items-center gap-1.5 break-all"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {EMAIL_CONTATO}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} MapVagas · Patos-PB</p>
          <button
            type="button"
            onClick={abrirReportarProblema}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-[#F0A93C]"
          >
            <MessageSquareWarning className="w-3.5 h-3.5 text-[#F0A93C]" />
            Encontrou um problema? Reportar
          </button>
        </div>
      </div>
    </footer>
  );
}
