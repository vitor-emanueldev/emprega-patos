"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { detalhesVaga, atualizarVaga } from "@/lib/api";

const TIPOS_CONTRATO = ["CLT", "PJ / Freelance", "Temporário"];

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
  const [area, setArea] = useState("");
  const [salario, setSalario] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [status, setStatus] = useState("aberta");

  useEffect(() => {
    async function carregar() {
      try {
        const vaga = await detalhesVaga(vagaId);
        setCargo(vaga.cargo);
        setDescricao(vaga.descricao);
        setTipoContrato(vaga.tipoContrato);
        setArea(vaga.area);
        setSalario(vaga.salario != null ? String(vaga.salario) : "");
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

  async function handleSalvar() {
    setErro("");

    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }

    if (!cargo || !descricao || !area || !endereco || !bairro || latitude === null || longitude === null) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);
    try {
        await atualizarVaga(token, vagaId, {
        cargo,
        descricao,
        tipoContrato,
        area,
        salario: salario ? Number(salario) : null,
        endereco,
        bairro,
        latitude,
        longitude,
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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-[#0F2C4A] mb-1">Editar vaga</h1>
          <p className="text-slate-500 text-sm mb-6">Atualize os dados da vaga publicada.</p>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
              {erro}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Cargo *</label>
              <input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-2">Tipo de contrato</label>
              <div className="grid grid-cols-3 gap-3">
                {TIPOS_CONTRATO.map((tipo) => (
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Área *</label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Salário</label>
                <input
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                  className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Descrição *</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Endereço *</label>
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Bairro *</label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0F2C4A] font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-gray-900"
              >
                <option value="aberta">Aberta</option>
                <option value="pausada">Pausada</option>
                <option value="encerrada">Encerrada</option>
              </select>
            </div>
          </div>

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