"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Camera, Check, ChevronDown, Mail, Map as MapIcon, MapPin, MessageCircle, Phone, Search, ShieldCheck, X } from "lucide-react";
import Header from "@/components/Header";
import { linkInstagram } from "@/lib/instagram";
import { useAuth } from "@/context/AuthContext";
import {
  aprovarEmpresaAdmin,
  listarEmpresasAdmin,
  recusarEmpresaAdmin,
  type EmpresaAdmin,
  type SituacaoEmpresa,
} from "@/lib/api";

const ABAS: { valor: SituacaoEmpresa; rotulo: string }[] = [
  { valor: "pendente", rotulo: "Aguardando" },
  { valor: "aprovada", rotulo: "Aprovadas" },
  { valor: "recusada", rotulo: "Recusadas" },
];

// Links de conferência (Google Maps não precisa de chave para abrir assim)
function linksVerificacao(e: EmpresaAdmin) {
  const temPonto = e.latitude != null && e.longitude != null;
  const enderecoTexto = [e.endereco, e.bairro, "Patos - PB"].filter(Boolean).join(", ");
  const digitos = (e.telefone || "").replace(/\D/g, "");
  const mensagem = `Olá! Aqui é da equipe do MapVagas. Recebemos o cadastro da empresa "${e.nomeEmpresa}" e queremos só confirmar alguns dados antes de liberar a publicação de vagas. Você é o responsável?`;
  return {
    mapa: temPonto
      ? `https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoTexto)}`,
    streetView: temPonto
      ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${e.latitude},${e.longitude}`
      : null,
    busca: `https://www.google.com/search?q=${encodeURIComponent(`${e.nomeEmpresa} Patos PB`)}`,
    whatsapp: digitos.length >= 10 ? `https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem)}` : null,
    instagram: e.instagram ? linkInstagram(e.instagram) : null,
  };
}

const PASSOS_VERIFICACAO = [
  "Nome e descrição fazem sentido? (não é teste, piada ou algo ofensivo)",
  "Abra o Google Maps e o Street View: existe comércio nesse endereço?",
  "Busque o nome no Google e abra o Instagram (se a empresa informou): ela aparece?",
  "Fale com o responsável pelo WhatsApp e confirme que a empresa e a vaga são reais.",
  "Na dúvida, peça uma foto da fachada ou recuse explicando o motivo (vai por e-mail).",
];

function data(valor?: string | null) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR") : "—";
}

export default function AdminPage() {
  const router = useRouter();
  const { token, pronto } = useAuth();

  const [aba, setAba] = useState<SituacaoEmpresa>("pendente");
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [totais, setTotais] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [semPermissao, setSemPermissao] = useState(false);

  const [recusandoId, setRecusandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [comoVerificarAberto, setComoVerificarAberto] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const r = await listarEmpresasAdmin(token, aba);
      setEmpresas(r.empresas);
      setTotais(r.totais);
    } catch (e: any) {
      if (e.status === 403) setSemPermissao(true);
      else setErro(e.message || "Não foi possível carregar as empresas.");
    } finally {
      setCarregando(false);
    }
  }, [token, aba]);

  useEffect(() => {
    if (!pronto) return;
    if (!token) {
      router.replace("/login?redirect=/admin");
      return;
    }
    carregar();
  }, [pronto, token, carregar, router]);

  async function aprovar(empresa: EmpresaAdmin) {
    if (!token) return;
    setProcessandoId(empresa.id);
    setAviso("");
    try {
      await aprovarEmpresaAdmin(token, empresa.id);
      setAviso(`${empresa.nomeEmpresa} foi aprovada. A empresa recebeu um e-mail.`);
      await carregar();
    } catch (e: any) {
      setAviso(e.message || "Não foi possível aprovar.");
    } finally {
      setProcessandoId(null);
    }
  }

  async function recusar(empresa: EmpresaAdmin) {
    if (!token) return;
    if (!motivo.trim()) {
      setAviso("Escreva o motivo da recusa. A empresa vai receber esse texto por e-mail.");
      return;
    }
    setProcessandoId(empresa.id);
    setAviso("");
    try {
      await recusarEmpresaAdmin(token, empresa.id, motivo.trim());
      setAviso(`${empresa.nomeEmpresa} foi recusada. A empresa recebeu o motivo por e-mail.`);
      setRecusandoId(null);
      setMotivo("");
      await carregar();
    } catch (e: any) {
      setAviso(e.message || "Não foi possível recusar.");
    } finally {
      setProcessandoId(null);
    }
  }

  if (semPermissao) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-xl mx-auto px-4 py-20 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-xl font-bold text-[#0F2C4A] mt-4">Área restrita</h1>
          <p className="text-slate-500 mt-2">Esta página é só para administradores do MapVagas.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#0F2C4A] text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2C4A]">Administração</h1>
            <p className="text-slate-500 text-sm">Verificação de empresas cadastradas sem CNPJ ativo</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-8">
          {ABAS.map((a) => (
            <button
              key={a.valor}
              onClick={() => {
                setAba(a.valor);
                setRecusandoId(null);
                setAviso("");
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                aba === a.valor
                  ? "bg-[#0F2C4A] text-white border-[#0F2C4A]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {a.rotulo}
              <span
                className={`text-xs rounded-full px-2 py-0.5 ${
                  aba === a.valor ? "bg-white/20" : a.valor === "pendente" && totais.pendente ? "bg-[#F0A93C] text-white" : "bg-slate-100"
                }`}
              >
                {totais[a.valor] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Passo a passo da verificação */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setComoVerificarAberto(!comoVerificarAberto)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-[#0F2C4A]"
          >
            Como verificar uma empresa
            <ChevronDown className={`w-4 h-4 transition-transform ${comoVerificarAberto ? "rotate-180" : ""}`} />
          </button>
          {comoVerificarAberto && (
            <ol className="px-5 pb-4 space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
              {PASSOS_VERIFICACAO.map((p) => (
                <li key={p}>{p}</li>
              ))}
              <li className="list-none text-xs text-slate-400 pt-1">
                Lembrete: MEI tem CNPJ grátis. Se a empresa tiver CNPJ ativo, basta ela colocar no perfil que a aprovação é
                automática.
              </li>
            </ol>
          )}
        </div>

        {aviso && (
          <p className="mt-5 text-sm text-[#0F2C4A] bg-white border border-slate-200 rounded-md px-4 py-3">{aviso}</p>
        )}

        {carregando && <p className="text-sm text-slate-400 text-center py-16">Carregando...</p>}
        {erro && <p className="text-sm text-red-600 text-center py-16">{erro}</p>}

        {!carregando && !erro && empresas.length === 0 && (
          <div className="bg-white rounded-xl shadow-md text-center py-14 px-4 mt-6">
            <p className="font-medium text-[#0F2C4A]">
              {aba === "pendente" ? "Nenhuma empresa aguardando verificação 🎉" : "Nenhuma empresa aqui."}
            </p>
          </div>
        )}

        <div className="space-y-4 mt-6">
          {!carregando &&
            empresas.map((e) => (
              <div key={e.id} className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
                <div className="flex items-start gap-4">
                  {e.logoUrl ? (
                    <img src={e.logoUrl} alt="" className="w-14 h-14 rounded-lg object-contain border border-slate-200 bg-white p-1 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-[#0F2C4A] text-lg leading-tight">{e.nomeEmpresa}</p>
                        <p className="text-sm text-slate-500">
                          {e.setor || "Setor não informado"} · cadastrada em {data(e.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold rounded-full px-3 py-1 ${
                          e.cnpj ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {e.cnpj ? `CNPJ ${e.cnpj}` : "Sem CNPJ"}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-sm text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {[e.endereco, e.bairro].filter(Boolean).join(" – ") || "Endereço não informado"}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        {e.telefone || "Telefone não informado"}
                      </p>
                      <p className="flex items-center gap-1.5 sm:col-span-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        Responsável: {e.usuario?.nome} ({e.usuario?.email})
                      </p>
                    </div>

                    {/* Conferir a empresa */}
                    {(() => {
                      const l = linksVerificacao(e);
                      const botao =
                        "inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-3 py-1.5 border transition-colors";
                      return (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <a href={l.mapa} target="_blank" rel="noopener noreferrer" className={`${botao} text-[#1D6FA5] border-[#1D6FA5]/40 hover:bg-[#1D6FA5]/5`}>
                            <MapIcon className="w-3.5 h-3.5" /> Google Maps
                          </a>
                          {l.streetView && (
                            <a href={l.streetView} target="_blank" rel="noopener noreferrer" className={`${botao} text-[#1D6FA5] border-[#1D6FA5]/40 hover:bg-[#1D6FA5]/5`}>
                              <Camera className="w-3.5 h-3.5" /> Street View
                            </a>
                          )}
                          <a href={l.busca} target="_blank" rel="noopener noreferrer" className={`${botao} text-slate-600 border-slate-200 hover:bg-slate-50`}>
                            <Search className="w-3.5 h-3.5" /> Buscar no Google
                          </a>
                          {l.instagram && (
                            <a href={l.instagram} target="_blank" rel="noopener noreferrer" className={`${botao} text-slate-600 border-slate-200 hover:bg-slate-50`}>
                              <Camera className="w-3.5 h-3.5" /> Instagram
                            </a>
                          )}
                          {l.whatsapp && (
                            <a href={l.whatsapp} target="_blank" rel="noopener noreferrer" className={`${botao} text-white bg-green-600 border-green-600 hover:bg-green-700`}>
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    {e.descricao && (
                      <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-md px-3 py-2 whitespace-pre-line">{e.descricao}</p>
                    )}

                    {e.verificacao === "recusada" && e.motivoRecusa && (
                      <p className="text-sm text-red-700 mt-3">
                        <b>Motivo da recusa ({data(e.verificadaEm)}):</b> {e.motivoRecusa}
                      </p>
                    )}
                    {e.verificacao === "aprovada" && (
                      <p className="text-xs text-slate-400 mt-3">
                        Aprovada em {data(e.verificadaEm)} · {e._count?.vagas ?? 0} vaga(s) publicada(s)
                      </p>
                    )}

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {e.verificacao !== "aprovada" && (
                        <button
                          onClick={() => aprovar(e)}
                          disabled={processandoId === e.id}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-md px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar
                        </button>
                      )}
                      {e.verificacao !== "recusada" && recusandoId !== e.id && (
                        <button
                          onClick={() => {
                            setRecusandoId(e.id);
                            setMotivo("");
                            setAviso("");
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-md px-4 py-2 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Recusar
                        </button>
                      )}
                    </div>

                    {recusandoId === e.id && (
                      <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-4">
                        <label className="block text-xs font-semibold text-[#0F2C4A] mb-1">
                          Motivo da recusa (a empresa recebe por e-mail) *
                        </label>
                        <textarea
                          value={motivo}
                          onChange={(ev) => setMotivo(ev.target.value)}
                          rows={3}
                          maxLength={1000}
                          placeholder="Ex: Não conseguimos confirmar o endereço. Envie uma foto da fachada pelo e-mail mapvagas.avisos@gmail.com."
                          className="w-full rounded-md bg-white border border-slate-200 px-3 py-2 text-sm text-gray-900 resize-none"
                        />
                        <div className="flex justify-end gap-3 mt-3">
                          <button onClick={() => setRecusandoId(null)} className="text-sm font-medium text-slate-500 hover:underline">
                            Cancelar
                          </button>
                          <button
                            onClick={() => recusar(e)}
                            disabled={processandoId === e.id}
                            className="text-sm font-semibold text-white bg-red-600 rounded-md px-4 py-2 hover:bg-red-700 disabled:opacity-60"
                          >
                            Confirmar recusa
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
