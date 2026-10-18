// Entrevista: presencial (local), online (link de vídeo) ou por telefone

export type FormatoEntrevista = "presencial" | "online" | "telefone";

export const FORMATOS_ENTREVISTA: { valor: FormatoEntrevista; rotulo: string }[] = [
  { valor: "presencial", rotulo: "Presencial" },
  { valor: "online", rotulo: "Online (vídeo)" },
  { valor: "telefone", rotulo: "Por telefone" },
];

const DURACAO_PADRAO_MIN = 60;

// "20261020T140000Z": formato que o Google Agenda aceita na URL
function dataAgenda(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Link "Adicionar ao Google Agenda" já preenchido (o candidato só confirma)
export function linkAgendaGoogle(e: { titulo: string; inicio: string; local?: string | null; detalhes?: string | null }) {
  const inicio = new Date(e.inicio);
  if (Number.isNaN(inicio.getTime())) return null;
  const fim = new Date(inicio.getTime() + DURACAO_PADRAO_MIN * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titulo,
    dates: `${dataAgenda(inicio)}/${dataAgenda(fim)}`,
    details: e.detalhes || "",
    location: e.local || "",
    ctz: "America/Fortaleza",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
