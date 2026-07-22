import { Router } from "express";
import { listarVagas, detalhesVaga } from "../controllers/vaga.controller";

const router = Router();

router.get("/vagas", listarVagas);
router.get("/vagas/:id", detalhesVaga);

export default router;