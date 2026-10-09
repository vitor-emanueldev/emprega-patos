"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import Header from "@/components/Header";
import BotaoSalvarVaga from "@/components/BotaoSalvarVaga";
import { useAuth } from "@/context/AuthContext";
import { useVagasSalvas } from "@/context/VagasSalvasContext";
import { listarVagasSalvas, type VagaSalva } from "@/lib/api";
import { getIconePorCargo } from "@/lib/icones";

export default function VagasSalvasPage() {
  const { token } = useAuth();
  const { estaSalva } = useVagasSalvas();
  const [vagas, setVagas] = useState<VagaSalva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) {
      setCarregando(false);
      return;
    }
    listarVagasSalvas(token)
      .then(setVagas)
      .catch((e) => setErro(e.message || "Não foi possível carregar suas vagas salvas."))
      .finally(() => setCarregando(false));
  }, [token]);

  // Se a pessoa tirar o coração aqui, a vaga some da lista
  const visiveis = vagas.filter((v) => estaSalva(v.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#0F2C4A]">Vagas salvas</h1>
        <p className="text-slate-500 mt-2 mb-8">As vagas que você marcou para ver depois.</p>

        {!token && !carregando && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-slate-600">Entre na sua conta para ver suas vagas salvas.</p>
            <Link
              href="/login?redirect=/perfil/vagas-salvas"
              className="inline-block mt-4 bg-[#0F2C4A] text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-[#123a63]"
            >
              Entrar
            </Link>
          </div>
        )}

        {carregando && <p className="text-sm text-slate-400 text-center py-16">Carregando...</p>}
        {erro && <p className="text-sm text-red-600 text-center py-16">{erro}</p>}

        {token && !carregando && !erro && visiveis.length === 0 && (
          <div className="bg-white rounded-xl shadow-md text-center py-14 px-4">
            <Bookmark className="w-9 h-9 text-[#F0A93C] mx-auto" />
            <p className="text-sm font-medium text-[#0F2C4A] mt-2">Nenhuma vaga salva ainda</p>
            <p className="text-xs text-slate-400 mt-1">Na página de uma vaga, toque em &quot;Salvar vaga&quot; para guardar aqui.</p>
            <Link
              href="/vagas"
              className="inline-block mt-5 bg-[#F0A93C] text-white text-xs font-semibold rounded-md px-4 py-2 hover:bg-[#dd9a30]"
            >
              Ver vagas
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {visiveis.map((vaga) => {
            const Icone = getIconePorCargo(vaga.cargo);
            const fechada = vaga.status !== "aberta";
            return (
              <div key={vaga.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 flex items-center gap-4">
                <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                  <Icone className="w-6 h-6 text-[#0F2C4A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0F2C4A] text-sm">{vaga.cargo}</p>
                  <p className="text-xs font-medium text-[#1D6FA5]">{vaga.empresa.nomeEmpresa}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vaga.bairro}
                    {vaga.salario != null && <> · R$ {vaga.salario.toLocaleString("pt-BR")}</>}
                    {fechada && <span className="ml-2 text-red-600 font-medium">· Vaga {vaga.status}</span>}
                  </p>
                </div>
                <BotaoSalvarVaga vagaId={vaga.id} />
                <Link
                  href={`/vagas/${vaga.id}`}
                  className="shrink-0 bg-[#F0A93C] text-white text-xs font-semibold rounded-md px-4 py-2 hover:bg-[#dd9a30]"
                >
                  Ver detalhes
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
