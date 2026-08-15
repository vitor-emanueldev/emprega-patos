"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { tornarCandidato } from "@/lib/api";
import { formatTelefone } from "@/lib/masks";

export default function CompletarPerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, usuario } = useAuth();

  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [habilidade, setHabilidade] = useState("");
  const [habilidades, setHabilidades] = useState<string[]>([]);

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const redirect = searchParams.get("redirect");

  function adicionarHabilidade() {
    const novaHabilidade = habilidade.trim();

    if (!novaHabilidade) {
      return;
    }

    const jaExiste = habilidades.some(
      (item) => item.toLowerCase() === novaHabilidade.toLowerCase()
    );

    if (jaExiste) {
      setHabilidade("");
      return;
    }

    setHabilidades([...habilidades, novaHabilidade]);
    setHabilidade("");
  }

  function removerHabilidade(habilidadeRemover: string) {
    setHabilidades(
      habilidades.filter((item) => item !== habilidadeRemover)
    );
  }

  function handleHabilidadeKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarHabilidade();
    }
  }

  function formatCPF(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  async function handleSalvar() {
    setErro("");

    if (!token) {
      setErro("Você precisa estar logado para completar seu perfil.");
      router.push("/login");
      return;
    }

    if (!telefone || !cpf || !dataNascimento) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("Digite um CPF válido.");
      return;
    }

    if (habilidades.length === 0) {
      setErro("Adicione pelo menos uma habilidade.");
      return;
    }

    setSalvando(true);

    try {
      await tornarCandidato(token, {
        telefone,
        cpf,
        dataNascimento,
        habilidades,
      });

      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/vagas");
      }
    } catch (erro: any) {
      setErro(
        erro.message || "Não foi possível completar seu perfil."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#0F2C4A] text-white flex items-center justify-center text-4xl mx-auto shadow-md">
              👤
            </div>

            <h1 className="text-2xl font-bold text-[#0F2C4A] mt-5">
              Complete seu perfil
            </h1>

            <p className="text-slate-500 text-sm mt-2">
              Olá,{" "}
              <span className="font-semibold text-[#0F2C4A]">
                {usuario?.nome || "Usuário"}
              </span>
              !
            </p>

            <p className="text-slate-500 text-sm mt-1">
              Preencha seus dados para criar seu perfil de candidato.
            </p>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-5">
              {erro}
            </p>
          )}

          <div className="space-y-5">

            {/* Nome */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Nome completo
              </label>

              <input
                value={usuario?.nome || ""}
                disabled
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />

              <p className="text-xs text-slate-400 mt-1">
                O nome será obtido automaticamente da sua conta.
              </p>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Telefone *
              </label>

              <input
                value={telefone}
                onChange={(e) =>
                  setTelefone(formatTelefone(e.target.value))
                }
                placeholder="(83) 90000-0000"
                maxLength={15}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                CPF *
              </label>

              <input
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Data de nascimento *
              </label>

              <input
                type="date"
                value={dataNascimento}
                onChange={(e) =>
                  setDataNascimento(e.target.value)
                }
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
              />
            </div>

            {/* Habilidades */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Habilidades *
              </label>

              <p className="text-xs text-slate-500 mb-2">
                Digite uma habilidade e pressione Enter ou clique em
                "Adicionar".
              </p>

              <div className="flex gap-2">
                <input
                  value={habilidade}
                  onChange={(e) =>
                    setHabilidade(e.target.value)
                  }
                  onKeyDown={handleHabilidadeKeyDown}
                  placeholder="Ex.: Java, Excel, Atendimento..."
                  className="flex-1 rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
                />

                <button
                  type="button"
                  onClick={adicionarHabilidade}
                  className="rounded-md bg-[#0F2C4A] text-white px-4 py-2 font-semibold text-sm hover:bg-[#17436f] transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Tags das habilidades */}
              {habilidades.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {habilidades.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-[#0F2C4A] text-sm font-medium"
                    >
                      {item}

                      <button
                        type="button"
                        onClick={() =>
                          removerHabilidade(item)
                        }
                        className="text-[#0F2C4A] hover:text-red-600 font-bold"
                        aria-label={`Remover ${item}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {habilidades.length === 0 && (
                <div className="mt-3">
                  <span className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-sm">
                    Nenhuma habilidade adicionada
                  </span>
                </div>
              )}
            </div>

            {/* Botão */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="w-full rounded-lg bg-[#F0A93C] text-white font-semibold py-3 hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {salvando
                  ? "Salvando perfil..."
                  : "Salvar e continuar"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}