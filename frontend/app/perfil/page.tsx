"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function PerfilPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Título */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-full bg-[#0F2C4A] text-white flex items-center justify-center text-4xl mx-auto shadow-lg">
            👤
          </div>

          <h1 className="mt-6 text-3xl font-bold text-[#0F2C4A]">
            Meu Perfil
          </h1>

          <p className="text-slate-500 mt-2">
            Olá,
            <span className="font-semibold text-[#0F2C4A]">
              {" "}
              {usuario?.nome || "Usuário"}
            </span>
            !
          </p>

          <p className="text-sm text-slate-500 mt-1">
            Escolha qual perfil deseja acessar.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Perfil Candidato */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col">

            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
              👤
            </div>

            <h2 className="text-xl font-bold text-[#0F2C4A] mt-5">
              Perfil do Candidato
            </h2>

            <p className="text-slate-500 text-sm mt-3 flex-1">
              Complete seus dados pessoais, experiências, formação acadêmica
              e habilidades para aumentar suas chances de conseguir uma vaga.
            </p>

            <button
              onClick={() => router.push("/perfil/candidato")}
              className="mt-8 w-full bg-[#0F2C4A] text-white rounded-lg py-3 font-semibold hover:bg-[#17436f] transition-colors"
            >
              Acessar Perfil
            </button>

          </div>

          {/* Perfil Empresa */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col">

            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
              🏢
            </div>

            <h2 className="text-xl font-bold text-[#0F2C4A] mt-5">
              Perfil do Empregador
            </h2>

            <p className="text-slate-500 text-sm mt-3 flex-1">
              Consulte os dados da empresa cadastrada, gerencie suas
              informações e publique novas vagas para candidatos.
            </p>

            <button
              onClick={() => router.push("/perfil/empregador")}
              className="mt-8 w-full bg-[#F0A93C] text-white rounded-lg py-3 font-semibold hover:bg-[#dd9a30] transition-colors"
            >
              Acessar Perfil
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}