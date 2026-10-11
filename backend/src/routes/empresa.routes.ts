import express, { Router } from "express";
import { tornarEmpresa, buscarMinhaEmpresa, atualizarMinhaEmpresa, enviarLogoEmpresa } from "../controllers/empresa.controller";
import { tratarErroUpload } from "../controllers/candidato.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { validar } from "../middlewares/validar";
import { limitarRequisicoes } from "../middlewares/limitarRequisicoes";
import { empresaSchema } from "../validacao/schemas";

const router = Router();

// Upload de logo: no máximo 20 envios a cada 15 minutos por IP
const limiteLogo = limitarRequisicoes({
  janelaMs: 15 * 60 * 1000,
  maximo: 20,
  mensagem: "Muitos envios de imagem. Aguarde alguns minutos.",
});

router.post(
  "/empresas/logo",
  limiteLogo,
  verificarToken,
  express.raw({ type: "image/*", limit: "8mb" }),
  tratarErroUpload,
  enviarLogoEmpresa
);

router.post("/empresas", verificarToken, validar(empresaSchema), tornarEmpresa);
router.get("/empresas/minha-empresa", verificarToken, buscarMinhaEmpresa);
router.put("/empresas/minha-empresa", verificarToken, validar(empresaSchema), atualizarMinhaEmpresa);

export default router;
