"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { verificarEmpresa, atualizarEmpresa } from "@/lib/api";

export default function EditarPerfilEmpregadorPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [setor, setSetor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const dados = await verificarEmpresa(token);

        if (!dados) {
          router.push("/perfil/empregador/cadastrar");
          return;
        }

        setNomeEmpresa(dados.nomeEmpresa || "");
        setCnpj(dados.cnpj || "");
        setSetor(dados.setor || "");
        setDescricao(dados.descricao || "");
        setTelefone(dados.telefone || "");
        setEndereco(dados.endereco || "");
        setBairro(dados.bairro || "");
      } catch (e: any) {
        setErro(e.message || "Não foi possível carregar os dados da empresa.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [token, router]);

  function formatCNPJ(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

  function formatTelefone(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  async function handleSalvar() {
    setErro("");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!nomeEmpresa || !cnpj) {
      setErro("Preencha ao menos o nome da empresa e o CNPJ.");
      return;
    }

    if (cnpj.replace(/\D/g, "").length !== 14) {
      setErro("Digite um CNPJ válido.");
      return;
    }

    setSalvando(true);

    try {
      await atualizarEmpresa(token, {
        nomeEmpresa,
        cnpj,
        setor,
        descricao,
        telefone,
        endereco,
        bairro,
      });

      router.push("/perfil/empregador");
    } catch (e: any) {
      setErro(e.message || "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <p className="text-sm text-slate-400 text-center py-16">
            Carregando dados da empresa...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#F0A93C] text-white flex items-center justify-center text-4xl mx-auto shadow-md">
              🏢
            </div>

            <h1 className="text-2xl font-bold text-[#0F2C4A] mt-5">
              Editar Perfil da Empresa
            </h1>

            <p className="text-slate-500 text-sm mt-2">
              Atualize as informações da sua empresa.
            </p>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-5">
              {erro}
            </p>
          )}

          <div className="space-y-5">

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Nome da Empresa *
              </label>
              <input
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex.: SouMais Comércio"
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                CNPJ *
              </label>
              <input
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Setor de atuação
              </label>
              <input
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex.: Varejo, Alimentação, Serviços..."
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Telefone
              </label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                placeholder="(83) 90000-0000"
                maxLength={15}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Endereço
              </label>
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Ex.: Rua Paulo Mendes, 123"
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Bairro
              </label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex.: Centro"
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Sobre a empresa
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Conte um pouco sobre a empresa..."
                rows={4}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5] resize-none"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/perfil/empregador")}
                className="flex-1 rounded-lg border border-[#0F2C4A] text-[#0F2C4A] font-semibold py-3 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 rounded-lg bg-[#F0A93C] text-white font-semibold py-3 hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}