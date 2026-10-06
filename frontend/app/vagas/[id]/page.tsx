"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { detalhesVaga, candidatarVaga, buscarMinhaFicha, minhasCandidaturas, type Vaga, type Candidato } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import CurriculoVisual from "@/components/CurriculoVisual";
import { curriculoDaFicha, progressoCurriculo } from "@/lib/curriculo";

const MapaVagas = dynamic(() => import("@/components/MapaVagas"), {
  ssr: false,
  loading: () => (
    <div
      className="bg-slate-100 flex items-center justify-center text-sm text-slate-400"
      style={{ height: 192 }}
    >
      Carregando mapa...
    </div>
  ),
});

function tempoPublicacao(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const horas = Math.floor(diffMs / (1000 * 60 * 60));

  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;

  const dias = Math.floor(horas / 24);
  return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
}

function formatarSalario(valor: number | null) {
  if (valor == null) return "A combinar";
  return `R$ ${valor.toLocaleString("pt-BR")}`;
}

export default function DetalhesVagaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, usuario } = useAuth();

  const [vaga, setVaga] = useState<Vaga | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [candidatando, setCandidatando] = useState(false);
  const [jaCandidatou, setJaCandidatou] = useState(false);
  const [erroCandidatura, setErroCandidatura] = useState("");

  // Revisão antes de enviar a candidatura
  const [revisaoAberta, setRevisaoAberta] = useState(false);
  const [ficha, setFicha] = useState<Candidato | null>(null);
  const [carregandoFicha, setCarregandoFicha] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [verCurriculo, setVerCurriculo] = useState(false);

  // Já se candidatou antes? (para não mostrar o botão de novo)
  useEffect(() => {
    if (!token || !id) return;
    minhasCandidaturas(token)
      .then((lista) => setJaCandidatou(lista.some((c) => c.vagaId === id)))
      .catch(() => {});
  }, [token, id]);

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await detalhesVaga(id as string);
        setVaga(dados);
      } catch (e: any) {
        setErro(e.message || "Não foi possível carregar esta vaga.");
      } finally {
        setCarregando(false);
      }
    }
    if (id) carregar();
  }, [id]);

  // 1º passo: abre a revisão (confere se já tem currículo)
  async function abrirRevisao() {
    setErroCandidatura("");

    if (!token) {
      router.push(`/login?redirect=/vagas/${id}`);
      return;
    }

    setCarregandoFicha(true);
    try {
      const dados = await buscarMinhaFicha(token);
      if (!dados) {
        router.push(`/perfil/completar?redirect=/vagas/${id}`);
        return;
      }
      setFicha(dados);
      setMensagem("");
      setVerCurriculo(false);
      setRevisaoAberta(true);
    } catch (e: any) {
      setErroCandidatura(e.message || "Não foi possível carregar seu currículo.");
    } finally {
      setCarregandoFicha(false);
    }
  }

  // 2º passo: envia a candidatura (o servidor guarda uma cópia do currículo)
  async function enviarCandidatura() {
    if (!token) return;
    setErroCandidatura("");
    setCandidatando(true);

    try {
      await candidatarVaga(token, id as string, mensagem);
      setJaCandidatou(true);
      setRevisaoAberta(false);
    } catch (e: any) {
      const texto = e.message || "";
      if (texto.toLowerCase().includes("currículo")) {
        router.push(`/perfil/completar?redirect=/vagas/${id}`);
        return;
      }
      if (texto.toLowerCase().includes("já se candidatou")) {
        setJaCandidatou(true);
        setRevisaoAberta(false);
        return;
      }
      setErroCandidatura(texto);
    } finally {
      setCandidatando(false);
    }
  }

  const curriculoRevisao = ficha ? curriculoDaFicha(ficha, usuario?.email) : null;
  const progressoRevisao = curriculoRevisao ? progressoCurriculo(curriculoRevisao) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {carregando && (
          <p className="text-sm text-slate-400 text-center py-16">
            Carregando vaga...
          </p>
        )}

        {!carregando && erro && (
          <div className="bg-white rounded-xl shadow-md text-center py-16 px-4">
            <p className="text-sm font-medium text-red-600">{erro}</p>
          </div>
        )}

        {!carregando && !erro && vaga && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* COLUNA PRINCIPAL */}
            <div className="space-y-4">
              {/* Cabeçalho da vaga */}
              <div className="bg-white rounded-xl shadow-md p-6 flex items-start gap-4">
                <div className="w-14 h-14 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center text-2xl">
                  📦
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-[#0F2C4A]">
                    {vaga.cargo}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {vaga.empresa.nomeEmpresa}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
                      Vaga aberta
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-3 py-1">
                      {vaga.tipoContrato}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      📍 {vaga.bairro}, Patos - PB
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      🕒 Publicada {tempoPublicacao(vaga.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sobre a vaga */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-sm font-bold text-[#0F2C4A] mb-3">
                  Sobre a vaga
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {vaga.descricao}
                </p>
              </div>

              {/* Responsabilidades */}
              {vaga.responsabilidades && vaga.responsabilidades.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-sm font-bold text-[#0F2C4A] mb-3">
                    Responsabilidades
                  </h2>
                  <ul className="space-y-1.5">
                    {vaga.responsabilidades.map((r, i) => (
                      <li
                        key={i}
                        className="text-sm text-slate-600 flex items-start gap-2"
                      >
                        <span className="text-slate-400 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requisitos */}
              {vaga.requisitos && vaga.requisitos.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-sm font-bold text-[#0F2C4A] mb-3">
                    Requisitos
                  </h2>
                  <ul className="space-y-1.5">
                    {vaga.requisitos.map((r, i) => (
                      <li
                        key={i}
                        className="text-sm text-slate-600 flex items-start gap-2"
                      >
                        <span className="text-slate-400 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefícios */}
              {vaga.beneficios && vaga.beneficios.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-sm font-bold text-[#0F2C4A] mb-3">
                    Benefícios
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vaga.beneficios.map((b, i) => (
                      <span
                        key={i}
                        className="text-xs text-slate-600 bg-slate-100 rounded-full px-3 py-1.5"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">
              {/* Card de salário e ação */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <p className="text-xs text-slate-400">Salário mensal</p>
                <p className="text-2xl font-bold text-[#0F2C4A] mt-0.5">
                  {formatarSalario(vaga.salario)}
                </p>

                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    📍 {vaga.endereco}, {vaga.bairro} - PB
                  </p>
                  <p className="flex items-center gap-2">🏢 Presencial</p>
                  <p className="flex items-center gap-2">
                    📄 {vaga.tipoContrato}
                  </p>
                </div>

                <button
                  onClick={abrirRevisao}
                  disabled={candidatando || carregandoFicha || jaCandidatou}
                  className="mt-5 w-full text-center text-sm font-medium text-white bg-[#0F2C4A] rounded-md px-4 py-2.5 hover:bg-[#123a63] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {jaCandidatou
                    ? "Candidatura enviada ✓"
                    : carregandoFicha
                    ? "Abrindo..."
                    : "Candidatar-se agora"}
                </button>

                {jaCandidatou && (
                  <Link href="/perfil/candidato/candidaturas" className="block text-xs text-[#1D6FA5] mt-2 text-center hover:underline">
                    Acompanhar minhas candidaturas →
                  </Link>
                )}

                {erroCandidatura && !revisaoAberta && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    {erroCandidatura}
                  </p>
                )}

                <button className="mt-2 w-full text-center text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  Salvar vaga
                </button>
              </div>

              {/* Mini-card da empresa */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center text-lg">
                    📦
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F2C4A] truncate">
                      {vaga.empresa.nomeEmpresa}
                    </p>
                    {vaga.empresa.setor && (
                      <p className="text-xs text-slate-400 truncate">
                        {vaga.empresa.setor}
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-block mt-3 text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                  {vaga.bairro}, Patos - PB
                </span>
              </div>

              {/* Mapa */}
              {vaga.latitude && vaga.longitude && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div style={{ height: 192 }}>
                    <MapaVagas
                      vagas={[vaga]}
                      vagaSelecionada={vaga.id}
                      onSelecionarVaga={() => {}}
                      mostrarLegenda={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* ─── Revisão da candidatura ─── */}
      {revisaoAberta && vaga && curriculoRevisao && (
        <div
          className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !candidatando && setRevisaoAberta(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">Você está se candidatando para</p>
            <h2 className="text-xl font-bold text-[#0F2C4A]">{vaga.cargo}</h2>
            <p className="text-sm text-slate-500">{vaga.empresa.nomeEmpresa}</p>

            {/* Currículo que será enviado */}
            <div className="mt-5 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setVerCurriculo(!verCurriculo)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-[#0F2C4A]">📄 Seu currículo</span>
                  {progressoRevisao && (
                    <span className="block text-xs text-slate-500">
                      {progressoRevisao.porcentagem}% completo
                      {progressoRevisao.faltando.length > 0 && ` · falta: ${progressoRevisao.faltando.join(", ")}`}
                    </span>
                  )}
                </span>
                <span className="text-sm text-[#1D6FA5] shrink-0">{verCurriculo ? "Ocultar" : "Ver"}</span>
              </button>
              {verCurriculo && (
                <div className="border-t border-slate-200 p-4">
                  <CurriculoVisual curriculo={curriculoRevisao} modo="candidato" />
                </div>
              )}
              <div className="border-t border-slate-200 px-4 py-2.5">
                <Link href={`/perfil/completar?redirect=/vagas/${id}`} className="text-sm font-medium text-[#1D6FA5] hover:underline">
                  ✏️ Editar currículo antes de enviar
                </Link>
              </div>
            </div>

            {/* Mensagem para a empresa */}
            <div className="mt-5">
              <label className="block text-sm font-semibold text-[#0F2C4A] mb-1">
                💬 Mensagem para a empresa <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Por que você quer esta vaga? Por que seria uma boa escolha? Uma mensagem curta faz diferença.
              </p>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value.slice(0, 1000))}
                rows={4}
                placeholder={`Ex: Moro perto e tenho experiência com atendimento. Tenho interesse na vaga de ${vaga.cargo} porque...`}
                className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] resize-y"
              />
              <p className="text-xs text-slate-400 text-right">{mensagem.length}/1000</p>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              A empresa recebe o currículo como está agora. Se você editar depois, esta candidatura não muda — mas seu telefone e e-mail ficam sempre atualizados.
            </p>

            {erroCandidatura && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-3">{erroCandidatura}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setRevisaoAberta(false)}
                disabled={candidatando}
                className="px-4 py-2.5 text-sm font-medium text-[#0F2C4A] hover:bg-slate-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={enviarCandidatura}
                disabled={candidatando}
                className="px-6 py-2.5 rounded-lg bg-[#0F2C4A] text-white font-semibold text-sm hover:bg-[#17436f] disabled:opacity-60"
              >
                {candidatando ? "Enviando..." : "Enviar candidatura"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
