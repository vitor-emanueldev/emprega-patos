"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditarPerfilCandidatoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/perfil/completar");
  }, [router]);

  return null;
}
