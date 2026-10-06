"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CurriculoVisual from "@/components/CurriculoVisual";
import { useAuth } from "@/context/AuthContext";
import { buscarMinhaFicha, type Candidato } from "@/lib/api";
import { curriculoDaFicha, progressoCurriculo } from "@/lib/curriculo";
import { ClipboardList, FileUser, TriangleAlert } from "lucide-react";

function Casca({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}

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
        setCandidato(await buscarMinhaFicha(token));
      } catch (e: any) {
        setErro(e.message || "Não foi possível carregar o perfil do candidato.");
      } finally {
        setCarregando(false);
      }
    }
    carregarPerfil();
  }, [token]);

  if (carregando) {
    return (
      <Casca>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center text-slate-500">Carregando perfil...</div>
      </Casca>
    );
  }

  if (erro || !candidato) {
    return (
      <Casca>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            {erro ? <TriangleAlert className="w-10 h-10 text-amber-500" /> : <FileUser className="w-10 h-10 text-amber-600" />}
          </div>
          <h1 className="text-2xl font-bold text-[#0F2C4A] mt-5">
            {erro ? "Perfil de candidato não encontrado" : "Você ainda não tem um currículo"}
          </h1>
          <p className="text-slate-500 mt-2">
            {erro || "Crie seu currículo em poucos minutos para se candidatar às vagas."}
          </p>
          <button
            onClick={() => router.push(erro && !token ? "/login" : "/perfil/completar")}
            className="mt-6 bg-[#F0A93C] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
          >
            {erro && !token ? "Entrar" : "Criar meu currículo"}
          </button>
        </div>
      </Casca>
    );
  }

  const curriculo = curriculoDaFicha(candidato, usuario?.email);
  const progresso = progressoCurriculo(curriculo);

  return (
    <Casca>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F2C4A]">Meu currículo</h1>
          <p className="text-slate-500 mt-1">É assim que as empresas veem você quando você se candidata.</p>
        </div>
        <button
          onClick={() => router.push("/perfil/completar")}
          className="bg-[#F0A93C] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
        >
          Editar currículo
        </button>
      </div>

      {/* Progresso */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#0F2C4A]">Seu currículo está {progresso.porcentagem}% completo</p>
          {progresso.porcentagem === 100 && <span className="text-sm text-green-700 font-medium">Muito bem! ✓</span>}
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${progresso.porcentagem === 100 ? "bg-green-500" : "bg-[#F0A93C]"}`}
            style={{ width: `${progresso.porcentagem}%` }}
          />
        </div>
        {progresso.faltando.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Para chamar mais atenção, complete: {progresso.faltando.join(", ")}.
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-5 sm:p-8">
          <CurriculoVisual curriculo={curriculo} modo="candidato" />
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/perfil/candidato/candidaturas")}
            className="w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left hover:border-[#1D6FA5] hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-[#0F2C4A]" />
            </div>
            <h3 className="font-bold text-[#0F2C4A] mt-4">Minhas candidaturas</h3>
            <p className="text-sm text-slate-500 mt-1">Acompanhe as vagas em que você se candidatou e as respostas das empresas.</p>
          </button>

          <button
            onClick={() => router.push("/vagas")}
            className="w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-left hover:border-[#1D6FA5] hover:shadow-xl transition-all"
          >
            <h3 className="font-bold text-[#0F2C4A]">Procurar vagas →</h3>
            <p className="text-sm text-slate-500 mt-1">Veja as vagas abertas em Patos e se candidate.</p>
          </button>
        </div>
      </div>
    </Casca>
  );
}
