"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { cadastrarEmpresa } from "@/lib/api";
import { formatCNPJ, formatTelefone, telefoneValido } from "@/lib/masks";

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
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Setor de atuação *</label>
                <input
                  value={setorEmpresa}
                  onChange={(e) => setSetorEmpresa(e.target.value)}
                  placeholder="Comércio"
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                />
              </div>
            </div>

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
              <p className="text-xs text-slate-500 mb-2">
                Clique no mapa no ponto exato onde sua empresa fica.
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