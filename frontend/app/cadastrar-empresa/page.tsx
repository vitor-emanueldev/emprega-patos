"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { cadastrarEmpresa } from "@/lib/api";
import { formatCNPJ, formatTelefone, telefoneValido } from "@/lib/masks";
import { apenasDigitos, cnpjValido, consultarCnpj, localizarEndereco } from "@/lib/cnpj";
import { SETORES_EMPRESA } from "@/lib/setores";

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

export default function CadastrarEmpresaPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [setorEmpresa, setSetorEmpresa] = useState("");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  const [cadastrando, setCadastrando] = useState(false);

  // ── Busca automática do CNPJ (dados públicos da Receita Federal) ──
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [avisoCnpj, setAvisoCnpj] = useState<{ tipo: "ok" | "alerta" | "erro"; texto: string } | null>(null);
  const [avisoLocal, setAvisoLocal] = useState("");
  const ultimoCnpj = useRef("");
  // guarda o que foi preenchido automaticamente, para não apagar o que a pessoa digitou
  const preenchidoAuto = useRef<Record<string, string>>({});

  function preencher(campo: string, valorAtual: string, novo: string, definir: (v: string) => void) {
    if (!novo) return;
    if (!valorAtual.trim() || valorAtual === preenchidoAuto.current[campo]) {
      definir(novo);
      preenchidoAuto.current[campo] = novo;
    }
  }

  async function buscarCnpj(digitos: string) {
    ultimoCnpj.current = digitos;
    setConsultandoCnpj(true);
    setAvisoCnpj(null);
    setAvisoLocal("");
    try {
      const dados = await consultarCnpj(digitos);
      preencher("nome", nomeEmpresa, dados.nome, setNomeEmpresa);
      preencher("setor", setorEmpresa, dados.setor, setSetorEmpresa);
      preencher("telefone", telefoneEmpresa, dados.telefone, setTelefoneEmpresa);
      preencher("endereco", endereco, dados.endereco, setEndereco);
      preencher("bairro", bairro, dados.bairro, setBairro);

      setAvisoCnpj(
        dados.ativa
          ? { tipo: "ok", texto: `Dados preenchidos pela Receita Federal: ${dados.razaoSocial}. Confira abaixo.` }
          : { tipo: "alerta", texto: `${dados.razaoSocial}: situação "${dados.situacao || "não informada"}" na Receita. Confira se o CNPJ está correto.` }
      );

      // Coloca o pino no endereço, se a pessoa ainda não marcou no mapa
      const ehDePatos = dados.cidade.toLowerCase() === "patos" && dados.uf === "PB";
      if (!ehDePatos) {
        setAvisoLocal(`Esse CNPJ é de ${dados.cidade}-${dados.uf}. Marque no mapa onde fica a unidade de Patos.`);
      } else if (latitude === null) {
        const local = await localizarEndereco(dados);
        if (local) {
          setLatitude(local.latitude);
          setLongitude(local.longitude);
          setAvisoLocal(
            local.precisao === "endereco"
              ? "Colocamos o pino no endereço do CNPJ. Confira e, se precisar, clique no ponto exato."
              : "Achamos só o bairro. Clique no mapa no ponto exato da empresa."
          );
        }
      }
    } catch (e: any) {
      setAvisoCnpj({ tipo: "erro", texto: e.message || "Não foi possível consultar o CNPJ. Preencha os dados manualmente." });
    } finally {
      setConsultandoCnpj(false);
    }
  }

  // Consulta sozinho quando a pessoa termina de digitar os 14 números
  useEffect(() => {
    const digitos = apenasDigitos(cnpj);
    if (digitos.length !== 14) {
      setAvisoCnpj(null);
      return;
    }
    if (!cnpjValido(digitos)) {
      setAvisoCnpj({ tipo: "erro", texto: "CNPJ inválido. Confira os números." });
      return;
    }
    if (digitos !== ultimoCnpj.current) buscarCnpj(digitos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpj]);

  async function handleCadastrar() {
    setErro("");

    if (!token) {
      setErro("Você precisa estar logado para cadastrar uma empresa.");
      router.push("/login");
      return;
    }

    if (!nomeEmpresa || !setorEmpresa || !telefoneEmpresa || !bairro) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!telefoneValido(telefoneEmpresa)) {
      setErro("Telefone inválido. Use DDD + número.");
      return;
    }

    if (latitude === null || longitude === null) {
      setErro("Clique no mapa para marcar a localização da empresa.");
      return;
    }

    setCadastrando(true);
    try {
      await cadastrarEmpresa(token, {
        nomeEmpresa,
        cnpj,
        setor: setorEmpresa,
        descricao: descricaoEmpresa,
        telefone: telefoneEmpresa,
        endereco,
        bairro,
        latitude,
        longitude,
      });

      router.push("/publicar-vaga");

    } catch (erro: any) {
      setErro(erro.message || "Erro ao cadastrar empresa");
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F2C4A]">
      <Header />
      <main className="max-w-2xl mx-auto pt-10 pb-16 px-4">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-xl font-bold text-[#0F2C4A] mb-1">Cadastrar empresa</h1>
          <p className="text-sm text-slate-500 mb-6">
            Cadastre sua empresa para depois poder publicar vagas no mapa da cidade.
          </p>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
              {erro}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Nome da empresa *</label>
              <input
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Guedes Shopping"
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">CNPJ</label>
                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                  inputMode="numeric"
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                />
                {consultandoCnpj ? (
                  <p className="text-xs text-slate-500 mt-1">Buscando dados do CNPJ...</p>
                ) : !avisoCnpj ? (
                  <p className="text-xs text-slate-400 mt-1">Digite o CNPJ e preenchemos o resto para você.</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Setor de atuação *</label>
                <select
                  value={setorEmpresa}
                  onChange={(e) => setSetorEmpresa(e.target.value)}
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                >
                  <option value="">Selecione...</option>
                  {SETORES_EMPRESA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {avisoCnpj && !consultandoCnpj && (
              <p
                className={`text-xs rounded-md px-3 py-2 border ${
                  avisoCnpj.tipo === "ok"
                    ? "text-green-800 bg-green-50 border-green-200"
                    : avisoCnpj.tipo === "alerta"
                    ? "text-amber-900 bg-amber-50 border-amber-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}
              >
                {avisoCnpj.tipo === "ok" ? "✓ " : "⚠ "}
                {avisoCnpj.texto}
              </p>
            )}

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Telefone/contato *</label>
              <input
                value={telefoneEmpresa}
                onChange={(e) => setTelefoneEmpresa(formatTelefone(e.target.value))}
                placeholder="(83) 90000-0000"
                maxLength={15}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Descrição da empresa</label>
              <textarea
                value={descricaoEmpresa}
                onChange={(e) => setDescricaoEmpresa(e.target.value)}
                rows={4}
                placeholder="Conte um pouco sobre a empresa: o que ela faz, há quanto tempo está no mercado, etc."
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Endereço</label>
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua Presidente Petrônio Portela, 12"
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
              <p className={`text-xs mb-2 ${avisoLocal ? "text-[#1D6FA5] font-medium" : "text-slate-500"}`}>
                {avisoLocal || "Clique no mapa no ponto exato onde sua empresa fica."}
              </p>
              <MapaSelecionarLocal
                latitude={latitude}
                longitude={longitude}
                onSelecionar={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
              {latitude !== null && longitude !== null && (
                <p className="text-xs text-slate-500 mt-2">
                  Local selecionado: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end mt-8">
            <button
              onClick={handleCadastrar}
              disabled={cadastrando}
              className="rounded-md bg-[#F0A93C] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cadastrando ? "Cadastrando..." : "Cadastrar Empresa"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}