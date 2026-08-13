import { Router } from "express";
import {
  tornarCandidato,
  buscarMinhaFicha,
  atualizarMinhaFicha,
} from "../controllers/candidato.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/candidatos", verificarToken, tornarCandidato);
router.get("/candidatos/minha-ficha", verificarToken, buscarMinhaFicha);
router.put("/candidatos/minha-ficha", verificarToken, atualizarMinhaFicha);

export default router;
