"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import {
  tornarCandidato,
  atualizarMinhaFicha,
  buscarMinhaFicha,
  type DadosExperiencia,
} from "@/lib/api";
import { formatTelefone, formatSalario, parseSalario } from "@/lib/masks";
import { buscarSugestoesHabilidade } from "@/lib/habilidadesCatalogo";

const NIVEIS_ESCOLARIDADE = [
  "Ensino Fundamental incompleto",
  "Ensino Fundamental completo",
  "Ensino Médio incompleto",
  "Ensino Médio completo",
  "Ensino Técnico",
  "Ensino Superior incompleto",
  "Ensino Superior completo",
  "Pós-graduação",
];

function formatCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatSalarioDeNumero(numero: number | null | undefined) {
  if (numero === null || numero === undefined) return "";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CompletarPerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, usuario } = useAuth();
  const redirect = searchParams.get("redirect");

  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);

  // ── Etapa 1: Dados Pessoais ──────────────────────────────────────────────
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [possuiCnh, setPossuiCnh] = useState<boolean | null>(null);
  const [categoriaCnh, setCategoriaCnh] = useState("");
  const [possuiVeiculo, setPossuiVeiculo] = useState<boolean | null>(null);

  // ── Etapa 2: Formações e cursos ──────────────────────────────────────────
  const [nivelEscolaridade, setNivelEscolaridade] = useState("");
  const [instituicaoFormacao, setInstituicaoFormacao] = useState("");
  const [anoInicioFormacao, setAnoInicioFormacao] = useState("");
  const [anoConclusaoFormacao, setAnoConclusaoFormacao] = useState("");

  const [nomeCurso, setNomeCurso] = useState("");
  const [cargaHorariaCurso, setCargaHorariaCurso] = useState("");
  const [instituicaoCurso, setInstituicaoCurso] = useState("");
  const [anoConclusaoCurso, setAnoConclusaoCurso] = useState("");

  // ── Etapa 3: Objetivo, habilidades e experiência ─────────────────────────
  const [cargoDesejado, setCargoDesejado] = useState("");
  const [areaInteresse, setAreaInteresse] = useState("");
  const [pretensaoSalarial, setPretensaoSalarial] = useState("");

  const [habilidadeDigitada, setHabilidadeDigitada] = useState("");
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [diferencial, setDiferencial] = useState("");

  const [experiencias, setExperiencias] = useState<DadosExperiencia[]>([]);

  const sugestoesHabilidade = buscarSugestoesHabilidade(
    habilidadeDigitada,
    habilidades
  );

  useEffect(() => {
    async function carregarSeExistir() {
      if (!token) {
        setCarregandoInicial(false);
        return;
      }

      try {
        const dados = await buscarMinhaFicha(token);

        if (dados) {
          setModoEdicao(true);

          setTelefone(dados.telefone ? formatTelefone(dados.telefone) : "");
          setCpf(dados.cpf ? formatCPF(dados.cpf) : "");

          if (dados.dataNascimento) {
            const data = new Date(dados.dataNascimento);
            if (!Number.isNaN(data.getTime())) {
              setDataNascimento(data.toISOString().split("T")[0]);
            }
          }

          setFotoUrl(dados.fotoUrl || "");
          setPossuiCnh(dados.possuiCnh ?? null);
          setCategoriaCnh(dados.categoriaCnh || "");
          setPossuiVeiculo(dados.possuiVeiculo ?? null);
          setCargoDesejado(dados.cargoDesejado || "");
          setAreaInteresse(dados.areaInteresse || "");
          setPretensaoSalarial(formatSalarioDeNumero(dados.pretensaoSalarial));
          setDiferencial(dados.diferencial || "");
          setHabilidades(dados.habilidades || []);

          const formacao = dados.formacoes?.[0];
          if (formacao) {
            setNivelEscolaridade(formacao.nivelEscolaridade || "");
            setInstituicaoFormacao(formacao.instituicao || "");
            setAnoInicioFormacao(formacao.anoInicio ? String(formacao.anoInicio) : "");
            setAnoConclusaoFormacao(formacao.anoConclusao ? String(formacao.anoConclusao) : "");
          }

          const curso = dados.cursos?.[0];
          if (curso) {
            setNomeCurso(curso.nomeCurso || "");
            setCargaHorariaCurso(curso.cargaHoraria || "");
            setInstituicaoCurso(curso.instituicao || "");
            setAnoConclusaoCurso(curso.anoConclusao ? String(curso.anoConclusao) : "");
          }

          if (dados.experiencias && dados.experiencias.length > 0) {
            setExperiencias(
              dados.experiencias.map((exp) => ({
                cargo: exp.cargo,
                empresa: exp.empresa,
                dataInicio: exp.dataInicio ? exp.dataInicio.split("T")[0] : "",
                dataFim: exp.dataFim ? exp.dataFim.split("T")[0] : "",
                atual: exp.atual || false,
                descricao: exp.descricao || "",
              }))
            );
          }
        }
      } catch {
        // se der erro ao buscar, segue como cadastro novo — sem travar o usuário
      } finally {
        setCarregandoInicial(false);
      }
    }

    carregarSeExistir();
  }, [token]);

  function adicionarHabilidade(valor: string) {
    const nova = valor.trim();
    if (!nova) return;

    const jaExiste = habilidades.some(
      (item) => item.toLowerCase() === nova.toLowerCase()
    );
    if (jaExiste) {
      setHabilidadeDigitada("");
      return;
    }

    setHabilidades([...habilidades, nova]);
    setHabilidadeDigitada("");
  }

  function removerHabilidade(alvo: string) {
    setHabilidades(habilidades.filter((item) => item !== alvo));
  }

  function handleHabilidadeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarHabilidade(habilidadeDigitada);
    }
  }

  function adicionarExperiencia() {
    setExperiencias([
      ...experiencias,
      { cargo: "", empresa: "", dataInicio: "", dataFim: "", atual: false, descricao: "" },
    ]);
  }

  function atualizarExperiencia(indice: number, campo: keyof DadosExperiencia, valor: any) {
    setExperiencias((prev) =>
      prev.map((exp, i) => (i === indice ? { ...exp, [campo]: valor } : exp))
    );
  }

  function removerExperiencia(indice: number) {
    setExperiencias((prev) => prev.filter((_, i) => i !== indice));
  }

  function validarEtapa1() {
    if (!dataNascimento) {
      setErro("Informe sua data de nascimento.");
      return false;
    }
    if (!telefone) {
      setErro("Informe um telefone de contato.");
      return false;
    }
    if (cpf && cpf.replace(/\D/g, "").length !== 11) {
      setErro("Digite um CPF válido, ou deixe em branco.");
      return false;
    }
    return true;
  }

  function irParaProximaEtapa() {
    setErro("");

    if (etapa === 1) {
      if (!validarEtapa1()) return;
      setEtapa(2);
      return;
    }

    if (etapa === 2) {
      setEtapa(3);
      return;
    }
  }

  function voltarEtapa() {
    setErro("");
    if (etapa === 1) {
      router.back();
      return;
    }
    setEtapa((etapaAtual) => (etapaAtual - 1) as 1 | 2);
  }

  async function finalizar() {
    setErro("");

    if (habilidades.length === 0) {
      setErro("Adicione pelo menos uma habilidade.");
      return;
    }

    if (!token) {
      setErro("Você precisa estar logado para completar seu perfil.");
      router.push("/login");
      return;
    }

    setSalvando(true);

    try {
      const dadosParaEnviar = {
        telefone,
        cpf,
        dataNascimento,
        habilidades,
        fotoUrl: fotoUrl || undefined,
        possuiCnh: possuiCnh ?? undefined,
        categoriaCnh: categoriaCnh || undefined,
        possuiVeiculo: possuiVeiculo ?? undefined,
        cargoDesejado: cargoDesejado || undefined,
        areaInteresse: areaInteresse || undefined,
        pretensaoSalarial: parseSalario(pretensaoSalarial),
        diferencial: diferencial || undefined,
        formacoes:
          nivelEscolaridade || instituicaoFormacao
            ? [
                {
                  nivelEscolaridade,
                  instituicao: instituicaoFormacao,
                  anoInicio: anoInicioFormacao ? Number(anoInicioFormacao) : null,
                  anoConclusao: anoConclusaoFormacao ? Number(anoConclusaoFormacao) : null,
                },
              ]
            : undefined,
        cursos:
          nomeCurso
            ? [
                {
                  nomeCurso,
                  cargaHoraria: cargaHorariaCurso || undefined,
                  instituicao: instituicaoCurso || undefined,
                  anoConclusao: anoConclusaoCurso ? Number(anoConclusaoCurso) : null,
                },
              ]
            : undefined,
        experiencias: experiencias.length > 0 ? experiencias : undefined,
      };

      if (modoEdicao) {
        await atualizarMinhaFicha(token, dadosParaEnviar);
      } else {
        await tornarCandidato(token, dadosParaEnviar);
      }

      router.push(redirect || "/perfil/candidato");
    } catch (erroCapturado: any) {
      setErro(erroCapturado.message || "Não foi possível salvar seu perfil.");
    } finally {
      setSalvando(false);
    }
  }

  const etapas = [
    { numero: 1, titulo: "Dados Pessoais" },
    { numero: 2, titulo: "Formações" },
    { numero: 3, titulo: "Objetivo" },
  ] as const;

  if (carregandoInicial) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            Carregando...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[#0F2C4A]">
            {modoEdicao ? "Editar currículo" : "Cadastrar novo currículo"}
          </h1>

          {/* Indicador de etapas */}
          <div className="flex items-center gap-3 mt-6 mb-8">
            {etapas.map((item, indice) => (
              <div key={item.numero} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      etapa > item.numero
                        ? "bg-green-500 text-white"
                        : etapa === item.numero
                        ? "bg-[#0F2C4A] text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {etapa > item.numero ? "✓" : item.numero}
                  </div>
                  <span
                    className={`text-sm ${
                      etapa >= item.numero ? "text-[#0F2C4A]" : "text-slate-400"
                    }`}
                  >
                    {item.titulo}
                  </span>
                </div>
                {indice < etapas.length - 1 && (
                  <div className="w-10 h-px bg-slate-300" />
                )}
              </div>
            ))}
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-5">
              {erro}
            </p>
          )}

          {/* ─── ETAPA 1 ─── */}
          {etapa === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">Dados Pessoais</h2>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Nome completo
                    </label>
                    <input
                      value={usuario?.nome || ""}
                      disabled
                      className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Data de nascimento
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      CPF <span className="text-slate-400 font-normal">- opcional</span>
                    </label>
                    <input
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      E-mail
                    </label>
                    <input
                      value={usuario?.email || ""}
                      disabled
                      className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Telefone
                    </label>
                    <input
                      value={telefone}
                      onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                      placeholder="Ex: 83 999999999"
                      maxLength={15}
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">Foto do Candidato</h2>

                <input
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="Cole o link de uma foto sua (opcional)"
                  className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                />
                <p className="text-xs text-slate-400 mt-2">
                  O upload direto de arquivo ainda não está disponível — por
                  enquanto, use um link de foto (ex: de uma rede social pública).
                </p>
              </div>

              <hr className="border-slate-200" />

              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">
                  Informações adicionais
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-[#0F2C4A] font-medium mb-2">Possui CNH?</p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="possuiCnh"
                          checked={possuiCnh === true}
                          onChange={() => setPossuiCnh(true)}
                        />
                        Sim
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="possuiCnh"
                          checked={possuiCnh === false}
                          onChange={() => { setPossuiCnh(false); setCategoriaCnh(""); }}
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-[#0F2C4A] font-medium mb-2">Possui veículo?</p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="possuiVeiculo"
                          checked={possuiVeiculo === true}
                          onChange={() => setPossuiVeiculo(true)}
                        />
                        Sim
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="possuiVeiculo"
                          checked={possuiVeiculo === false}
                          onChange={() => setPossuiVeiculo(false)}
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-2">
                      Categoria da CNH
                    </label>
                    <input
                      value={categoriaCnh}
                      onChange={(e) => setCategoriaCnh(e.target.value)}
                      disabled={possuiCnh !== true}
                      placeholder="Ex: AB"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ETAPA 2 ─── */}
          {etapa === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">Formação escolar</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Nível de escolaridade
                    </label>
                    <select
                      value={nivelEscolaridade}
                      onChange={(e) => setNivelEscolaridade(e.target.value)}
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    >
                      <option value="">Selecione...</option>
                      {NIVEIS_ESCOLARIDADE.map((nivel) => (
                        <option key={nivel} value={nivel}>{nivel}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Nome da instituição
                    </label>
                    <input
                      value={instituicaoFormacao}
                      onChange={(e) => setInstituicaoFormacao(e.target.value)}
                      placeholder="Ex: Josefa Olindina"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Ano de início
                    </label>
                    <input
                      type="number"
                      value={anoInicioFormacao}
                      onChange={(e) => setAnoInicioFormacao(e.target.value)}
                      placeholder="1999"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Ano de conclusão
                    </label>
                    <input
                      type="number"
                      value={anoConclusaoFormacao}
                      onChange={(e) => setAnoConclusaoFormacao(e.target.value)}
                      placeholder="1999"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">Cursos e qualificações</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Nome do curso
                    </label>
                    <input
                      value={nomeCurso}
                      onChange={(e) => setNomeCurso(e.target.value)}
                      placeholder="Ex: Ciências da computação"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Carga horária
                    </label>
                    <input
                      value={cargaHorariaCurso}
                      onChange={(e) => setCargaHorariaCurso(e.target.value)}
                      placeholder="Ex: 3 horas"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Instituição
                    </label>
                    <input
                      value={instituicaoCurso}
                      onChange={(e) => setInstituicaoCurso(e.target.value)}
                      placeholder="Ex: UEPB - Patos"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Ano de conclusão
                    </label>
                    <input
                      type="number"
                      value={anoConclusaoCurso}
                      onChange={(e) => setAnoConclusaoCurso(e.target.value)}
                      placeholder="2028"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── ETAPA 3 ─── */}
          {etapa === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">Objetivo profissional</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Cargo desejado
                    </label>
                    <input
                      value={cargoDesejado}
                      onChange={(e) => setCargoDesejado(e.target.value)}
                      placeholder="Ex: Operador de caixa"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                      Área de interesse
                    </label>
                    <input
                      value={areaInteresse}
                      onChange={(e) => setAreaInteresse(e.target.value)}
                      placeholder="Ex: Atendimento ao público"
                      className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                </div>

                <div className="mt-4 max-w-xs">
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                    Pretensão salarial
                  </label>
                  <input
                    value={pretensaoSalarial}
                    onChange={(e) => setPretensaoSalarial(formatSalario(e.target.value))}
                    placeholder="R$ 1.640,00"
                    className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <h2 className="text-lg font-bold text-[#0F2C4A] mb-4">Habilidades</h2>

                <p className="text-xs text-slate-500 mb-2">
                  Digite uma habilidade — sugestões vão aparecer conforme você
                  escreve. Pressione Enter ou clique na sugestão pra adicionar.
                </p>

                <div className="relative">
                  <input
                    value={habilidadeDigitada}
                    onChange={(e) => setHabilidadeDigitada(e.target.value)}
                    onKeyDown={handleHabilidadeKeyDown}
                    placeholder="Ex: Python, Excel, Proatividade..."
                    className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                  />

                  {sugestoesHabilidade.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                      {sugestoesHabilidade.map((sugestao) => (
                        <button
                          type="button"
                          key={sugestao}
                          onClick={() => adicionarHabilidade(sugestao)}
                          className="w-full text-left px-3 py-2 text-sm text-[#0F2C4A] hover:bg-blue-50"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {habilidades.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {habilidades.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-[#0F2C4A] text-sm font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removerHabilidade(item)}
                          className="text-[#0F2C4A] hover:text-red-600 font-bold"
                          aria-label={`Remover ${item}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-sm">
                      Nenhuma habilidade adicionada
                    </span>
                  </div>
                )}

                <div className="mt-4 max-w-md">
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                    Diferencial
                  </label>
                  <input
                    value={diferencial}
                    onChange={(e) => setDiferencial(e.target.value)}
                    placeholder="Algo que te destaca de outros candidatos"
                    className="w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                  />
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-[#0F2C4A]">Experiência profissional</h2>
                  <button
                    type="button"
                    onClick={adicionarExperiencia}
                    className="w-7 h-7 rounded-md bg-[#F0A93C] text-white font-bold flex items-center justify-center hover:bg-[#dd9a30]"
                    aria-label="Adicionar experiência"
                  >
                    +
                  </button>
                </div>

                {experiencias.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Nenhuma experiência adicionada ainda.
                  </p>
                )}

                <div className="space-y-4">
                  {experiencias.map((exp, indice) => (
                    <div
                      key={indice}
                      className="border border-slate-200 rounded-lg p-4 bg-white space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-[#0F2C4A]">
                          Experiência {indice + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removerExperiencia(indice)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        <input
                          value={exp.cargo}
                          onChange={(e) => atualizarExperiencia(indice, "cargo", e.target.value)}
                          placeholder="Cargo"
                          className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                        />
                        <input
                          value={exp.empresa}
                          onChange={(e) => atualizarExperiencia(indice, "empresa", e.target.value)}
                          placeholder="Empresa"
                          className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                        />
                        <input
                          type="date"
                          value={exp.dataInicio || ""}
                          onChange={(e) => atualizarExperiencia(indice, "dataInicio", e.target.value)}
                          className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                        />
                        <input
                          type="date"
                          value={exp.dataFim || ""}
                          disabled={!!exp.atual}
                          onChange={(e) => atualizarExperiencia(indice, "dataFim", e.target.value)}
                          className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] disabled:bg-slate-100"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!exp.atual}
                          onChange={(e) => atualizarExperiencia(indice, "atual", e.target.checked)}
                        />
                        Trabalho atual
                      </label>

                      <textarea
                        value={exp.descricao || ""}
                        onChange={(e) => atualizarExperiencia(indice, "descricao", e.target.value)}
                        placeholder="Descreva brevemente suas atividades"
                        rows={2}
                        className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={voltarEtapa}
              className="px-4 py-2.5 text-sm font-medium text-[#0F2C4A] hover:bg-slate-100 rounded-md transition-colors"
            >
              ← Voltar
            </button>

            {etapa < 3 ? (
              <button
                type="button"
                onClick={irParaProximaEtapa}
                className="px-6 py-2.5 rounded-lg bg-[#0F2C4A] text-white font-semibold text-sm hover:bg-[#17436f] transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="button"
                onClick={finalizar}
                disabled={salvando}
                className="px-6 py-2.5 rounded-lg bg-[#0F2C4A] text-white font-semibold text-sm hover:bg-[#17436f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {salvando ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Finalizar →"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
