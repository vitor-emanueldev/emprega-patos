import { Router } from "express";
import { listarVagasSalvas, idsVagasSalvas, salvarVaga, removerVagaSalva } from "../controllers/vagaSalva.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.get("/vagas-salvas", verificarToken, listarVagasSalvas);
router.get("/vagas-salvas/ids", verificarToken, idsVagasSalvas);
router.post("/vagas/:id/salvar", verificarToken, salvarVaga);
router.delete("/vagas/:id/salvar", verificarToken, removerVagaSalva);

export default router;
