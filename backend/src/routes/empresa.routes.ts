import { Router } from "express";
import { tornarEmpresa, buscarMinhaEmpresa } from "../controllers/usuario.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/empresas", verificarToken, tornarEmpresa);
router.get("/empresas/minha-empresa", verificarToken, buscarMinhaEmpresa);

export default router;