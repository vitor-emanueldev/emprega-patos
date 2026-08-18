"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { listarVagas, type Vaga } from "@/lib/api";
import Link from "next/link";

const TIPOS_CONTRATO = ["Temporário", "Estágio", "CLT", "PJ"];
const AREAS = ["Comércio", "Educação", "Saúde", "Serviços", "Indústria"];

const ICONE_AREA: Record<string, { icone: string; cor: string }> = {
  comercio: { icone: "🛍️", cor: "bg-amber-100" },
  educacao: { icone: "📚", cor: "bg-sky-100" },
  saude: { icone: "🏥", cor: "bg-rose-100" },
  servicos: { icone: "🔧", cor: "bg-teal-100" },
  industria: { icone: "🏭", cor: "bg-slate-200" },
};

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tempoPublicacao(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const horas = Math.floor(diffMs / (1000 * 60 * 60));

  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;

  const dias = Math.floor(horas / 24);
  return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
}

function alternarItem(lista: string[], item: string) {
  return lista.includes(item)
    ? lista.filter((i) => i !== item)
    : [...lista, item];
}

function VagasConteudo() {
  const searchParams = useSearchParams();

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState<string[]>([]);
  const [bairrosSelecionados, setBairrosSelecionados] = useState<string[]>([]);
  const [salarioMin, setSalarioMin] = useState(0);
  const [salarioMax, setSalarioMax] = useState(5000);

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarVagas();
        setVagas(dados);
      } catch (e: any) {
        setErro(e.message || "Não foi possível carregar as vagas.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const bairrosDisponiveis = useMemo(() => {
    const unicos = new Set(vagas.map((v) => v.bairro).filter(Boolean));
    return Array.from(unicos).sort();
  }, [vagas]);

  useEffect(() => {
    if (bairrosDisponiveis.length > 0 && bairrosSelecionados.length === 0) {
      setBairrosSelecionados(bairrosDisponiveis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bairrosDisponiveis]);

  const vagasFiltradas = useMemo(() => {
    return vagas
      .filter((vaga) => {
        const bateBusca =
          busca.trim() === "" ||
          vaga.cargo.toLowerCase().includes(busca.toLowerCase()) ||
          vaga.empresa.nomeEmpresa.toLowerCase().includes(busca.toLowerCase());

        const bateTipo =
          tiposSelecionados.length === 0 ||
          tiposSelecionados.some((t) => normalizar(t) === normalizar(vaga.tipoContrato));

        const bateArea =
          areasSelecionadas.length === 0 ||
          areasSelecionadas.some((a) => normalizar(a) === normalizar(vaga.area));

        const bateBairro =
          bairrosSelecionados.length === 0 ||
          bairrosSelecionados.includes(vaga.bairro);

        const bateSalario =
          vaga.salario == null ||
          (vaga.salario >= salarioMin && vaga.salario <= salarioMax);

        return bateBusca && bateTipo && bateArea && bateBairro && bateSalario;
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [vagas, busca, tiposSelecionados, areasSelecionadas, bairrosSelecionados, salarioMin, salarioMax]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR DE FILTROS */}
        <aside className="bg-white rounded-xl shadow-md p-5 h-fit space-y-6">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Cargo ou empresa..."
            className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]"
          />

          <div>
            <p className="text-xs font-bold text-slate-500 tracking-wide mb-2">
              TIPO DE CONTRATO
            </p>
            <div className="flex flex-wrap gap-2">
              {TIPOS_CONTRATO.map((tipo) => {
                const ativo = tiposSelecionados.includes(tipo);
                return (
                  <button
                    key={tipo}
                    onClick={() =>
                      setTiposSelecionados((prev) => alternarItem(prev, tipo))
                    }
                    className={`text-xs font-medium rounded-md px-3 py-1.5 border transition-colors ${
                      ativo
                        ? "bg-[#0F2C4A] text-white border-[#0F2C4A]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tipo}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 tracking-wide mb-2">
              ÁREA
            </p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area) => {
                const ativo = areasSelecionadas.includes(area);
                return (
                  <button
                    key={area}
                    onClick={() =>
                      setAreasSelecionadas((prev) => alternarItem(prev, area))
                    }
                    className={`text-xs font-medium rounded-md px-3 py-1.5 border transition-colors ${
                      ativo
                        ? "bg-[#F0A93C] text-white border-[#F0A93C]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 tracking-wide mb-2">
              FAIXA SALARIAL
            </p>
            <p className="text-xs text-slate-500 mb-2">
              R$ {salarioMin.toLocaleString("pt-BR")} a R${" "}
              {salarioMax.toLocaleString("pt-BR")}
            </p>
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">Mínimo</label>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={salarioMin}
                onChange={(e) =>
                  setSalarioMin(Math.min(Number(e.target.value), salarioMax))
                }
                className="w-full accent-[#0F2C4A]"
              />
              <label className="text-[11px] text-slate-400 block">Máximo</label>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={salarioMax}
                onChange={(e) =>
                  setSalarioMax(Math.max(Number(e.target.value), salarioMin))
                }
                className="w-full accent-[#0F2C4A]"
              />
            </div>
          </div>

          {bairrosDisponiveis.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide mb-2">
                BAIRRO
              </p>
              <div className="space-y-1.5">
                {bairrosDisponiveis.map((bairro) => (
                  <label
                    key={bairro}
                    className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={bairrosSelecionados.includes(bairro)}
                      onChange={() =>
                        setBairrosSelecionados((prev) => alternarItem(prev, bairro))
                      }
                      className="accent-[#0F2C4A]"
                    />
                    {bairro}
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* LISTA DE VAGAS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Exibindo {vagasFiltradas.length} de {vagas.length} vagas
            </p>
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-md px-3 py-1.5">
              Mais recentes ▾
            </span>
          </div>

          {carregando && (
            <p className="text-sm text-slate-400 text-center py-16">
              Carregando vagas...
            </p>
          )}

          {!carregando && erro && (
            <p className="text-sm text-red-600 text-center py-16">{erro}</p>
          )}

          {!carregando && !erro && vagasFiltradas.length === 0 && (
            <div className="bg-white rounded-xl shadow-md text-center py-16 px-4">
              <p className="text-sm font-medium text-[#0F2C4A]">
                Nenhuma vaga encontrada
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tente ajustar os filtros de busca.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {vagasFiltradas.map((vaga) => {
              const chave = normalizar(vaga.area);
              const { icone, cor } = ICONE_AREA[chave] ?? {
                icone: "💼",
                cor: "bg-slate-100",
              };

              return (
                <div
                  key={vaga.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 shrink-0 rounded-full ${cor} flex items-center justify-center text-xl`}
                  >
                    {icone}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0F2C4A] text-sm">
                      {vaga.cargo}
                    </p>
                    <p className="text-xs font-medium text-[#1D6FA5]">
                      {vaga.empresa.nomeEmpresa}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {vaga.bairro}
                      {vaga.salario != null && (
                        <>
                          {" "}
                          · R$ {vaga.salario.toLocaleString("pt-BR")}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <Link
                      href={`/vagas/${vaga.id}`}
                      className="bg-[#F0A93C] text-white text-xs font-semibold rounded-md px-4 py-2 hover:bg-[#dd9a30] inline-block text-center"
                    >
                      Ver detalhes
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {tempoPublicacao(vaga.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function VagasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <Header />
          <p className="text-center text-slate-400 py-16">Carregando...</p>
        </div>
      }
    >
      <VagasConteudo />
    </Suspense>
  );
}