"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import ListaItens, { limparLista } from "@/components/ListaItens";
import SeloPcd from "@/components/SeloPcd";
import LogoEmpresa from "@/components/LogoEmpresa";
import { useAuth } from "@/context/AuthContext";
import { verificarEmpresa, publicarVaga } from "@/lib/api";
import { formatSalario, parseSalario } from "@/lib/masks";
import { CATEGORIAS_VAGA } from "@/lib/categoriasVagas";
import { BENEFICIOS_COMUNS, OPCOES_PCD, TIPOS_CONTRATO, rotuloPcd, type OpcaoPcd } from "@/lib/opcoesVaga";
import AvisoEnderecoMapa from "@/components/AvisoEnderecoMapa";
import { useEnderecoAutomatico } from "@/lib/useEnderecoAutomatico";

const MapaSelecionarLocal = dynamic(() => import("@/components/MapaSelecionarLocal"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-400"
      style={{ height: 280 }}
    >
      Carregando mapa...
    </div>
  ),
});

const ETAPAS = ["Vaga", "Localização", "Revisão"];
const OUTRA_AREA = "__outra__";

const classeCampo =
  "w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]";

type Empresa = {
  id: string;
  nomeEmpresa: string;
  endereco: string | null;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl?: string | null;
};

function iniciais(nome?: string) {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

export default function PublicarVagaPage() {
  const router = useRouter();
  const { token, pronto } = useAuth();

  const [verificando, setVerificando] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [etapaAtual, setEtapaAtual] = useState(0);

  // Etapa 0 - Vaga
  const [cargo, setCargo] = useState("");
  const [tipoContrato, setTipoContrato] = useState<string>("CLT");
  const [areaEscolhida, setAreaEscolhida] = useState(""); // item da lista ou OUTRA_AREA
  const [areaOutra, setAreaOutra] = useState("");
  const [salario, setSalario] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsabilidades, setResponsabilidades] = useState<string[]>([""]);
  const [requisitos, setRequisitos] = useState<string[]>([""]);
  const [beneficiosMarcados, setBeneficiosMarcados] = useState<string[]>([]);
  const [beneficiosOutros, setBeneficiosOutros] = useState<string[]>([""]);
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [vagasDisponiveis, setVagasDisponiveis] = useState("1");
  const [pcd, setPcd] = useState<OpcaoPcd>("nao");

  // Etapa 1 - Localização
  const [usarNovoLocal, setUsarNovoLocal] = useState(false);
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const enderecoAuto = useEnderecoAutomatico({ endereco, setEndereco, bairro, setBairro });

  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState("");

  const area = areaEscolhida === OUTRA_AREA ? areaOutra.trim() : areaEscolhida;
  const listaResponsabilidades = limparLista(responsabilidades);
  const listaRequisitos = limparLista(requisitos);
  const listaBeneficios = limparLista([...beneficiosMarcados, ...beneficiosOutros]);

  useEffect(() => {
    if (!pronto) return; // espera ler o login salvo no navegador
    async function checar() {
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const empresaEncontrada = await verificarEmpresa(token);

        if (!empresaEncontrada) {
          router.push("/cadastrar-empresa");
          return;
        }

        setEmpresa(empresaEncontrada);
      } catch (erro) {
        console.error("Erro ao verificar empresa:", erro);
        router.push("/cadastrar-empresa");
      } finally {
        setVerificando(false);
      }
    }

    checar();
  }, [token, pronto, router]);

  // Local final da vaga (o da empresa ou um novo)
  const local = usarNovoLocal
    ? { endereco, bairro, latitude, longitude }
    : {
        endereco: empresa?.endereco ?? "",
        bairro: empresa?.bairro ?? "",
        latitude: empresa?.latitude ?? null,
        longitude: empresa?.longitude ?? null,
      };

  // Confere a etapa antes de avançar: devolve o problema ou "" se estiver tudo certo
  function problemaDaEtapa(etapa: number) {
    if (etapa === 0) {
      if (!cargo.trim()) return "Informe o cargo/título da vaga.";
      if (!area) return "Escolha a área/função da vaga.";
      if (!descricao.trim()) return "Escreva a descrição da vaga.";
      if (listaResponsabilidades.length === 0) return "Informe pelo menos uma responsabilidade.";
      const qtd = Number(vagasDisponiveis);
      if (!Number.isInteger(qtd) || qtd < 1) return "Informe quantas vagas estão disponíveis (pelo menos 1).";
    }
    if (etapa === 1) {
      if (!local.endereco?.trim() || !local.bairro?.trim()) return "Informe o endereço e o bairro da vaga.";
      if (local.latitude === null || local.longitude === null) return "Marque no mapa onde a vaga fica.";
    }
    return "";
  }

  function handleVoltar() {
    setErro("");
    setEtapaAtual((prev) => Math.max(prev - 1, 0));
  }

  function handleProximo() {
    const problema = problemaDaEtapa(etapaAtual);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro("");
    setEtapaAtual((prev) => Math.min(prev + 1, ETAPAS.length - 1));
  }

  function alternarBeneficio(b: string) {
    setBeneficiosMarcados((atual) => (atual.includes(b) ? atual.filter((x) => x !== b) : [...atual, b]));
  }

  async function handlePublicar() {
    setErro("");

    for (const etapa of [0, 1]) {
      const problema = problemaDaEtapa(etapa);
      if (problema) {
        setErro(problema);
        setEtapaAtual(etapa);
        return;
      }
    }

    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      router.push("/login");
      return;
    }

    setPublicando(true);
    try {
      await publicarVaga(token, {
        cargo: cargo.trim(),
        descricao: descricao.trim(),
        tipoContrato,
        area,
        salario: parseSalario(salario),
        endereco: local.endereco,
        bairro: local.bairro,
        latitude: local.latitude as number,
        longitude: local.longitude as number,
        requisitos: listaRequisitos,
        responsabilidades: listaResponsabilidades,
        beneficios: listaBeneficios,
        cargaHoraria: cargaHoraria.trim() || null,
        quantidadeVagas: Number(vagasDisponiveis),
        pcd,
      });

      router.push("/vagas");

    } catch (erro: any) {
      setErro(erro.message || "Erro ao publicar vaga");
    } finally {
      setPublicando(false);
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#0F2C4A]">
        <Header />
        <p className="text-white text-center pt-20">Carregando...</p>
      </div>
    );
  }

  const enderecoExibicao = local.endereco;
  const bairroExibicao = local.bairro;

  return (
    <div className="min-h-screen bg-[#0F2C4A]">
      <Header />
      <main className="max-w-5xl mx-auto pt-10 pb-16 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Coluna principal */}
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h1 className="text-xl font-bold text-[#0F2C4A] mb-1">Publicar nova vaga</h1>
            <p className="text-sm text-slate-500 mb-6">
              Preencha os dados abaixo para sua vaga ficar visível no mapa da cidade.
            </p>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {erro}
              </p>
            )}

            {/* Stepper */}
            <div className="flex items-center mb-8">
              {ETAPAS.map((etapa, index) => {
                const concluida = index < etapaAtual;
                const ativa = index === etapaAtual;
                return (
                  <div key={etapa} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                          ${concluida ? "bg-[#1D6FA5] text-white" : ""}
                          ${ativa ? "bg-[#0F2C4A] text-white" : ""}
                          ${!concluida && !ativa ? "bg-slate-200 text-slate-400" : ""}
                        `}
                      >
                        {concluida ? "✓" : index + 1}
                      </div>
                      <span
                        className={`text-xs whitespace-nowrap ${
                          ativa ? "text-[#0F2C4A] font-medium" : "text-slate-400"
                        }`}
                      >
                        {etapa}
                      </span>
                    </div>
                    {index < ETAPAS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          index < etapaAtual ? "bg-[#1D6FA5]" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ETAPA 0 - VAGA */}
            {etapaAtual === 0 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Cargo/título da vaga *</label>
                  <input
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Vendedor externo"
                    maxLength={120}
                    className={classeCampo}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Tipo de contrato *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TIPOS_CONTRATO.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setTipoContrato(tipo)}
                        className={`rounded-md border px-3 py-3 text-sm font-medium transition-colors ${
                          tipoContrato === tipo
                            ? "border-[#0F2C4A] bg-[#0F2C4A]/5 text-[#0F2C4A]"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Área / função *</label>
                    <select value={areaEscolhida} onChange={(e) => setAreaEscolhida(e.target.value)} className={classeCampo}>
                      <option value="">Selecione...</option>
                      {CATEGORIAS_VAGA.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value={OUTRA_AREA}>Outra (escrever)</option>
                    </select>
                    {areaEscolhida === OUTRA_AREA && (
                      <input
                        value={areaOutra}
                        onChange={(e) => setAreaOutra(e.target.value)}
                        placeholder="Ex: Auxiliar administrativo"
                        maxLength={100}
                        className={`${classeCampo} mt-2`}
                      />
                    )}
                    <p className="text-xs text-slate-400 mt-1">É por aqui que o candidato filtra as vagas.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Salário</label>
                    <input
                      value={salario}
                      onChange={(e) => setSalario(formatSalario(e.target.value))}
                      placeholder="R$ 0,00"
                      className={classeCampo}
                    />
                    <p className="text-xs text-slate-400 mt-1">Deixe em branco para &quot;a combinar&quot;.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Descrição da vaga *</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    maxLength={5000}
                    placeholder="Ex: o funcionário deverá buscar novas oportunidades para comércios, tal qual negociar vendas frutíferas quando necessário."
                    className={`${classeCampo} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Responsabilidades *</label>
                  <ListaItens
                    itens={responsabilidades}
                    aoMudar={setResponsabilidades}
                    placeholder="Ex: Repor mercadorias nas prateleiras"
                    textoAdicionar="Adicionar responsabilidade"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-2">
                    Requisitos <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <ListaItens
                    itens={requisitos}
                    aoMudar={setRequisitos}
                    placeholder="Ex: Ensino médio completo"
                    textoAdicionar="Adicionar requisito"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-2">
                    Benefícios <span className="text-xs text-slate-400 font-normal">(toque para marcar)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {BENEFICIOS_COMUNS.map((b) => {
                      const marcado = beneficiosMarcados.includes(b);
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => alternarBeneficio(b)}
                          aria-pressed={marcado}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            marcado
                              ? "bg-[#F0A93C] border-[#F0A93C] text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {marcado && <Check className="w-3.5 h-3.5" />}
                          {b}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Outros benefícios:</p>
                  <ListaItens
                    itens={beneficiosOutros}
                    aoMudar={setBeneficiosOutros}
                    placeholder="Ex: Cesta básica"
                    textoAdicionar="Adicionar outro benefício"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Carga horária</label>
                    <input
                      value={cargaHoraria}
                      onChange={(e) => setCargaHoraria(e.target.value)}
                      placeholder="Ex: Seg a sáb, 8h às 17h"
                      maxLength={80}
                      className={classeCampo}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Vagas disponíveis *</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={vagasDisponiveis}
                      onChange={(e) => setVagasDisponiveis(e.target.value)}
                      className={classeCampo}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                    Vaga para pessoas com deficiência (PcD)?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {OPCOES_PCD.map((op) => (
                      <button
                        key={op.valor}
                        type="button"
                        onClick={() => setPcd(op.valor)}
                        aria-pressed={pcd === op.valor}
                        className={`text-left rounded-md border px-3 py-3 transition-colors ${
                          pcd === op.valor
                            ? "border-[#1D6FA5] bg-[#1D6FA5]/5"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <p className={`text-sm font-medium ${pcd === op.valor ? "text-[#1D6FA5]" : "text-slate-600"}`}>
                          {op.rotulo}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{op.explicacao}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 1 - LOCALIZAÇÃO */}
            {etapaAtual === 1 && (
              <div className="space-y-4">
                {!usarNovoLocal ? (
                  <>
                    <div>
                      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                        Endereço da vaga *
                      </label>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-1">
                        {empresa?.endereco ? (
                          <>
                            <p className="text-sm font-medium text-[#0F2C4A]">{empresa.endereco}</p>
                            {empresa.bairro && (
                              <p className="text-xs text-slate-500">{empresa.bairro}</p>
                            )}
                            {empresa.latitude !== null && empresa.longitude !== null && (
                              <p className="text-xs text-slate-500">
                                {empresa.latitude?.toFixed(5)}, {empresa.longitude?.toFixed(5)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Sua empresa ainda não tem um endereço cadastrado.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUsarNovoLocal(true)}
                      className="text-sm font-medium text-[#1D6FA5] hover:underline"
                    >
                      + Adicionar nova localização
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm text-[#0F2C4A] font-medium">Nova localização *</label>
                      {empresa?.endereco && (
                        <button
                          type="button"
                          onClick={() => setUsarNovoLocal(false)}
                          className="text-xs font-medium text-slate-500 hover:underline"
                        >
                          Usar endereço da empresa
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Endereço *</label>
                      <input
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua Presidente Petrônio Portela, 12 - Centro"
                        className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Bairro *</label>
                      <input
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Centro"
                        className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                        Localização no mapa *
                      </label>
                      <p className="text-xs text-slate-500 mb-2">
                        Clique no mapa no ponto exato onde a vaga fica. O endereço e o bairro são preenchidos sozinhos.
                      </p>
                      <MapaSelecionarLocal
                        latitude={latitude}
                        longitude={longitude}
                        onSelecionar={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                          enderecoAuto.aoMarcarPonto(lat, lng);
                        }}
                      />
                      <AvisoEnderecoMapa estado={enderecoAuto.estado} usarSugestao={enderecoAuto.usarSugestao} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ETAPA 2 - REVISÃO */}
            {etapaAtual === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Confira tudo antes de publicar. Para corrigir, use &quot;← Voltar&quot;.</p>
                <CampoRevisao label="Cargo/título da vaga" valor={cargo} />

                <div className="grid grid-cols-2 gap-4">
                  <CampoRevisao label="Tipo de contrato" valor={tipoContrato} />
                  <CampoRevisao label="Área / função" valor={area} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CampoRevisao label="Salário" valor={salario || "A combinar"} />
                  <CampoRevisao label="Vagas disponíveis" valor={vagasDisponiveis} />
                </div>

                <CampoRevisao label="Descrição da vaga" valor={descricao} textarea />
                <ListaRevisao label="Responsabilidades" itens={listaResponsabilidades} />
                <ListaRevisao label="Requisitos" itens={listaRequisitos} vazio="Nenhum requisito informado" />
                <ListaRevisao label="Benefícios" itens={listaBeneficios} vazio="Nenhum benefício informado" />

                <div className="grid grid-cols-2 gap-4">
                  <CampoRevisao label="Carga horária" valor={cargaHoraria || "Não informada"} />
                  <CampoRevisao label="Vaga PcD" valor={rotuloPcd(pcd) || "Não"} />
                </div>

                <CampoRevisao label="Endereço" valor={enderecoExibicao || ""} />
                <CampoRevisao label="Bairro" valor={bairroExibicao || ""} />
              </div>
            )}

            {/* Ações */}
            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-8 -mb-4">
                {erro}
              </p>
            )}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handleVoltar}
                disabled={etapaAtual === 0}
                className="text-sm font-medium text-[#0F2C4A] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Voltar
              </button>

              {etapaAtual < ETAPAS.length - 1 ? (
                <button
                  onClick={handleProximo}
                  className="rounded-md bg-[#0F2C4A] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#123a63] transition-colors"
                >
                  Próximo: {ETAPAS[etapaAtual + 1]} →
                </button>
              ) : (
                <button
                  onClick={handlePublicar}
                  disabled={publicando}
                  className="rounded-md bg-[#F0A93C] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {publicando ? "Publicando..." : "Publicar Vaga"}
                </button>
              )}
            </div>
          </div>

          {/* Coluna lateral - Prévia da vaga */}
          <div className="bg-[#0F2C4A] rounded-xl shadow-xl p-5 h-fit border border-[#1D6FA5]/30">
            <h2 className="text-white text-sm font-semibold mb-4">Prévia da vaga</h2>

            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start gap-3">
                <LogoEmpresa
                  logoUrl={empresa?.logoUrl}
                  nome={empresa?.nomeEmpresa || ""}
                  className="w-9 h-9 rounded-md"
                  semLogo={
                    <div className="w-9 h-9 rounded-md bg-[#F0A93C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {iniciais(empresa?.nomeEmpresa)}
                    </div>
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-[#0F2C4A]">{cargo || "Cargo"}</p>
                  <p className="text-xs text-slate-500">{empresa?.nomeEmpresa || "Sua empresa"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600">
                <span className="bg-slate-100 rounded px-2 py-0.5">{tipoContrato}</span>
                {area && <span className="bg-slate-100 rounded px-2 py-0.5">{area}</span>}
                <SeloPcd pcd={pcd} pequeno />
              </div>
              <p className="text-sm font-semibold text-[#0F2C4A] mt-2">
                {salario ? `Salário: ${salario}` : "Salário a combinar"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {bairroExibicao || enderecoExibicao || "Local: ?"}
                {Number(vagasDisponiveis) > 1 && ` · ${vagasDisponiveis} vagas`}
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function CampoRevisao({
  label,
  valor,
  textarea = false,
}: {
  label: string;
  valor: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">{label}</label>
      {textarea ? (
        <textarea
          value={valor}
          readOnly
          rows={3}
          className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-700 resize-none cursor-default"
        />
      ) : (
        <input
          value={valor}
          readOnly
          className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-gray-700 cursor-default"
        />
      )}
    </div>
  );
}

function ListaRevisao({ label, itens, vazio = "—" }: { label: string; itens: string[]; vazio?: string }) {
  return (
    <div>
      <label className="block text-sm text-[#0F2C4A] font-medium mb-1">{label}</label>
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
        {itens.length ? (
          <ul className="space-y-1">
            {itens.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-[#F0A93C] mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">{vazio}</p>
        )}
      </div>
    </div>
  );
}
