import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

// Aviso para a empresa que ainda não pode publicar vagas
export default function AvisoVerificacao({
  verificacao,
  motivoRecusa,
}: {
  verificacao?: string | null;
  motivoRecusa?: string | null;
}) {
  if (!verificacao || verificacao === "aprovada") return null;

  if (verificacao === "recusada") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-red-800">Sua empresa não foi aprovada</p>
          {motivoRecusa && (
            <p className="text-sm text-red-700 mt-1 whitespace-pre-line">
              <b>Motivo:</b> {motivoRecusa}
            </p>
          )}
          <p className="text-sm text-red-700 mt-1">
            Corrija os dados da empresa e salve. O cadastro volta para uma nova análise.
          </p>
          <Link
            href="/perfil/empregador/editar"
            className="inline-block mt-3 text-sm font-semibold text-white bg-red-600 rounded-md px-4 py-2 hover:bg-red-700"
          >
            Corrigir dados da empresa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-900">Sua empresa está em verificação</p>
        <p className="text-sm text-amber-800 mt-1">
          Como o cadastro foi feito sem CNPJ ativo, a equipe do MapVagas confere os dados antes de liberar. Você
          poderá publicar vagas assim que for aprovada, e avisamos por e-mail.
        </p>
        <p className="text-xs text-amber-700 mt-2">
          Tem CNPJ ativo? Coloque no{" "}
          <Link href="/perfil/empregador/editar" className="font-semibold underline">
            perfil da empresa
          </Link>{" "}
          e a aprovação é na hora.
        </p>
      </div>
    </div>
  );
}
