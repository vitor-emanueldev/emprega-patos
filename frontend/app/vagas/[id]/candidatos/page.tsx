"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
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

function formatarData(data: string | null | undefined) {
  if (!data) return "Não informada";
  const dataFormatada = new Date(data);
  if (Number.isNaN(dataFormatada.getTime())) return "Não informada";
  return dataFormatada.toLocaleDateString("pt-BR", { timeZone: "UTC" });
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

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
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
            const { candidato } = candidatura;
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
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0F2C4A]">{candidato.nome}</p>
                    <p className="text-sm text-slate-500">
                      {[candidato.cargoDesejado, candidato.areaInteresse].filter(Boolean).join(" · ") ||
                        "Sem cargo/área de interesse informados"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Candidatou-se em {new Date(candidatura.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${corDoStatus(
                      candidatura.status
                    )}`}
                  >
                    {rotuloDoStatus(candidatura.status)}
                  </span>
                </div>

                {candidato.habilidades && candidato.habilidades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {candidato.habilidades.map((habilidade) => (
                      <span
                        key={habilidade}
                        className="px-3 py-1 rounded-full bg-blue-100 text-[#0F2C4A] text-xs font-medium"
                      >
                        {habilidade}
                      </span>
                    ))}
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
                    {curriculoAberto ? "Ocultar currículo" : "Ver currículo"}
                  </button>

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
                  <div className="mt-5 border-t border-slate-200 pt-5 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Telefone</p>
                        <p className="font-medium text-[#0F2C4A]">{candidato.telefone || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Data de nascimento</p>
                        <p className="font-medium text-[#0F2C4A]">{formatarData(candidato.dataNascimento)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Pretensão salarial</p>
                        <p className="font-medium text-[#0F2C4A]">
                          {candidato.pretensaoSalarial != null
                            ? candidato.pretensaoSalarial.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "Não informada"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">CNH / Veículo</p>
                        <p className="font-medium text-[#0F2C4A]">
                          {candidato.possuiCnh
                            ? `Possui CNH${candidato.categoriaCnh ? " (" + candidato.categoriaCnh + ")" : ""}`
                            : "Não possui CNH"}
                          {" · "}
                          {candidato.possuiVeiculo ? "Possui veículo" : "Não possui veículo"}
                        </p>
                      </div>
                    </div>

                    {candidato.diferencial && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Diferencial</p>
                        <p className="text-slate-600 mt-1 whitespace-pre-line">{candidato.diferencial}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-[#0F2C4A] mb-2">Formação acadêmica</h3>
                      {candidato.formacoes && candidato.formacoes.length > 0 ? (
                        <div className="space-y-2">
                          {candidato.formacoes.map((formacao) => (
                            <div key={formacao.id} className="border border-slate-200 rounded-lg p-3">
                              <p className="font-medium text-[#0F2C4A] text-sm">{formacao.nivelEscolaridade}</p>
                              <p className="text-xs text-slate-500">{formacao.instituicao}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Nenhuma formação cadastrada.</p>
                      )}
                    </div>

                    {candidato.cursos && candidato.cursos.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-[#0F2C4A] mb-2">Cursos</h3>
                        <div className="space-y-2">
                          {candidato.cursos.map((curso) => (
                            <div key={curso.id} className="border border-slate-200 rounded-lg p-3">
                              <p className="font-medium text-[#0F2C4A] text-sm">{curso.nomeCurso}</p>
                              <p className="text-xs text-slate-500">
                                {[curso.instituicao, curso.cargaHoraria].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-[#0F2C4A] mb-2">Experiência profissional</h3>
                      {candidato.experiencias && candidato.experiencias.length > 0 ? (
                        <div className="space-y-2">
                          {candidato.experiencias.map((exp) => (
                            <div key={exp.id} className="border border-slate-200 rounded-lg p-3">
                              <p className="font-medium text-[#0F2C4A] text-sm">{exp.cargo}</p>
                              <p className="text-xs text-slate-500">{exp.empresa}</p>
                              {exp.descricao && (
                                <p className="text-sm text-slate-500 mt-1">{exp.descricao}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Nenhuma experiência cadastrada.</p>
                      )}
                    </div>
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