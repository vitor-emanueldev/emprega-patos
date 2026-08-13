"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { buscarMinhaFicha, Candidato } from "@/lib/api";

export default function PerfilCandidatoPage() {
  const router = useRouter();
  const { usuario, token } = useAuth();

  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      if (!token) {
        setCarregando(false);
        setErro("Você precisa estar logado para acessar seu perfil.");
        return;
      }

      try {
        const dados = await buscarMinhaFicha(token);
        setCandidato(dados);
      } catch (erro: any) {
        setErro(
          erro.message || "Não foi possível carregar o perfil do candidato."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
  }, [token]);

  function formatarData(data: string | null) {
    if (!data) {
      return "Não informada";
    }

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return "Não informada";
    }

    return dataFormatada.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">
              Carregando perfil...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">

            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold text-[#0F2C4A] mt-5">
              Perfil de candidato não encontrado
            </h1>

            <p className="text-slate-500 mt-2">
              {erro}
            </p>

            <button
              onClick={() => router.push("/perfil/completar")}
              className="mt-6 bg-[#F0A93C] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
            >
              Completar Perfil
            </button>

          </div>
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
              Perfil do Candidato
            </h1>

            <p className="text-slate-500 mt-2">
              Visualize suas informações e mantenha seu currículo atualizado.
            </p>
          </div>

          <button
            onClick={() => router.push("/perfil/candidato/editar")}
            className="mt-5 md:mt-0 bg-[#F0A93C] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
          >
            Editar Perfil
          </button>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Coluna Esquerda */}
          <div className="lg:col-span-1">

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

              {/* Avatar */}
              <div className="flex flex-col items-center">

                <div className="w-36 h-36 rounded-full bg-[#0F2C4A] flex items-center justify-center text-white text-6xl shadow-md">
                  👤
                </div>

                <h2 className="mt-5 text-2xl font-bold text-[#0F2C4A] text-center">
                  {candidato?.nome || usuario?.nome || "Usuário"}
                </h2>

                <p className="text-slate-500 text-sm mt-1 text-center">
                  Candidato
                </p>

              </div>

              <hr className="my-8 border-slate-200" />

              {/* Informações */}
              <div className="space-y-5">

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
                    {candidato?.telefone || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    CPF
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {candidato?.cpf || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Data de nascimento
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    {formatarData(candidato?.dataNascimento || null)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Localização
                  </p>

                  <p className="font-medium text-[#0F2C4A]">
                    Patos - PB
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dados Pessoais */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Dados Pessoais
              </h2>

              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Nome Completo
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {candidato?.nome || usuario?.nome || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    E-mail
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {usuario?.email || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Telefone
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {candidato?.telefone || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    CPF
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {candidato?.cpf || "Não informado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Data de Nascimento
                  </p>

                  <p className="mt-1 font-medium text-[#0F2C4A]">
                    {formatarData(candidato?.dataNascimento || null)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Cidade
                  </p>

                  <p className="mt-1 text-slate-500">
                    Patos - PB
                  </p>
                </div>

              </div>

            </section>

            {/* Habilidades */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Habilidades
              </h2>

              <div className="flex flex-wrap gap-3">

                {candidato?.habilidades &&
                candidato.habilidades.length > 0 ? (

                  candidato.habilidades.map((habilidade) => (
                    <span
                      key={habilidade}
                      className="px-4 py-2 rounded-full bg-blue-100 text-[#0F2C4A] text-sm font-medium"
                    >
                      {habilidade}
                    </span>
                  ))

                ) : (

                  <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-sm">
                    Nenhuma habilidade cadastrada
                  </span>

                )}

              </div>

            </section>

            {/* Formação Acadêmica */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Formação Acadêmica
              </h2>

              <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">

                <p className="text-slate-500">
                  Nenhuma formação cadastrada.
                </p>

                <p className="text-sm text-slate-400 mt-2">
                  Você poderá adicionar cursos e graduações futuramente.
                </p>

              </div>

            </section>

            {/* Experiência Profissional */}
            <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

              <h2 className="text-xl font-bold text-[#0F2C4A] mb-5">
                Experiência Profissional
              </h2>

              <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">

                <p className="text-slate-500">
                  Nenhuma experiência cadastrada.
                </p>

                <p className="text-sm text-slate-400 mt-2">
                  Adicione suas experiências para destacar seu perfil.
                </p>

              </div>

            </section>

          </div>

        </div>

      </main>
    </div>
  );
}