import { Router } from "express";
import { listarVagas, detalhesVaga, publicarVaga } from "../controllers/vaga.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.get("/vagas", listarVagas);
router.get("/vagas/:id", detalhesVaga);
router.post("/vagas", verificarToken, publicarVaga);

export default router;