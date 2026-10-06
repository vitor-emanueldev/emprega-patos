"use client";

import { Briefcase, Car, Clock, GraduationCap, MapPin, MessageCircle, Phone, Mail, UserRound, Star, Users } from "lucide-react";
import { type CurriculoVisao, linkWhatsapp, rotuloDuracao, rotuloTurno } from "@/lib/curriculo";

type Props = {
  curriculo: CurriculoVisao;
  // "empresa" mostra o botão de WhatsApp; "candidato" é a prévia do próprio currículo
  modo?: "empresa" | "candidato";
  textoWhatsapp?: string;
};

function Secao({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F2C4A] uppercase tracking-wide mb-3">
        {icone}
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CurriculoVisual({ curriculo: c, modo = "candidato", textoWhatsapp }: Props) {
  const whatsapp = c.telefoneWhatsapp !== false ? linkWhatsapp(c.telefone, textoWhatsapp) : null;
  const turnos = (c.turnos || []).map(rotuloTurno);
  const disponibilidade = [
    turnos.length ? turnos.join(", ") : null,
    c.disponivelFimDeSemana ? "fins de semana" : null,
  ].filter(Boolean);
  const experiencias = c.experiencias || [];
  const cursos = c.cursos || [];
  const habilidades = c.habilidades || [];

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-[#0F2C4A] flex items-center justify-center">
          {c.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.fotoUrl} alt={`Foto de ${c.nome}`} className="w-full h-full object-cover" />
          ) : (
            <UserRound className="w-9 h-9 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-[#0F2C4A]">{c.nome}</h2>
          <p className="text-sm text-slate-500">
            {[c.idade != null ? `${c.idade} anos` : null, c.bairro ? `Bairro ${c.bairro}` : null].filter(Boolean).join(" · ") ||
              "Patos - PB"}
          </p>
          {(c.cargoDesejado || c.areaInteresse) && (
            <p className="text-sm font-medium text-[#1D6FA5] mt-1">
              Procura: {[c.cargoDesejado, c.areaInteresse].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Contato */}
      <div className="flex flex-wrap gap-2">
        {modo === "empresa" && whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-green-600 text-white text-sm font-semibold px-3 py-2 hover:bg-green-700"
          >
            <MessageCircle className="w-4 h-4" />
            Chamar no WhatsApp
          </a>
        )}
        {c.telefone && (
          <a
            href={`tel:${c.telefone.replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 text-sm text-[#0F2C4A] px-3 py-2 hover:bg-slate-50"
          >
            <Phone className="w-4 h-4" />
            {c.telefone}
          </a>
        )}
        {c.email && (
          <a
            href={`mailto:${c.email}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 text-sm text-[#0F2C4A] px-3 py-2 hover:bg-slate-50 break-all"
          >
            <Mail className="w-4 h-4 shrink-0" />
            {c.email}
          </a>
        )}
      </div>

      {/* Sobre mim */}
      {c.sobreMim && (
        <Secao titulo="Sobre mim" icone={<Star className="w-4 h-4" />}>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">{c.sobreMim}</p>
        </Secao>
      )}

      {/* Disponibilidade */}
      <Secao titulo="Disponibilidade" icone={<Clock className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2 text-sm">
          {disponibilidade.length > 0 ? (
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">{disponibilidade.join(", ")}</span>
          ) : (
            <span className="text-slate-400">Não informada</span>
          )}
          {c.inicioImediato && (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">Pode começar imediatamente</span>
          )}
          {c.pretensaoSalarial != null && (
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Pretensão: {formatarMoeda(c.pretensaoSalarial)}
            </span>
          )}
        </div>
      </Secao>

      {/* Experiência */}
      <Secao titulo="Experiência" icone={<Briefcase className="w-4 h-4" />}>
        {experiencias.length > 0 ? (
          <div className="space-y-3">
            {experiencias.map((exp, i) => (
              <div key={i} className="border-l-2 border-[#F0A93C] pl-3">
                <p className="font-semibold text-[#0F2C4A]">{exp.cargo}</p>
                <p className="text-sm text-slate-500">
                  {[exp.empresa, rotuloDuracao(exp.duracao), exp.atual ? "trabalho atual" : null].filter(Boolean).join(" · ")}
                </p>
                {exp.descricao && <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{exp.descricao}</p>}
              </div>
            ))}
          </div>
        ) : c.primeiroEmprego ? (
          <p className="text-sm text-slate-600">
            <span className="font-medium">Procurando o primeiro emprego</span> — ainda sem experiência registrada.
          </p>
        ) : (
          <p className="text-sm text-slate-400">Nenhuma experiência informada.</p>
        )}
      </Secao>

      {/* Escolaridade e cursos */}
      <Secao titulo="Escolaridade e cursos" icone={<GraduationCap className="w-4 h-4" />}>
        <p className="text-sm text-slate-700">
          {c.escolaridade || <span className="text-slate-400">Escolaridade não informada</span>}
          {c.estudandoAtualmente && <span className="text-slate-500"> · estudando atualmente</span>}
        </p>
        {cursos.length > 0 && (
          <ul className="mt-2 space-y-1">
            {cursos.map((curso, i) => (
              <li key={i} className="text-sm text-slate-600">
                • <span className="font-medium text-[#0F2C4A]">{curso.nomeCurso}</span>
                {[curso.instituicao, curso.anoConclusao].filter(Boolean).length > 0 &&
                  ` — ${[curso.instituicao, curso.anoConclusao].filter(Boolean).join(", ")}`}
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* Habilidades */}
      {habilidades.length > 0 && (
        <Secao titulo="Habilidades" icone={<Star className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-2">
            {habilidades.map((h) => (
              <span key={h} className="px-3 py-1 rounded-full bg-blue-100 text-[#0F2C4A] text-sm font-medium">
                {h}
              </span>
            ))}
          </div>
        </Secao>
      )}

      {/* CNH e veículo */}
      {(c.possuiCnh != null || c.possuiVeiculo != null) && (
        <Secao titulo="CNH e veículo" icone={<Car className="w-4 h-4" />}>
          <p className="text-sm text-slate-700">
            {c.possuiCnh ? `Tem CNH${c.categoriaCnh ? ` (${c.categoriaCnh})` : ""}` : "Não tem CNH"}
            {" · "}
            {c.possuiVeiculo ? "Tem veículo próprio" : "Não tem veículo"}
          </p>
        </Secao>
      )}

      {/* Referência */}
      {c.referencia?.nome && (
        <Secao titulo="Referência" icone={<Users className="w-4 h-4" />}>
          <p className="text-sm text-slate-700">
            <span className="font-medium">{c.referencia.nome}</span>
            {c.referencia.relacao && ` — ${c.referencia.relacao}`}
            {c.referencia.telefone && ` · ${c.referencia.telefone}`}
          </p>
        </Secao>
      )}

      {!c.bairro && modo === "candidato" && (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5" /> Informe seu bairro para as empresas saberem se você mora perto.
        </p>
      )}
    </div>
  );
}
