import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b-4 border-[#0F2C4A] px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-[#1D6FA5] flex items-center justify-center text-white text-xs font-bold">
          EP
        </div>
        <span className="font-extrabold text-[#0F2C4A] tracking-wide text-sm">
          EMPREGA PATOS
        </span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6 text-sm text-[#0F2C4A] font-medium">
          <Link href="/" className="hover:text-[#1D6FA5]">Início</Link>
          <Link href="/vagas" className="hover:text-[#1D6FA5]">Vagas</Link>
          <Link href="/mapa" className="hover:text-[#1D6FA5]">Mapa</Link>
          <Link href="/empresas" className="hover:text-[#1D6FA5]">Empresas</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#0F2C4A] border border-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-slate-50">
            Entrar
          </Link>
          <Link href="/publicar-vaga" className="text-sm font-medium text-white bg-[#0F2C4A] rounded-md px-4 py-1.5 hover:bg-[#123a63]">
            Publicar Vaga
          </Link>
        </div>
      </div>
    </header>
  );
}