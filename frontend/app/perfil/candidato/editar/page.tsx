"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import {
  buscarMinhaFicha,
  atualizarMinhaFicha,
  Candidato,
} from "@/lib/api";
import { formatTelefone } from "@/lib/masks";

export default function EditarPerfilCandidatoPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();

  const [candidato, setCandidato] = useState<Candidato | null>(null);

  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [habilidade, setHabilidade] = useState("");
  const [habilidades, setHabilidades] = useState<string[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      if (!token) {
        setCarregando(false);
        setErro("Você precisa estar logado para editar seu perfil.");
        return;
      }

      try {
        const dados = await buscarMinhaFicha(token);

        if (!dados) {
          router.push("/perfil/completar");
          return;
        }

        setCandidato(dados);

        setTelefone(dados.telefone || "");
        setCpf(dados.cpf || "");

        if (dados.dataNascimento) {
          const data = new Date(dados.dataNascimento);

          if (!Number.isNaN(data.getTime())) {
            setDataNascimento(
              data.toISOString().split("T")[0]
            );
          }
        }

        setHabilidades(dados.habilidades || []);
      } catch (erro: any) {
        setErro(
          erro.message ||
            "Não foi possível carregar o perfil do candidato."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
  }, [token, router]);

  function formatCPF(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function adicionarHabilidade() {
    const novaHabilidade = habilidade.trim();

    if (!novaHabilidade) {
      return;
    }

    const jaExiste = habilidades.some(
      (item) =>
        item.toLowerCase() === novaHabilidade.toLowerCase()
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
      habilidades.filter(
        (item) => item !== habilidadeRemover
      )
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

  async function handleSalvar() {
    setErro("");
    setSucesso("");

    if (!token) {
      setErro("Você precisa estar logado para editar seu perfil.");
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
      const dadosAtualizados = await atualizarMinhaFicha(
        token,
        {
          telefone,
          cpf,
          dataNascimento,
          habilidades,
        }
      );

      setCandidato(dadosAtualizados);

      setSucesso("Perfil atualizado com sucesso!");

      setTimeout(() => {
        router.push("/perfil/candidato");
      }, 800);
    } catch (erro: any) {
      setErro(
        erro.message ||
          "Não foi possível atualizar seu perfil."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">
              Carregando perfil...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (erro && !candidato) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">

            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold text-[#0F2C4A] mt-5">
              Não foi possível carregar o perfil
            </h1>

            <p className="text-slate-500 mt-2">
              {erro}
            </p>

            <button
              onClick={() => router.push("/perfil/candidato")}
              className="mt-6 bg-[#0F2C4A] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#17436f] transition-colors"
            >
              Voltar para o perfil
            </button>

          </div>
        </main>
      </div>
    );
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
              Editar Perfil
            </h1>

            <p className="text-slate-500 text-sm mt-2">
              Atualize seus dados pessoais e habilidades.
            </p>

          </div>

          {/* Mensagem de erro */}
          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-5">
              {erro}
            </p>
          )}

          {/* Mensagem de sucesso */}
          {sucesso && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-5">
              {sucesso}
            </p>
          )}

          <div className="space-y-5">

            {/* Nome */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                Nome completo
              </label>

              <input
                value={candidato?.nome || usuario?.nome || ""}
                disabled
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />

              <p className="text-xs text-slate-400 mt-1">
                O nome é obtido automaticamente da sua conta.
              </p>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">
                E-mail
              </label>

              <input
                value={usuario?.email || ""}
                disabled
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />

              <p className="text-xs text-slate-400 mt-1">
                O e-mail é obtido automaticamente da sua conta.
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
                onChange={(e) =>
                  setCpf(formatCPF(e.target.value))
                }
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
                Digite uma habilidade e pressione Enter ou clique
                em "Adicionar".
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

              {/* Tags */}
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

            {/* Botões */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">

              <button
                type="button"
                onClick={() =>
                  router.push("/perfil/candidato")
                }
                disabled={salvando}
                className="w-full sm:w-1/2 rounded-lg border border-slate-300 text-slate-600 font-semibold py-3 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="w-full sm:w-1/2 rounded-lg bg-[#F0A93C] text-white font-semibold py-3 hover:bg-[#dd9a30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {salvando
                  ? "Salvando alterações..."
                  : "Salvar alterações"}
              </button>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}