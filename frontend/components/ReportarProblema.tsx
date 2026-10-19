"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareWarning, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { enviarReporte, type TipoReporte } from "@/lib/api";

// Qualquer botão do site abre a janela chamando abrirReportarProblema()
const EVENTO_ABRIR = "mapvagas:reportar-problema";

export function abrirReportarProblema() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

const TIPOS: { valor: TipoReporte; rotulo: string }[] = [
  { valor: "problema", rotulo: "Problema" },
  { valor: "sugestao", rotulo: "Sugestão" },
  { valor: "outro", rotulo: "Outro" },
];

export default function ReportarProblema() {
  const { usuario, token } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoReporte>("problema");
  const [mensagem, setMensagem] = useState("");
  const [contato, setContato] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [pagina, setPagina] = useState("");

  useEffect(() => {
    function abrir() {
      setPagina(window.location.pathname + window.location.search);
      setTipo("problema");
      setMensagem("");
      setContato("");
      setErro("");
      setEnviado(false);
      setAberto(true);
    }
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  if (!aberto) return null;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (mensagem.trim().length < 5) {
      setErro("Conte um pouco mais sobre o que aconteceu.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      await enviarReporte(
        {
          tipo,
          mensagem: mensagem.trim(),
          contato: usuario ? undefined : contato.trim() || undefined,
          pagina: pagina.slice(0, 300),
          navegador: navigator.userAgent.slice(0, 300),
        },
        token
      );
      setEnviado(true);
    } catch (e: any) {
      setErro(e.message || "Não foi possível enviar agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setAberto(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reportar"
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0A93C]/15 flex items-center justify-center shrink-0">
              <MessageSquareWarning className="w-5 h-5 text-[#F0A93C]" />
            </div>
            <div>
              <h2 id="titulo-reportar" className="text-lg font-bold text-[#0F2C4A] leading-tight">
                Reportar um problema
              </h2>
              <p className="text-sm text-slate-500">Algo deu errado ou tem uma sugestão? Conte pra gente.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAberto(false)}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {enviado ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="font-semibold text-[#0F2C4A] mt-3">Obrigado! Recebemos sua mensagem.</p>
            <p className="text-sm text-slate-500 mt-1">A equipe do MapVagas vai olhar o quanto antes.</p>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="mt-6 text-sm font-semibold text-white bg-[#0F2C4A] rounded-md px-5 py-2 hover:bg-[#123a63]"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="px-5 pb-5 pt-4 space-y-4">
            <div className="flex gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  onClick={() => setTipo(t.valor)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold border transition-colors ${
                    tipo === t.valor
                      ? "bg-[#0F2C4A] text-white border-[#0F2C4A]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="reporte-mensagem" className="block text-xs font-semibold text-[#0F2C4A] mb-1">
                {tipo === "sugestao" ? "Qual é a sua sugestão? *" : "O que aconteceu? *"}
              </label>
              <textarea
                id="reporte-mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={5}
                maxLength={2000}
                autoFocus
                placeholder={
                  tipo === "sugestao"
                    ? "Ex: Seria bom poder filtrar as vagas por bairro."
                    : "Ex: Cliquei em \"Candidatar-se\" e apareceu um erro."
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:border-[#1D6FA5]"
              />
            </div>

            {!usuario && (
              <div>
                <label htmlFor="reporte-contato" className="block text-xs font-semibold text-[#0F2C4A] mb-1">
                  WhatsApp ou e-mail <span className="font-normal text-slate-400">(opcional, se quiser resposta)</span>
                </label>
                <input
                  id="reporte-contato"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  maxLength={120}
                  placeholder="(83) 9 9999-9999"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1D6FA5]"
                />
              </div>
            )}

            <p className="text-xs text-slate-400">
              Junto com a mensagem vão a página em que você está ({pagina || "/"}) e o tipo de aparelho
              {usuario ? ", e quem enviou (sua conta)" : ""}, para ajudar a encontrar o problema.
            </p>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-sm font-medium text-slate-500 hover:underline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="text-sm font-semibold text-white bg-[#0F2C4A] rounded-md px-5 py-2 hover:bg-[#123a63] disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
