"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { minhasCandidaturas, type Candidatura } from "@/lib/api";

function corDoStatus(status: string) {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("aprov")) return "bg-green-100 text-green-700";
  if (normalizado.includes("recus") || normalizado.includes("rejeit")) return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export default function MinhasCandidaturasPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      if (!token) {
        setCarregando(false);
        setErro("Você precisa estar logado para ver suas candidaturas.");
        return;
      }

      try {
        const dados = await minhasCandidaturas(token);
        setCandidaturas(dados);
      } catch (erroCapturado: any) {
        setErro(erroCapturado.message || "Não foi possível carregar suas candidaturas.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2C4A]">Vagas concorridas</h1>
            <p className="text-slate-500 mt-2">
              Acompanhe as vagas às quais você já se candidatou.
            </p>
          </div>

          <button
            onClick={() => router.push("/perfil/candidato")}
            className="text-sm font-medium text-[#0F2C4A] hover:underline"
          >
            ← Voltar ao perfil
          </button>
        </div>

        {carregando && (
          <p className="text-sm text-slate-400 text-center py-16">Carregando...</p>
        )}

        {!carregando && erro && (
          <p className="text-sm text-red-600 text-center py-16">{erro}</p>
        )}

        {!carregando && !erro && candidaturas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Você ainda não se candidatou a nenhuma vaga.</p>
            <button
              onClick={() => router.push("/vagas")}
              className="mt-5 bg-[#F0A93C] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#dd9a30] transition-colors"
            >
              Ver vagas disponíveis
            </button>
          </div>
        )}

        <div className="space-y-4">
          {candidaturas.map((candidatura) => (
            <div
              key={candidatura.id}
              className="bg-white rounded-xl shadow-md border border-slate-200 p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#0F2C4A]">{candidatura.vaga?.cargo}</p>
                <p className="text-sm text-[#1D6FA5]">{candidatura.vaga?.empresa?.nomeEmpresa}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Candidatou-se em{" "}
                  {new Date(candidatura.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${corDoStatus(candidatura.status)}`}
              >
                {candidatura.status}
              </span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
