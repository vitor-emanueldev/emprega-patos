"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { verificarEmpresa } from "@/lib/api";

type Empresa = {
  id: string;
  nomeEmpresa: string;
  cnpj: string;
  setor?: string;
  descricao?: string;
  telefone?: string;
  endereco?: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
};

export default function PerfilEmpregadorPage() {
  const router = useRouter();
  const { usuario, token } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const dados = await verificarEmpresa(token);
        setEmpresa(dados);
      } catch (e) {
        console.error("Erro ao buscar empresa:", e);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [token]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-sm text-slate-400 text-center py-16">
            Carregando perfil...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">

          <div>
            <h1 className="text-3xl font-bold text-[#0F2C4A]">
              Perfil do Empregador
            </h1>

            <p className="text-slate-500 mt-2">
              Visualize as informações da empresa e gerencie seus dados.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                empresa
                  ? "/perfil/empregador/editar"
                  : "/perfil/empregador/cadastrar"
              )
            }
            className="mt-5 md:mt-0 bg-[#F0A93C] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
          >
            {empresa ? "Editar Perfil" : "Cadastrar Empresa"}
          </button>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1">

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

              {/* Avatar */}
              <div className="flex flex-col items-center">

                <div className="w-36 h-36 rounded-full bg-[#F0A93C] flex items-center justify-center text-white text-6xl shadow-md">
                  🏢
                </div>

                <h2 className="mt-5 text-2xl font-bold text-[#0F2C4A] text-center">
                  {empresa?.nomeEmpresa || "Empresa não cadastrada"}
                </h2>

                <p className="text-slate-500 text-sm mt-1 text-center">
                  Empregador
                </p>

              </div>

              <hr className="my-8 border-slate-200" />

              {/* Informações */}
              <div className="space-y-5">

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Responsável
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {usuario?.nome || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    E-mail
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {usuario?.email || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Telefone
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {empresa?.telefone || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    CNPJ
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {empresa?.cnpj || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Setor
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {empresa?.setor || "Não informado"}
                  </p>
                </div>

              </div>

            </div>

          </div>
          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dados da Empresa */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Dados da Empresa
              </h2>

              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Nome da Empresa
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {empresa?.nomeEmpresa || "Não cadastrada"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Responsável
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {usuario?.nome || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    CNPJ
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {empresa?.cnpj || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Setor de atuação
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {empresa?.setor || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Telefone
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {empresa?.telefone || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Bairro
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {empresa?.bairro || "Não informado"}
                  </p>
                </div>

              </div>

            </section>

            {/* Descrição */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Sobre a Empresa
              </h2>

              {empresa?.descricao ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {empresa.descricao}
                </p>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-lg p-6">
                  <p className="text-slate-500">
                    Nenhuma descrição cadastrada.
                  </p>
                </div>
              )}

            </section>

            {/* Localização */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Localização
              </h2>

              {empresa?.endereco ? (
                <div className="rounded-lg p-6 bg-slate-50 border border-slate-200">
                  <p className="text-[#0F2C4A] font-medium">
                    {empresa.endereco}
                  </p>
                  {empresa.bairro && (
                    <p className="text-sm text-slate-500 mt-1">
                      {empresa.bairro}, Patos - PB
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-lg p-6">
                  <p className="text-slate-500">
                    Endereço não informado.
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    A localização da empresa aparecerá aqui após o cadastro.
                  </p>
                </div>
              )}

            </section>

            {/* Vagas Publicadas */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Vagas Publicadas
              </h2>

              <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">

                <p className="text-slate-500">
                  Nenhuma vaga publicada.
                </p>

                <button
                  onClick={() => router.push("/publicar-vaga")}
                  className="mt-5 bg-[#F0A93C] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
                >
                  Publicar nova vaga
                </button>

              </div>

            </section>

          </div>
        </div>

      </main>
    </div>
  );
}