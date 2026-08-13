import { Router } from "express";
import {
  candidatarVaga,
  minhasCandidaturas,
  candidaturasDaVaga,
} from "../controllers/candidatura.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/vagas/:id/candidatar", verificarToken, candidatarVaga);
router.get("/candidato/minhas-candidaturas", verificarToken, minhasCandidaturas);
router.get("/vagas/:id/candidaturas", verificarToken, candidaturasDaVaga);

export default router;