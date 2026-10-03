import { Router } from "express";
import {
  tornarCandidato,
  buscarMinhaFicha,
  atualizarMinhaFicha,
} from "../controllers/candidato.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { validar } from "../middlewares/validar";
import { candidatoSchema } from "../validacao/schemas";

const router = Router();

router.post("/candidatos", verificarToken, validar(candidatoSchema), tornarCandidato);
router.get("/candidatos/minha-ficha", verificarToken, buscarMinhaFicha);
router.put("/candidatos/minha-ficha", verificarToken, validar(candidatoSchema), atualizarMinhaFicha);

export default router;
