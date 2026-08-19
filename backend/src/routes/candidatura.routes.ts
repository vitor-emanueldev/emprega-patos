import { Router } from "express";
import {
  candidatarVaga,
  minhasCandidaturas,
  candidaturasDaVaga,
  cancelarCandidatura,
  aceitarCandidatura,
  rejeitarCandidatura,
} from "../controllers/candidatura.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/vagas/:id/candidatar", verificarToken, candidatarVaga);
router.get("/candidato/minhas-candidaturas", verificarToken, minhasCandidaturas);
router.get("/vagas/:id/candidaturas", verificarToken, candidaturasDaVaga);
router.delete("/candidaturas/:id", verificarToken, cancelarCandidatura);
router.patch("/candidaturas/:id/aceitar", verificarToken, aceitarCandidatura);
router.patch("/candidaturas/:id/rejeitar", verificarToken, rejeitarCandidatura);

export default router;