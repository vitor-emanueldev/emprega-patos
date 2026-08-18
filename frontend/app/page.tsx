"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "@/components/Header";
import { listarVagas, buscarEstatisticas, type Vaga, type Estatisticas } from "@/lib/api";

const MapaVagas = dynamic(() => import("@/components/MapaVagas"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400" style={{ height: 400 }}>
      Carregando mapa...
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarSobre, setMostrarSobre] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const [todasVagas, stats] = await Promise.all([
          listarVagas(),
          buscarEstatisticas(),
        ]);
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

  const vagasRecentes = vagas.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* HERO */}
      <section className="bg-[#0F2C4A] text-center py-16 px-4">
        <span className="inline-block bg-white/10 text-white text-xs font-medium rounded-full px-4 py-1 mb-4">
          📍 Patos - Paraíba
        </span>
        <h1 className="text-white text-3xl md:text-4xl font-bold mb-3">
          Seu próximo emprego está <br />
          <span className="text-[#F0A93C]">aqui em Patos</span>
        </h1>
        <p className="text-slate-300 text-sm max-w-md mx-auto mb-8">
          Encontre vagas próximas de você no mapa ou filtre por área. Para
          empregadores: publique em segundos.
        </p>

        <div className="flex justify-center mb-10">
          <div className="flex items-center bg-white rounded-full shadow-md w-full max-w-md overflow-hidden pl-4">
            <span className="text-slate-400 text-sm mr-2">🔍</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              placeholder="Cargo, área ou empresa..."
              className="flex-1 py-2.5 text-sm focus:outline-none text-[#0F2C4A]"
            />
            <button
              onClick={handleBuscar}
              className="bg-[#F0A93C] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#dd9a30] rounded-full m-1"
            >
              Buscar Vagas
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-12 text-white">
          <div>
            <p className="text-2xl font-bold">
              {carregando ? "..." : estatisticas?.vagasAtivas ?? 0}
            </p>
            <p className="text-xs text-slate-300">Vagas Ativas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {carregando ? "..." : estatisticas?.empresas ?? 0}
            </p>
            <p className="text-xs text-slate-300">Empresas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {carregando ? "..." : estatisticas?.candidatos ?? 0}
            </p>
            <p className="text-xs text-slate-300">Candidatos</p>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section className="max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-xl font-bold text-[#0F2C4A]">Vagas no mapa</h2>
        <p className="text-sm text-slate-500 mb-6">
          Veja onde estão as oportunidades na cidade de Patos
        </p>

        <div className="rounded-xl overflow-hidden border-4 border-[#F0A93C]" style={{ height: 400 }}>
          <MapaVagas
            vagas={vagas}
            vagaSelecionada={null}
            onSelecionarVaga={() => {}}
          />
        </div>
      </section>

      {/* VAGAS RECENTES */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#0F2C4A]">Vagas Recentes</h2>
          <p className="text-sm text-slate-500 mb-6">
            As últimas oportunidades publicadas
          </p>

          {carregando && (
            <p className="text-sm text-slate-400">Carregando vagas...</p>
          )}

          {!carregando && vagasRecentes.length === 0 && (
            <p className="text-sm text-slate-400">Nenhuma vaga publicada ainda.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vagasRecentes.map((vaga) => (
              <div
                key={vaga.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-lg mb-1">
                  💼
                </div>
                <p className="font-semibold text-[#0F2C4A] text-sm">{vaga.cargo}</p>
                <p className="text-xs text-slate-500 -mt-1">{vaga.empresa.nomeEmpresa}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  📍 {vaga.bairro}
                  {vaga.salario && (
                    <>
                      <span className="mx-1">·</span>
                      R$ {vaga.salario.toLocaleString("pt-BR")}
                    </>
                  )}
                </p>
                <Link
                  href={`/vagas/${vaga.id}`}
                  className="mt-2 bg-[#F0A93C] text-white text-xs font-semibold rounded-md py-2 text-center hover:bg-[#dd9a30]"
                >
                  Ver vaga
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + SOBRE (expansível) */}
      <section className="bg-[#F0A93C] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-white text-xl font-bold">Tem vagas para preencher?</h2>
              <p className="text-white/90 text-sm">
                Publique gratuitamente e alcance candidatos da cidade toda.
              </p>
            </div>
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => setMostrarSobre((prev) => !prev)}
                className="bg-white text-[#0F2C4A] text-sm font-semibold rounded-md px-5 py-2"
              >
                {mostrarSobre ? "Fechar" : "Saiba mais"}
              </button>
              <Link
                href="/publicar-vaga"
                className="bg-[#0F2C4A] text-white text-sm font-semibold rounded-md px-5 py-2"
              >
                Publicar vaga grátis
              </Link>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              mostrarSobre ? "max-h-60 mt-6" : "max-h-0"
            }`}
          >
            <div className="bg-white/95 rounded-lg p-5">
              <h3 className="text-[#0F2C4A] font-bold mb-2">Sobre o Emprega Patos</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                O Emprega Patos é uma plataforma criada para conectar comércios,
                empresas e candidatos da cidade de Patos - PB de forma simples e
                gratuita. Empregadores publicam vagas em minutos, com localização
                real no mapa da cidade, e candidatos encontram oportunidades perto
                de onde moram.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}