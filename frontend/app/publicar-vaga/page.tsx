"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { verificarEmpresa, publicarVaga } from "@/lib/api";
import { formatSalario, parseSalario } from "@/lib/masks";

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
const TIPOS_CONTRATO = ["CLT", "PJ / Freelance", "Temporário"];

type Empresa = {
  id: string;
  nomeEmpresa: string;
  endereco: string | null;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function PublicarVagaPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [verificando, setVerificando] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [etapaAtual, setEtapaAtual] = useState(0);

  // Etapa 0 - Vaga
  const [cargo, setCargo] = useState("");
  const [tipoContrato, setTipoContrato] = useState("CLT");
  const [area, setArea] = useState("");
  const [salario, setSalario] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsabilidades, setResponsabilidades] = useState("");
  const [beneficios, setBeneficios] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [vagasDisponiveis, setVagasDisponiveis] = useState("1");

  // Etapa 1 - Localização
  const [usarNovoLocal, setUsarNovoLocal] = useState(false);
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
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
  }, [token, router]);

  function handleVoltar() {
    setEtapaAtual((prev) => Math.max(prev - 1, 0));
  }

  function handleProximo() {
    setEtapaAtual((prev) => Math.min(prev + 1, ETAPAS.length - 1));
  }

  async function handlePublicar() {
    setErro("");

    const enderecoFinal = usarNovoLocal ? endereco : empresa?.endereco ?? "";
    const bairroFinal = usarNovoLocal ? bairro : empresa?.bairro ?? "";
    const latitudeFinal = usarNovoLocal ? latitude : empresa?.latitude ?? null;
    const longitudeFinal = usarNovoLocal ? longitude : empresa?.longitude ?? null;

    if (!cargo || !tipoContrato || !area || !descricao || !responsabilidades.trim()) {
      setErro("Preencha todos os campos obrigatórios da vaga.");
      return;
    }

    if (!enderecoFinal || !bairroFinal || latitudeFinal === null || longitudeFinal === null) {
      setErro("Selecione uma localização válida para a vaga.");
      return;
    }

    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      router.push("/login");
      return;
    }

    setPublicando(true);
    try {
      await publicarVaga(token, {
        cargo,
        descricao,
        tipoContrato,
        area,
        salario: parseSalario(salario),
        endereco: enderecoFinal,
        bairro: bairroFinal,
        latitude: latitudeFinal,
        longitude: longitudeFinal,
        requisitos: [],
        responsabilidades: responsabilidades
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        beneficios: beneficios
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
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

  const enderecoExibicao = usarNovoLocal ? endereco : empresa?.endereco;
  const bairroExibicao = usarNovoLocal ? bairro : empresa?.bairro;

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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Cargo/título da vaga *</label>
                  <input
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Vendedor externo"
                    className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Tipo de contrato *</label>
                  <div className="grid grid-cols-3 gap-3">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Área *</label>
                    <input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Comércio"
                      className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Salário</label>
                    <input
                      value={salario}
                      onChange={(e) => setSalario(formatSalario(e.target.value))}
                      placeholder="R$ 0,00"
                      className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Descrição da vaga *</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    placeholder="Ex: o funcionário deverá buscar novas oportunidades para comércios, tal qual negociar vendas frutíferas quando necessário."
                    className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                    Responsabilidades * <span className="text-xs text-slate-400 font-normal">(uma por linha)</span>
                  </label>
                  <textarea
                    value={responsabilidades}
                    onChange={(e) => setResponsabilidades(e.target.value)}
                    rows={4}
                    placeholder={"Repor mercadorias nas prateleiras\nConferir a validade dos produtos"}
                    className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                    Benefícios <span className="text-xs text-slate-400 font-normal">(um por linha)</span>
                  </label>
                  <textarea
                    value={beneficios}
                    onChange={(e) => setBeneficios(e.target.value)}
                    rows={3}
                    placeholder={"Desconto em compras no mercado\nCarga horária 44h/sem"}
                    className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Carga horária</label>
                    <input
                      value={cargaHoraria}
                      onChange={(e) => setCargaHoraria(e.target.value)}
                      placeholder="Sob demanda"
                      className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Vagas disponíveis</label>
                    <input
                      type="number"
                      min={1}
                      value={vagasDisponiveis}
                      onChange={(e) => setVagasDisponiveis(e.target.value)}
                      className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                    />
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
                        Clique no mapa no ponto exato onde a vaga fica.
                      </p>
                      <MapaSelecionarLocal
                        latitude={latitude}
                        longitude={longitude}
                        onSelecionar={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ETAPA 2 - REVISÃO */}
            {etapaAtual === 2 && (
              <div className="space-y-4">
                <CampoRevisao label="Cargo/título da vaga" valor={cargo} />
                <CampoRevisao label="Tipo de contrato" valor={tipoContrato} />

                <div className="grid grid-cols-2 gap-4">
                  <CampoRevisao label="Área" valor={area} />
                  <CampoRevisao label="Salário" valor={salario} />
                </div>

                <CampoRevisao label="Descrição da vaga" valor={descricao} textarea />
                <CampoRevisao label="Responsabilidades" valor={responsabilidades} textarea />
                <CampoRevisao label="Benefícios" valor={beneficios} textarea />

                <div className="grid grid-cols-2 gap-4">
                  <CampoRevisao label="Carga horária" valor={cargaHoraria} />
                  <CampoRevisao label="Vagas disponíveis" valor={vagasDisponiveis} />
                </div>

                <CampoRevisao label="Endereço" valor={enderecoExibicao || ""} />
                <CampoRevisao label="Bairro" valor={bairroExibicao || ""} />
              </div>
            )}

            {/* Ações */}
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
                <div className="w-9 h-9 rounded-md bg-[#F0A93C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  EP
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F2C4A]">{cargo || "Cargo"}</p>
                  <p className="text-xs text-slate-500">{empresa?.nomeEmpresa || "Sua empresa"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                <span className="bg-slate-100 rounded px-2 py-0.5">{tipoContrato}</span>
                {area && <span className="bg-slate-100 rounded px-2 py-0.5">{area}</span>}
              </div>
              {salario && (
                <p className="text-sm font-semibold text-[#0F2C4A] mt-2">Salário: {salario}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {bairroExibicao || enderecoExibicao || "Local: ?"}
              </p>
            </div>

            {etapaAtual === 0 && salario && (
              <div className="bg-yellow-300/90 rounded-lg mt-4 p-3">
                <p className="text-[#0F2C4A] text-xs font-medium">
                  Essa vaga com salário intermediário recebe 3x mais candidatos em média
                </p>
              </div>
            )}

            <div className="bg-white/10 rounded-lg mt-4 p-3 text-center">
              <p className="text-white text-sm font-semibold">~15</p>
              <p className="text-white/70 text-xs">candidatos ao redor · Patos</p>
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