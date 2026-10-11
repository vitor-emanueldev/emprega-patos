/* eslint-disable @next/next/no-img-element */

// Mostra a logo da empresa. Sem logo, mostra o que vier em "semLogo" (o ícone de sempre).
// A logo fica inteira (sem cortar), sobre fundo branco.
export default function LogoEmpresa({
  logoUrl,
  nome,
  className = "w-12 h-12 rounded-full",
  semLogo,
}: {
  logoUrl?: string | null;
  nome: string;
  className?: string;
  semLogo: React.ReactNode;
}) {
  if (!logoUrl) return <>{semLogo}</>;
  return (
    <div className={`shrink-0 overflow-hidden bg-white border border-slate-200 flex items-center justify-center ${className}`}>
      <img src={logoUrl} alt={`Logo de ${nome}`} loading="lazy" className="w-full h-full object-contain p-0.5" />
    </div>
  );
}
