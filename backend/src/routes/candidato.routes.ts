import express, { Router } from "express";
import {
  tornarCandidato,
  buscarMinhaFicha,
  atualizarMinhaFicha,
  enviarFotoCandidato,
  tratarErroUpload,
} from "../controllers/candidato.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { validar } from "../middlewares/validar";
import { limitarRequisicoes } from "../middlewares/limitarRequisicoes";
import { candidatoSchema } from "../validacao/schemas";

const router = Router();

// Upload de foto: no máximo 20 envios a cada 15 minutos por IP
const limiteFoto = limitarRequisicoes({
  janelaMs: 15 * 60 * 1000,
  maximo: 20,
  mensagem: "Muitos envios de foto. Aguarde alguns minutos.",
});

router.post("/candidatos", verificarToken, validar(candidatoSchema), tornarCandidato);
router.get("/candidatos/minha-ficha", verificarToken, buscarMinhaFicha);
router.put("/candidatos/minha-ficha", verificarToken, validar(candidatoSchema), atualizarMinhaFicha);
router.post(
  "/candidatos/foto",
  limiteFoto,
  verificarToken,
  express.raw({ type: "image/*", limit: "8mb" }),
  tratarErroUpload,
  enviarFotoCandidato
);

export default router;
