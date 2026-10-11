import { Router } from "express";
import {
  candidatarVaga,
  minhasCandidaturas,
  candidaturasDaVaga,
  cancelarCandidatura,
  aceitarCandidatura,
  rejeitarCandidatura,
  contratarCandidatura,
} from "../controllers/candidatura.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { validar } from "../middlewares/validar";
import {
  aceitarCandidaturaSchema,
  rejeitarCandidaturaSchema,
  contratarCandidaturaSchema,
  candidatarSchema,
} from "../validacao/schemas";

const router = Router();

router.post("/vagas/:id/candidatar", verificarToken, validar(candidatarSchema), candidatarVaga);
router.get("/candidato/minhas-candidaturas", verificarToken, minhasCandidaturas);
router.get("/vagas/:id/candidaturas", verificarToken, candidaturasDaVaga);
router.delete("/candidaturas/:id", verificarToken, cancelarCandidatura);
router.patch("/candidaturas/:id/aceitar", verificarToken, validar(aceitarCandidaturaSchema), aceitarCandidatura);
router.patch("/candidaturas/:id/rejeitar", verificarToken, validar(rejeitarCandidaturaSchema), rejeitarCandidatura);
router.patch("/candidaturas/:id/contratar", verificarToken, validar(contratarCandidaturaSchema), contratarCandidatura);

export default router;
