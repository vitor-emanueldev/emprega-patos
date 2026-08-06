"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import {
  detalhesVaga,
  candidatarVaga,
  minhasCandidaturas,
  verificarCandidato,
  type Vaga,
} from "@/lib/api";
import MapaSelecionarLocal from "@/components/MapaSelecionarLocal"; // ajuste o caminho se for diferente

type EstadoBotao =
  | "carregando"
  | "sem-token"
  | "sem-curriculo"
  | "pode-candidatar"
  | "ja-candidatou";

export default function DetalhesVagaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [vaga, setVaga] = useState<Vaga | null>(null);
  const [carregandoVaga, setCarregandoVaga] = useState(true);
  const [erroVaga, setErroVaga] = useState("");

  const [estadoBotao, setEstadoBotao] = useState<EstadoBotao>("carregando");
  const [enviando, setEnviando] = useState(false);
  const [erroCandidatura, setErroCandidatura] = useState("");

  // Busca os detalhes da vaga
  useEffect(() => {
    if (!id) return;

    async function carregar() {
      try {
        const dados = await detalhesVaga(id as string);
        setVaga(dados);
      } catch (e: any) {
        setErroVaga(e.message || "Não foi possível carregar a vaga.");
      } finally {
        setCarregandoVaga(false);
      }
    }

    carregar();
  }, [id]);

  // Define o estado do botão de candidatura
  useEffect(() => {
    if (!id) return;

    async function checarEstado() {
      const token = localStorage.getItem("token"); // ajuste conforme onde vocês guardam o token

      if (!token) {
        setEstadoBotao("sem-token");
        return;
      }

      try {
        const candidato = await verificarCandidato(token);

        if (!candidato) {
          setEstadoBotao("sem-curriculo");
          return;
        }

        const candidaturas = await minhasCandidaturas(token);
        const jaCandidatou = candidaturas.some((c) => c.vagaId === id);

        setEstadoBotao(jaCandidatou ? "ja-candidatou" : "pode-candidatar");
      } catch (e: any) {
        setErroCandidatura(
          e.message || "Não foi possível verificar sua candidatura."
        );
      }
    }

    checarEstado();
  }, [id]);

  async function handleCandidatar() {
    const token = localStorage.getItem("token");
    if (!token || !id) return;

    setEnviando(true);
    setErroCandidatura("");

    try {
      await candidatarVaga(token, id as string);
      setEstadoBotao("ja-candidatou");
    } catch (e: any) {
      setErroCandidatura(e.message || "Erro ao enviar sua candidatura.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoVaga) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <p className="text-sm text-slate-400 text-center py-16">
          Carregando vaga...
        </p>
      </div>
    );
  }

  if (erroVaga || !vaga) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <p className="text-sm text-red-600 text-center py-16">
          {erroVaga || "Vaga não encontrada."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-[#0F2C4A]">{vaga.cargo}</h1>
            <p className="text-sm font-medium text-[#1D6FA5]">
              {vaga.empresa.nomeEmpresa}
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <p>{vaga.descricao}</p>
            <p>
              <strong>Tipo de contrato:</strong> {vaga.tipoContrato}
            </p>
            <p>
              <strong>Área:</strong> {vaga.area}
            </p>
            {vaga.salario != null && (
              <p>
                <strong>Salário:</strong> R${" "}
                {vaga.salario.toLocaleString("pt-BR")}
              </p>
            )}
            <p>
              <strong>Endereço:</strong> {vaga.endereco}, {vaga.bairro}
            </p>
          </div>

          {vaga.requisitos?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide mb-1">
                REQUISITOS
              </p>
              <ul className="list-disc list-inside text-sm text-slate-700">
                {vaga.requisitos.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {vaga.latitude != null && vaga.longitude != null && (
            <MapaSelecionarLocal
              latitude={vaga.latitude}
              longitude={vaga.longitude}
              onSelecionar={() => {}}
              somenteLeitura
            />
          )}

          {erroCandidatura && (
            <p className="text-sm text-red-600">{erroCandidatura}</p>
          )}

          <BotaoCandidatura
            estado={estadoBotao}
            enviando={enviando}
            onClick={handleCandidatar}
            router={router}
          />
        </div>
      </main>
    </div>
  );
}

function BotaoCandidatura({
  estado,
  enviando,
  onClick,
  router,
}: {
  estado: EstadoBotao;
  enviando: boolean;
  onClick: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  if (estado === "carregando") {
    return (
      <button
        disabled
        className="bg-[#F0A93C] text-white text-sm font-semibold rounded-md px-5 py-2.5 opacity-50"
      >
        Verificando...
      </button>
    );
  }

  if (estado === "sem-token") {
    return (
      <button
        className="bg-[#F0A93C] text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-[#dd9a30]"
        onClick={() => router.push("/login")}
      >
        Candidatar-se
      </button>
    );
  }

  if (estado === "sem-curriculo") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-700">
          Complete seu currículo para se candidatar.
        </p>
        <button
          className="bg-[#F0A93C] text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-[#dd9a30]"
          onClick={() => router.push("/completar-perfil")}
        >
          Completar perfil
        </button>
      </div>
    );
  }

  if (estado === "ja-candidatou") {
    return (
      <button
        disabled
        className="bg-slate-300 text-white text-sm font-semibold rounded-md px-5 py-2.5 cursor-not-allowed"
      >
        Você já se candidatou
      </button>
    );
  }

  return (
    <button
      className="bg-[#F0A93C] text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-[#dd9a30] disabled:opacity-50"
      onClick={onClick}
      disabled={enviando}
    >
      {enviando ? "Enviando..." : "Candidatar-se"}
    </button>
  );
}