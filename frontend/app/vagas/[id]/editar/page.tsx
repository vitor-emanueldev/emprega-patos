"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import ListaItens, { limparLista } from "@/components/ListaItens";
import { useAuth } from "@/context/AuthContext";
import { detalhesVaga, atualizarVaga } from "@/lib/api";
import { formatSalario, parseSalario } from "@/lib/masks";
import { CATEGORIAS_VAGA } from "@/lib/categoriasVagas";
import { BENEFICIOS_COMUNS, OPCOES_PCD, TIPOS_CONTRATO, rotuloValor, type Modalidade, type OpcaoPcd } from "@/lib/opcoesVaga";
import EscolhaModalidade from "@/components/EscolhaModalidade";
import AvisoEnderecoMapa from "@/components/AvisoEnderecoMapa";
import { useEnderecoAutomatico } from "@/lib/useEnderecoAutomatico";

const MapaSelecionarLocal = dynamic(() => import("@/components/MapaSelecionarLocal"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-400" style={{ height: 280 }}>
      Carregando mapa...
    </div>
  ),
});


const classeCampo =
  "w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]";

const STATUS = [
  { valor: "aberta", rotulo: "Aberta", explicacao: "Aparece no site e recebe candidaturas." },
  { valor: "pausada", rotulo: "Pausada", explicacao: "Sai do site por um tempo. Dá para reabrir depois." },
  { valor: "encerrada", rotulo: "Encerrada", explicacao: "Vaga preenchida ou cancelada. Sai do site." },
];

export default function EditarVagaPage() {
  const router = useRouter();
  const params = useParams();
  const vagaId = params.id as string;
  const { token } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [cargo, setCargo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoContrato, setTipoContrato] = useState("CLT");
  const [areaEscolhida, setAreaEscolhida] = useState("");
  const [salario, setSalario] = useState("");
  const [responsabilidades, setResponsabilidades] = useState<string[]>([""]);
  const [requisitos, setRequisitos] = useState<string[]>([""]);
  const [beneficiosMarcados, setBeneficiosMarcados] = useState<string[]>([]);
  const [beneficiosOutros, setBeneficiosOutros] = useState<string[]>([""]);
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [vagasDisponiveis, setVagasDisponiveis] = useState("1");
  const [pcd, setPcd] = useState<OpcaoPcd>("nao");
  const [modalidade, setModalidade] = useState<Modalidade>("presencial");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [status, setStatus] = useState("aberta");
  const enderecoAuto = useEnderecoAutomatico({ endereco, setEndereco, bairro, setBairro });

  const area = areaEscolhida;
  // Tipos antigos (ex: "PJ") continuam aparecendo para não sumir da vaga
  const tipos: string[] = (TIPOS_CONTRATO as readonly string[]).includes(tipoContrato)
    ? [...TIPOS_CONTRATO]
    : [...TIPOS_CONTRATO, tipoContrato];

  useEffect(() => {
    async function carregar() {
      try {
        const vaga = await detalhesVaga(vagaId);
        setCargo(vaga.cargo);
        setDescricao(vaga.descricao);
        setTipoContrato(vaga.tipoContrato);
        if ((CATEGORIAS_VAGA as readonly string[]).includes(vaga.area)) {
          setAreaEscolhida(vaga.area);
        } else {
          setAreaEscolhida(""); // área antiga fora da lista: a empresa escolhe uma da lista
        }
        setSalario(vaga.salario != null ? formatSalario(String(Math.round(vaga.salario * 100))) : "");
        setResponsabilidades(vaga.responsabilidades?.length ? vaga.responsabilidades : [""]);
        setRequisitos(vaga.requisitos?.length ? vaga.requisitos : [""]);
        const beneficios = vaga.beneficios || [];
        const comuns = BENEFICIOS_COMUNS as readonly string[];
        setBeneficiosMarcados(beneficios.filter((b) => comuns.includes(b)));
        const outros = beneficios.filter((b) => !comuns.includes(b));
        setBeneficiosOutros(outros.length ? outros : [""]);
        setCargaHoraria(vaga.cargaHoraria || "");
        setVagasDisponiveis(String(vaga.quantidadeVagas ?? 1));
        setPcd((vaga.pcd as OpcaoPcd) || "nao");
        setModalidade(vaga.modalidade || "presencial");
        setEndereco(vaga.endereco);
        setBairro(vaga.bairro);
        setLatitude(vaga.latitude);
        setLongitude(vaga.longitude);
        setStatus(vaga.status);
      } catch (e: any) {
        setErro(e.message || "Não foi possível carregar a vaga.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [vagaId]);

  function alternarBeneficio(b: string) {
    setBeneficiosMarcados((atual) => (atual.includes(b) ? atual.filter((x) => x !== b) : [...atual, b]));
  }

  function problema() {
    if (!cargo.trim()) return "Informe o cargo da vaga.";
    if (!area) return "Escolha a área/função da vaga.";
    if (!descricao.trim()) return "Escreva a descrição da vaga.";
    if (limparLista(responsabilidades).length === 0) return "Informe pelo menos uma responsabilidade.";
    const qtd = Number(vagasDisponiveis);
    if (!Number.isInteger(qtd) || qtd < 1) return "Informe quantas vagas estão disponíveis (pelo menos 1).";
    if (!endereco.trim() || !bairro.trim()) return "Informe o endereço e o bairro da vaga.";
    if (latitude === null || longitude === null) return "Marque no mapa onde a vaga fica.";
    return "";
  }

  async function handleSalvar() {
    setErro("");

    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }

    const p = problema();
    if (p) {
      setErro(p);
      return;
    }

    setSalvando(true);
    try {
      await atualizarVaga(token, vagaId, {
        cargo: cargo.trim(),
        descricao: descricao.trim(),
        tipoContrato,
        area,
        salario: parseSalario(salario),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        latitude: latitude as number,
        longitude: longitude as number,
        requisitos: limparLista(requisitos),
        responsabilidades: limparLista(responsabilidades),
        beneficios: limparLista([...beneficiosMarcados, ...beneficiosOutros]),
        cargaHoraria: cargaHoraria.trim() || null,
        quantidadeVagas: Number(vagasDisponiveis),
        pcd,
        modalidade,
        status,
      });

      router.push("/perfil/empregador");
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <p className="text-center text-slate-400 py-16">Carregando vaga...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[#0F2C4A] mb-1">Editar vaga</h1>
          <p className="text-slate-500 text-sm mb-6">Atualize os dados da vaga publicada.</p>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
              {erro}
            </p>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Cargo *</label>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={120} className={classeCampo} />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Tipo de contrato</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tipos.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoContrato(tipo)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      tipoContrato === tipo
                        ? "border-[#0F2C4A] bg-[#0F2C4A]/5 text-[#0F2C4A]"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <EscolhaModalidade valor={modalidade} aoMudar={setModalidade} py="py-2" />

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
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">{rotuloValor(tipoContrato)}</label>
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
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Descrição *</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                maxLength={5000}
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
              <label className="block text-sm text-[#0F2C4A] font-medium mb-2">
                Vaga para pessoas com deficiência (PcD)?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {OPCOES_PCD.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setPcd(op.valor)}
                    aria-pressed={pcd === op.valor}
                    className={`text-left rounded-md border px-3 py-3 transition-colors ${
                      pcd === op.valor ? "border-[#1D6FA5] bg-[#1D6FA5]/5" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-sm font-medium ${pcd === op.valor ? "text-[#1D6FA5]" : "text-slate-600"}`}>{op.rotulo}</p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{op.explicacao}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Endereço *</label>
              <input value={endereco} onChange={(e) => setEndereco(e.target.value)} maxLength={300} className={classeCampo} />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Bairro *</label>
              <input value={bairro} onChange={(e) => setBairro(e.target.value)} maxLength={100} className={classeCampo} />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Localização no mapa *</label>
              <p className="text-xs text-slate-500 mb-2">Clique no mapa para mudar o ponto da vaga.</p>
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

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Situação da vaga</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STATUS.map((s) => (
                  <button
                    key={s.valor}
                    type="button"
                    onClick={() => setStatus(s.valor)}
                    aria-pressed={status === s.valor}
                    className={`text-left rounded-md border px-3 py-3 transition-colors ${
                      status === s.valor ? "border-[#0F2C4A] bg-[#0F2C4A]/5" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-sm font-medium ${status === s.valor ? "text-[#0F2C4A]" : "text-slate-600"}`}>{s.rotulo}</p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{s.explicacao}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-6">{erro}</p>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => router.push("/perfil/empregador")}
              className="text-sm font-medium text-[#0F2C4A] hover:underline"
            >
              ← Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="rounded-md bg-[#F0A93C] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#dd9a30] disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
