"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function CadastrarEmpresaPage() {
  const router = useRouter();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [setorEmpresa, setSetorEmpresa] = useState("");
  const [descricaoEmpresa, setDescricaoEmpresa] = useState("");
  const [telefoneEmpresa, setTelefoneEmpresa] = useState("");

  const [cadastrando, setCadastrando] = useState(false);

  function handleCadastrar() {
    setCadastrando(true);
    router.push("/publicar-vaga");
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
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">CNPJ *</label>
                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
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
                onChange={(e) => setTelefoneEmpresa(e.target.value)}
                placeholder="(83) 90000-0000"
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
          </div>

          <div className="flex items-center justify-end mt-8">
            <button
              onClick={handleCadastrar}
              disabled={cadastrando}
              className="rounded-md bg-[#F0A93C] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cadastrando ? "Redirecionando..." : "Cadastrar Empresa"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}