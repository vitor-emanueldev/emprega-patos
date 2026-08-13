import { Router } from "express";
import { buscarEstatisticas } from "../controllers/estatisticas.controller";

const router = Router();

router.get("/estatisticas", buscarEstatisticas);

export default router;