"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

interface Vaga {
  id: string;
  cargo: string;
  bairro: string;
  salario: number | null;
  empresa: {
    nomeEmpresa: string;
  };
}

// Ícones e cores usados só como estilo visual, girando conforme o índice
const ESTILOS = [
  { icone: "🧑‍💼", cor: "bg-teal-100" },
  { icone: "🛵", cor: "bg-amber-100" },
  { icone: "🐾", cor: "bg-emerald-100" },
];

export default function HomePage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregandoVagas, setCarregandoVagas] = useState(true);

  useEffect(() => {
    async function buscarVagasRecentes() {
      try {
        const resposta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vagas`);
        if (!resposta.ok) throw new Error("Erro ao buscar vagas");
        const dados: Vaga[] = await resposta.json();

        // O backend já retorna ordenado por mais recente (createdAt desc)
        setVagas(dados.slice(0, 3));
      } catch (error) {
        console.error("Erro ao carregar vagas recentes:", error);
      } finally {
        setCarregandoVagas(false);
      }
    }

    buscarVagasRecentes();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* HERO */}
      <section className="bg-[#0F2C4A] text-center py-16 px-4">
        <span className="inline-block bg-white/10 text-white text-xs font-medium rounded-full px-4 py-1 mb-4">
           Patos - Paraíba
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
              placeholder="Cargo, área ou empresa..."
              className="flex-1 py-2.5 text-sm focus:outline-none text-[#0F2C4A]"
            />
            <button className="bg-[#F0A93C] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#dd9a30] rounded-full m-1">
              Buscar Vagas
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-12 text-white">
          <div>
            <p className="text-2xl font-bold">40</p>
            <p className="text-xs text-slate-300">Vagas Ativas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">15</p>
            <p className="text-xs text-slate-300">Empresas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">100</p>
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

        <Link
          href="/mapa"
          className="block rounded-xl overflow-hidden border-4 border-[#F0A93C] hover:opacity-90 transition-opacity"
        >
          <Image
            src="/mapa-patos.png"
            alt="Mapa de vagas em Patos"
            width={1200}
            height={650}
            className="w-full h-auto"
          />
        </Link>
      </section>

      {/* VAGAS RECENTES */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0F2C4A]">Vagas Recentes</h2>
              <p className="text-sm text-slate-500">
                Publicadas nas últimas 24 horas
              </p>
            </div>
            <Link
              href="/vagas"
              className="text-sm font-semibold text-white bg-[#0F2C4A] rounded-md px-4 py-2 hover:bg-[#123a63] whitespace-nowrap"
            >
              Ver vagas
            </Link>
          </div>

          {carregandoVagas ? (
            <p className="text-sm text-slate-500">Carregando vagas...</p>
          ) : vagas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma vaga cadastrada no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vagas.map((vaga, index) => {
                const estilo = ESTILOS[index % ESTILOS.length];
                return (
                  <div
                    key={vaga.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col gap-2"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${estilo.cor} flex items-center justify-center text-lg mb-1`}
                    >
                      {estilo.icone}
                    </div>
                    <p className="font-semibold text-[#0F2C4A] text-sm">
                      {vaga.cargo}
                    </p>
                    <p className="text-xs text-slate-500 -mt-1">
                      {vaga.empresa?.nomeEmpresa ?? "Empresa não informada"}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      📍 {vaga.bairro}{" "}
                      <span className="mx-1">·</span>{" "}
                      {vaga.salario
                        ? `R$ ${vaga.salario.toLocaleString("pt-BR")}`
                        : "A combinar"}
                    </p>
                    <Link
                      href={`/vagas/${vaga.id}`}
                      className="mt-2 text-center bg-[#F0A93C] text-white text-xs font-semibold rounded-md py-2 hover:bg-[#dd9a30]"
                    >
                      Ver vaga
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F0A93C] py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-xl font-bold">Tem vagas para preencher?</h2>
            <p className="text-white/90 text-sm">
              Publique gratuitamente e alcance candidatos da cidade toda.
            </p>
          </div>
          <div className="flex gap-3 ml-auto">
            <button className="bg-white text-[#0F2C4A] text-sm font-semibold rounded-md px-5 py-2">
              Saiba mais
            </button>
            <Link
              href="/publicar-vaga"
              className="bg-[#0F2C4A] text-white text-sm font-semibold rounded-md px-5 py-2 hover:bg-[#123a63]"
            >
              Publicar vaga grátis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
