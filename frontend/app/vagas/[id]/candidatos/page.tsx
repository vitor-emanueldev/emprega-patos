"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import CurriculoVisual from "@/components/CurriculoVisual";
import { linkWhatsapp, rotuloTurno, type CurriculoVisao } from "@/lib/curriculo";
import { MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  candidaturasDaVaga,
  aceitarCandidatura,
  rejeitarCandidatura,
  detalhesVaga,
  type CandidaturaComCandidato,
  type Vaga,
} from "@/lib/api";

function corDoStatus(status: string) {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("aprov")) return "bg-green-100 text-green-700";
  if (normalizado.includes("recus") || normalizado.includes("rejeit")) return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function rotuloDoStatus(status: string) {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("aprov")) return "Aprovado — entrevista marcada";
  if (normalizado.includes("recus") || normalizado.includes("rejeit")) return "Recusado";
  return "Aguardando resposta";
}

function formatarDataHora(data: string | null | undefined) {
  if (!data) return "Não informada";
  const dataFormatada = new Date(data);
  if (Number.isNaN(dataFormatada.getTime())) return "Não informada";
  return dataFormatada.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Resumo rápido para a empresa decidir em segundos
function resumoExperiencia(c: CurriculoVisao) {
  const lista = c.experiencias || [];
  if (lista.length > 0) {
    const funcoes = Array.from(new Set(lista.map((e) => e.cargo))).slice(0, 2).join(", ");
    return `${lista.length} experiência${lista.length > 1 ? "s" : ""}: ${funcoes}`;
  }
  return c.primeiroEmprego ? "Primeiro emprego" : "Sem experiência informada";
}

function Etiqueta({ children, destaque }: { children: React.ReactNode; destaque?: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        destaque ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  );
}

export default function CandidatosDaVagaPage() {
  const router = useRouter();
  const params = useParams();
  const vagaId = params.id as string;
  const { token } = useAuth();

  const [vaga, setVaga] = useState<Vaga | null>(null);
  const [candidaturas, setCandidaturas] = useState<CandidaturaComCandidato[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [curriculoAbertoId, setCurriculoAbertoId] = useState<string | null>(null);
  const [formularioAbertoId, setFormularioAbertoId] = useState<string | null>(null);
  const [tipoFormulario, setTipoFormulario] = useState<"aceitar" | "rejeitar" | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState("");

  const [dataEntrevista, setDataEntrevista] = useState("");
  const [horaEntrevista, setHoraEntrevista] = useState("");
  const [mensagemAceite, setMensagemAceite] = useState("");
  const [mensagemRejeicao, setMensagemRejeicao] = useState("");

  useEffect(() => {
    async function carregar() {
      if (!token) {
        setCarregando(false);
        setErro("Você precisa estar logado para ver os candidatos.");
        return;
      }

      try {
        const [dadosVaga, dadosCandidaturas] = await Promise.all([
          detalhesVaga(vagaId),
          candidaturasDaVaga(token, vagaId),
        ]);
        setVaga(dadosVaga);
        setCandidaturas(dadosCandidaturas);
      } catch (erroCapturado: any) {
        setErro(erroCapturado.message || "Não foi possível carregar os candidatos desta vaga.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [token, vagaId]);

  function abrirFormulario(candidaturaId: string, tipo: "aceitar" | "rejeitar") {
    setFormularioAbertoId(candidaturaId);
    setTipoFormulario(tipo);
    setErroFormulario("");
    setDataEntrevista("");
    setHoraEntrevista("");
    setMensagemAceite("");
    setMensagemRejeicao("");
  }

  function fecharFormulario() {
    setFormularioAbertoId(null);
    setTipoFormulario(null);
    setErroFormulario("");
  }

  async function handleAceitar(candidaturaId: string) {
    if (!token) return;
    setErroFormulario("");

    if (!dataEntrevista || !horaEntrevista) {
      setErroFormulario("Escolha a data e o horário da entrevista.");
      return;
    }

    const dataHoraIso = new Date(`${dataEntrevista}T${horaEntrevista}`).toISOString();

    setProcessandoId(candidaturaId);
    try {
      const atualizada = await aceitarCandidatura(token, candidaturaId, dataHoraIso, mensagemAceite);
      setCandidaturas((prev) =>
        prev.map((c) => (c.id === candidaturaId ? { ...c, ...atualizada } : c))
      );
      fecharFormulario();
    } catch (erroCapturado: any) {
      setErroFormulario(erroCapturado.message || "Não foi possível aceitar o candidato.");
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleRejeitar(candidaturaId: string) {
    if (!token) return;
    setErroFormulario("");

    if (!mensagemRejeicao.trim()) {
      setErroFormulario("Escreva uma mensagem explicando o motivo da recusa.");
      return;
    }

    setProcessandoId(candidaturaId);
    try {
      const atualizada = await rejeitarCandidatura(token, candidaturaId, mensagemRejeicao);
      setCandidaturas((prev) =>
        prev.map((c) => (c.id === candidaturaId ? { ...c, ...atualizada } : c))
      );
      fecharFormulario();
    } catch (erroCapturado: any) {
      setErroFormulario(erroCapturado.message || "Não foi possível recusar o candidato.");
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2C4A]">Candidatos</h1>
            <p className="text-slate-500 mt-2">
              {vaga ? `Candidatos interessados na vaga de ${vaga.cargo}` : "Carregando dados da vaga..."}
            </p>
          </div>

          <button
            onClick={() => router.push("/perfil/empregador")}
            className="text-sm font-medium text-[#0F2C4A] hover:underline whitespace-nowrap"
          >
            ← Voltar ao perfil
          </button>
        </div>

        {carregando && (
          <p className="text-sm text-slate-400 text-center py-16">Carregando candidatos...</p>
        )}

        {!carregando && erro && (
          <p className="text-sm text-red-600 text-center py-16">{erro}</p>
        )}

        {!carregando && !erro && candidaturas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Ainda não há candidatos para essa vaga.</p>
          </div>
        )}

        <div className="space-y-4">
          {candidaturas.map((candidatura) => {
            const c = candidatura.curriculo;
            const curriculoAberto = curriculoAbertoId === candidatura.id;
            const formularioAberto = formularioAbertoId === candidatura.id;
            const processando = processandoId === candidatura.id;
            const pendente = candidatura.status.toLowerCase() === "pendente";

            return (
              <div
                key={candidatura.id}
                className="bg-white rounded-xl shadow-md border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-[#0F2C4A] flex items-center justify-center">
                      {c.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.fotoUrl} alt={`Foto de ${c.nome}`} className="w-full h-full object-cover" />
                      ) : (
                        <UserRound className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F2C4A]">{c.nome}</p>
                      <p className="text-sm text-slate-500">
                        {[c.idade != null ? `${c.idade} anos` : null, c.bairro ? `Bairro ${c.bairro}` : null, c.escolaridade]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Candidatou-se em {new Date(candidatura.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${corDoStatus(
                      candidatura.status
                    )}`}
                  >
                    {rotuloDoStatus(candidatura.status)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Etiqueta>{resumoExperiencia(c)}</Etiqueta>
                  {c.turnos && c.turnos.length > 0 && <Etiqueta>{c.turnos.map(rotuloTurno).join(", ")}</Etiqueta>}
                  {c.disponivelFimDeSemana && <Etiqueta>Fins de semana</Etiqueta>}
                  {c.inicioImediato && <Etiqueta destaque>Começa imediatamente</Etiqueta>}
                  {c.possuiCnh && <Etiqueta>CNH{c.categoriaCnh ? ` ${c.categoriaCnh}` : ""}</Etiqueta>}
                  {c.possuiVeiculo && <Etiqueta>Tem veículo</Etiqueta>}
                </div>

                {candidatura.mensagemCandidato && (
                  <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-xs font-semibold text-[#1D6FA5] mb-1">Mensagem do candidato</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{candidatura.mensagemCandidato}</p>
                  </div>
                )}

                {/* Resposta já enviada ao candidato */}
                {!pendente && (
                  <div
                    className={`mt-4 rounded-lg p-4 border ${
                      candidatura.status.toLowerCase().includes("aprov")
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {candidatura.status.toLowerCase().includes("aprov") && (
                      <p className="text-sm font-semibold text-green-800">
                        Entrevista marcada para {formatarDataHora(candidatura.dataEntrevista)}
                      </p>
                    )}
                    {candidatura.mensagemResposta && (
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">
                        “{candidatura.mensagemResposta}”
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <button
                    onClick={() => setCurriculoAbertoId(curriculoAberto ? null : candidatura.id)}
                    className="text-xs font-semibold text-[#1D6FA5] border border-[#1D6FA5] rounded-md px-3 py-1.5 hover:bg-[#1D6FA5]/5"
                  >
                    {curriculoAberto ? "Ocultar currículo" : "Ver currículo completo"}
                  </button>

                  {c.telefoneWhatsapp !== false && linkWhatsapp(c.telefone) && (
                    <a
                      href={linkWhatsapp(c.telefone, `Olá, ${c.nome.split(" ")[0]}! Vi sua candidatura para a vaga de ${vaga?.cargo ?? ""} no MapVagas.`)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 rounded-md px-3 py-1.5 hover:bg-green-700"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}

                  {pendente && (
                    <>
                      <button
                        onClick={() => abrirFormulario(candidatura.id, "aceitar")}
                        className="text-xs font-semibold text-white bg-green-600 rounded-md px-3 py-1.5 hover:bg-green-700"
                      >
                        Aceitar candidato
                      </button>
                      <button
                        onClick={() => abrirFormulario(candidatura.id, "rejeitar")}
                        className="text-xs font-semibold text-white bg-red-600 rounded-md px-3 py-1.5 hover:bg-red-700"
                      >
                        Rejeitar candidato
                      </button>
                    </>
                  )}
                </div>

                {/* Currículo completo */}
                {curriculoAberto && (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <CurriculoVisual
                      curriculo={c}
                      modo="empresa"
                      textoWhatsapp={`Olá, ${c.nome.split(" ")[0]}! Vi sua candidatura para a vaga de ${vaga?.cargo ?? ""} no MapVagas.`}
                    />
                    {candidatura.copiaDoMomentoDaCandidatura && (
                      <p className="text-xs text-slate-400 mt-4">
                        Currículo como estava no dia da candidatura. Contato e foto são sempre os mais recentes.
                      </p>
                    )}
                  </div>
                )}

                {/* Formulário de aceitar */}
                {formularioAberto && tipoFormulario === "aceitar" && (
                  <div className="mt-5 border-t border-slate-200 pt-5 bg-green-50 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
                    <h3 className="text-sm font-bold text-[#0F2C4A] mb-3">
                      Marcar entrevista presencial
                    </h3>

                    {erroFormulario && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
                        {erroFormulario}
                      </p>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#0F2C4A] font-medium mb-1">Data *</label>
                        <input
                          type="date"
                          value={dataEntrevista}
                          onChange={(e) => setDataEntrevista(e.target.value)}
                          className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#0F2C4A] font-medium mb-1">Horário *</label>
                        <input
                          type="time"
                          value={horaEntrevista}
                          onChange={(e) => setHoraEntrevista(e.target.value)}
                          className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-[#0F2C4A] font-medium mb-1">
                        Mensagem para o candidato (opcional)
                      </label>
                      <textarea
                        value={mensagemAceite}
                        onChange={(e) => setMensagemAceite(e.target.value)}
                        rows={3}
                        placeholder="Ex: Compareça com um documento com foto. Endereço: ..."
                        className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm text-gray-900 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                      <button
                        onClick={fecharFormulario}
                        className="text-sm font-medium text-slate-500 hover:underline"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAceitar(candidatura.id)}
                        disabled={processando}
                        className="rounded-md bg-green-600 text-white font-semibold px-4 py-2 text-sm hover:bg-green-700 disabled:opacity-60"
                      >
                        {processando ? "Enviando..." : "Confirmar entrevista"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulário de rejeitar */}
                {formularioAberto && tipoFormulario === "rejeitar" && (
                  <div className="mt-5 border-t border-slate-200 pt-5 bg-red-50 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
                    <h3 className="text-sm font-bold text-[#0F2C4A] mb-3">Recusar candidato</h3>

                    {erroFormulario && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
                        {erroFormulario}
                      </p>
                    )}

                    <div>
                      <label className="block text-xs text-[#0F2C4A] font-medium mb-1">
                        Mensagem para o candidato *
                      </label>
                      <textarea
                        value={mensagemRejeicao}
                        onChange={(e) => setMensagemRejeicao(e.target.value)}
                        rows={3}
                        placeholder="Explique o motivo da recusa de forma respeitosa."
                        className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm text-gray-900 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                      <button
                        onClick={fecharFormulario}
                        className="text-sm font-medium text-slate-500 hover:underline"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleRejeitar(candidatura.id)}
                        disabled={processando}
                        className="rounded-md bg-red-600 text-white font-semibold px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-60"
                      >
                        {processando ? "Enviando..." : "Enviar recusa"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}