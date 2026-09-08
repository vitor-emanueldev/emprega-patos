"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RotaProtegida({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token } = useAuth();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const tokenSalvo = localStorage.getItem("token");

    if (!tokenSalvo) {
      router.push("/login");
    } else {
      setVerificando(false);
    }
  }, [router]);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}