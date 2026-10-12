"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  BellRing,
  Briefcase,
  Building2,
  CircleCheck,
  FileText,
  Handshake,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Search,
  Send,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import BotaoSalvarVaga from "@/components/BotaoSalvarVaga";
import LogoEmpresa from "@/components/LogoEmpresa";
import SeloPcd from "@/components/SeloPcd";
import { listarVagas, buscarEstatisticas, type Vaga, type Estatisticas } from "@/lib/api";
import { getIconePorCargo } from "@/lib/icones";
import { ehVagaPcd } from "@/lib/opcoesVaga";

// Mesmo mapa da aba Mapa (Leaflet só carrega no navegador)
const MapaInterativo = dynamic(() => import("@/components/MapaInterativo"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400">
      Carregando mapa...
    </div>
  ),
});

function tempoPublicacao(createdAt: string) {
  const horas = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;
  const dias = Math.floor(horas / 24);
  return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
}

const PASSOS = {
  candidato: {
    titulo: "Sou candidato",
    passos: [
      { icone: FileText, titulo: "Monte seu currículo", texto: "Grátis e em poucos minutos, com foto e experiências. Serve para todas as vagas." },
      { icone: MapIcon, titulo: "Encontre no mapa", texto: "Veja as vagas perto de casa, filtre por área, salário ou vagas PcD." },
      { icone: BellRing, titulo: "Candidate-se e acompanhe", texto: "Você recebe um e-mail quando a empresa responder ou marcar entrevista." },
    ],
    botao: { texto: "Criar meu currículo", href: "/perfil/completar" },
  },
  empresa: {
    titulo: "Sou empresa",
    passos: [
      { icone: Building2, titulo: "Cadastre a empresa", texto: "Digite o CNPJ e preenchemos o resto. Pequeno negócio sem CNPJ também pode." },
      { icone: MapPin, titulo: "Publique a vaga no mapa", texto: "Sua vaga aparece no ponto exato da cidade, com sua logo." },
      { icone: Send, titulo: "Receba candidatos", texto: "Currículo completo por e-mail. Marque entrevista e contrate pelo site." },
    ],
    botao: { texto: "Publicar vaga grátis", href: "/publicar-vaga" },
  },
};

const VANTAGENS_EMPRESA = ["100% grátis", "Sua vaga no mapa da cidade", "Currículos completos", "Aviso por e-mail a cada candidato"];

export default function HomePage() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [vagaSelecionada, setVagaSelecionada] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<"candidato" | "empresa">("candidato");

  useEffect(() => {
    async function carregar() {
      try {
        const [todasVagas, stats] = await Promise.all([listarVagas(), buscarEstatisticas()]);
        setVagas(todasVagas);
        setEstatisticas(stats);
      } catch (erro) {
        console.error("Erro ao carregar dados da home:", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  function handleBuscar() {
    const params = new URLSearchParams();
    if (busca.trim()) params.set("busca", busca.trim());
    router.push(`/vagas?${params.toString()}`);
  }

  const vagasRecentes = vagas.slice(0, 6);
  const vagasPcd = useMemo(() => vagas.filter((v) => ehVagaPcd(v.pcd)), [vagas]);

  // Atalhos: as áreas que mais têm vagas agora
  const areas = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const v of vagas) if (v.area) contagem.set(v.area, (contagem.get(v.area) || 0) + 1);
    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
      .slice(0, 8);
  }, [vagas]);

  const numeros = [
    { icone: Briefcase, valor: estatisticas?.vagasAtivas, rotulo: "Vagas abertas" },
    { icone: Building2, valor: estatisticas?.empresas, rotulo: "Empresas" },
    { icone: Users, valor: estatisticas?.candidatos, rotulo: "Candidatos" },
  ];

  const passos = PASSOS[perfil];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* HERO: texto e busca à esquerda, mapa ao vivo à direita */}
      <section className="bg-[#0F2C4A] px-4 pt-12 pb-14 lg:pt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-block bg-white/10 text-white text-xs font-medium rounded-full px-4 py-1 mb-4">
              📍 Patos - Paraíba
            </span>
            <h1 className="text-white text-3xl md:text-[2.6rem] font-bold leading-tight mb-4">
              Seu próximo emprego <br className="hidden sm:block" />
              está <span className="text-[#F0A93C]">aqui em Patos</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-md mx-auto lg:mx-0 mb-7">
              Encontre vagas perto de você no mapa da cidade. Para empregadores: publique em minutos, de graça.
            </p>

            <div className="flex items-center bg-white rounded-full shadow-md w-full max-w-md mx-auto lg:mx-0 overflow-hidden pl-4">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                placeholder="Cargo, área ou empresa..."
                className="flex-1 min-w-0 py-2.5 text-sm focus:outline-none text-[#0F2C4A]"
              />
              <button
                onClick={handleBuscar}
                className="bg-[#F0A93C] text-white text-sm font-semibold px-5 sm:px-6 py-2.5 hover:bg-[#dd9a30] rounded-full m-1 shrink-0"
              >
                Buscar
              </button>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
              <Link
                href="/mapa?perto=1"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white text-xs font-semibold px-4 py-2 hover:bg-white/20 transition-colors"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                Vagas perto de mim
              </Link>
              {vagasPcd.length > 0 && (
                <Link
                  href="/mapa?pcd=1"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white text-xs font-semibold px-4 py-2 hover:bg-white/20 transition-colors"
                >
                  <Accessibility className="w-3.5 h-3.5" />
                  Vagas PcD ({vagasPcd.length})
                </Link>
              )}
            </div>

            {/* Números */}
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-md mx-auto lg:mx-0">
              {numeros.map((n) => (
                <div key={n.rotulo} className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-left">
                  <n.icone className="w-4 h-4 text-[#F0A93C] mb-1.5" />
                  <p className="text-2xl font-bold text-white leading-none">{carregando ? "…" : n.valor ?? 0}</p>
                  <p className="text-[11px] text-slate-300 mt-1">{n.rotulo}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[340px] lg:h-[460px] rounded-xl border-4 border-[#F0A93C] shadow-xl bg-slate-100">
            <MapaInterativo
              vagas={vagas}
              vagaSelecionada={vagaSelecionada}
              onSelecionarVaga={setVagaSelecionada}
              mostrarLegenda={false}
            />
            <Link
              href="/mapa"
              className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-md bg-white/95 text-[#0F2C4A] text-xs font-semibold px-3 py-2 shadow-md hover:bg-white"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Abrir mapa completo
            </Link>
          </div>
        </div>
      </section>

      {/* ATALHOS POR ÁREA */}
      {areas.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-12">
          <h2 className="text-xl font-bold text-[#0F2C4A]">Explore por área</h2>
          <p className="text-sm text-slate-500 mb-5">As funções com mais vagas abertas agora</p>
          <div className="flex flex-wrap gap-2.5">
            {areas.map(([area, total]) => {
              const Icone = getIconePorCargo(area);
              return (
                <Link
                  key={area}
                  href={`/mapa?categoria=${encodeURIComponent(area)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-2 pr-4 py-1.5 text-sm text-[#0F2C4A] font-medium shadow-sm hover:border-[#F0A93C] hover:shadow-md transition-all"
                >
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icone className="w-4 h-4" />
                  </span>
                  {area}
                  <span className="text-xs font-semibold text-[#F0A93C]">{total}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* VAGAS RECENTES */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F2C4A]">Vagas recentes</h2>
            <p className="text-sm text-slate-500">As últimas oportunidades publicadas</p>
          </div>
          <Link href="/vagas" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#1D6FA5] hover:underline">
            Ver todas as vagas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {carregando && <p className="text-sm text-slate-400">Carregando vagas...</p>}
        {!carregando && vagasRecentes.length === 0 && <p className="text-sm text-slate-400">Nenhuma vaga publicada ainda.</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vagasRecentes.map((vaga) => {
            const Icone = getIconePorCargo(vaga.cargo);
            return (
              <div key={vaga.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col border border-slate-100">
                <div className="flex items-start gap-3">
                  <LogoEmpresa
                    logoUrl={vaga.empresa.logoUrl}
                    nome={vaga.empresa.nomeEmpresa}
                    className="w-11 h-11 rounded-lg"
                    semLogo={
                      <div className="w-11 h-11 shrink-0 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Icone className="w-5 h-5 text-[#0F2C4A]" />
                      </div>
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0F2C4A] text-sm leading-snug">{vaga.cargo}</p>
                    <p className="text-xs text-slate-500 truncate">{vaga.empresa.nomeEmpresa}</p>
                  </div>
                  <BotaoSalvarVaga vagaId={vaga.id} className="-mr-1 -mt-1" />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-2 py-0.5">{vaga.tipoContrato}</span>
                  <SeloPcd pcd={vaga.pcd} pequeno />
                </div>

                <p className="text-xs text-slate-500 flex items-center gap-1 mt-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                  {vaga.bairro}
                  <span className="mx-1">·</span>
                  <span className="font-semibold text-[#1D6FA5]">
                    {vaga.salario != null ? `R$ ${vaga.salario.toLocaleString("pt-BR")}` : "A combinar"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{tempoPublicacao(vaga.createdAt)}</p>

                <Link
                  href={`/vagas/${vaga.id}`}
                  className="mt-4 bg-[#F0A93C] text-white text-xs font-semibold rounded-md py-2 text-center hover:bg-[#dd9a30]"
                >
                  Ver vaga
                </Link>
              </div>
            );
          })}
        </div>

        <Link href="/vagas" className="sm:hidden mt-5 flex items-center justify-center gap-1 text-sm font-semibold text-[#1D6FA5]">
          Ver todas as vagas <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* DESTAQUE PcD (só aparece se existir vaga PcD) */}
      {vagasPcd.length > 0 && (
        <section className="px-4 pb-12">
          <div className="max-w-6xl mx-auto rounded-2xl bg-[#1D6FA5]/[0.07] border border-[#1D6FA5]/20 p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-[#1D6FA5] text-white flex items-center justify-center shrink-0">
                <Accessibility className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A]">Vagas para pessoas com deficiência</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {vagasPcd.length} {vagasPcd.length === 1 ? "vaga aberta" : "vagas abertas"} para PcD em Patos, exclusivas ou
                  abertas também a pessoas com deficiência.
                </p>
              </div>
            </div>
            <Link
              href="/mapa?pcd=1"
              className="self-start md:self-auto inline-flex items-center gap-1.5 rounded-md bg-[#1D6FA5] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#185f8e]"
            >
              Ver vagas PcD <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* COMO FUNCIONA */}
      <section className="bg-slate-50 py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-[#0F2C4A]">Como funciona</h2>
            <p className="text-sm text-slate-500 mt-2">
              O MapVagas conecta comércios, empresas e candidatos de Patos de forma simples e gratuita.
            </p>
            <div className="inline-grid grid-cols-2 bg-white border border-slate-200 rounded-full p-1 mt-6 text-sm font-semibold">
              {(Object.keys(PASSOS) as ("candidato" | "empresa")[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPerfil(p)}
                  className={`rounded-full px-5 py-2 transition-colors ${
                    perfil === p ? "bg-[#0F2C4A] text-white" : "text-slate-500 hover:text-[#0F2C4A]"
                  }`}
                >
                  {PASSOS[p].titulo}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {passos.passos.map((passo, i) => (
              <div key={passo.titulo} className="bg-white rounded-xl shadow-md p-6 relative">
                <span className="absolute top-5 right-5 text-3xl font-bold text-slate-100">{i + 1}</span>
                <div className="w-11 h-11 rounded-lg bg-[#F0A93C]/15 text-[#F0A93C] flex items-center justify-center">
                  <passo.icone className="w-5 h-5" />
                </div>
                <p className="font-semibold text-[#0F2C4A] mt-4">{passo.titulo}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{passo.texto}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href={passos.botao.href}
              className="inline-flex items-center gap-1.5 bg-[#0F2C4A] text-white text-sm font-semibold rounded-md px-6 py-3 hover:bg-[#123a63]"
            >
              {passos.botao.texto} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PARCEIROS */}
      <section className="border-y border-slate-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Handshake className="w-4 h-4" />
            Em parceria com
          </span>
          <span className="text-sm font-bold text-[#0F2C4A]">Prefeitura Municipal de Patos</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-sm font-bold text-[#0F2C4A]">CiTI-DE</span>
        </div>
      </section>

      {/* CHAMADA PARA EMPRESAS */}
      <section className="bg-[#F0A93C] py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h2 className="text-white text-2xl font-bold">Tem vagas para preencher?</h2>
            <p className="text-white/90 text-sm mt-1">Publique gratuitamente e alcance candidatos da cidade toda.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-5">
              {VANTAGENS_EMPRESA.map((v) => (
                <li key={v} className="flex items-center gap-2 text-sm font-medium text-white">
                  <CircleCheck className="w-4 h-4 text-[#0F2C4A]" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cadastrar-empresa"
              className="bg-white text-[#0F2C4A] text-sm font-semibold rounded-md px-5 py-3 hover:bg-slate-50"
            >
              Cadastrar empresa
            </Link>
            <Link
              href="/publicar-vaga"
              className="bg-[#0F2C4A] text-white text-sm font-semibold rounded-md px-5 py-3 hover:bg-[#123a63]"
            >
              Publicar vaga grátis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
