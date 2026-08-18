"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Essa rota existia como um formulário simples separado. Agora a edição do
// currículo acontece no mesmo wizard de "Completar Perfil" (que detecta
// sozinho se o candidato já tem ficha e pré-preenche os campos). Mantemos
// esse arquivo só como redirecionamento, pra não quebrar links antigos.
export default function EditarPerfilCandidatoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/perfil/completar");
  }, [router]);

  return null;
}
