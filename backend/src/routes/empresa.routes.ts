import { Router } from "express";
import { tornarEmpresa, buscarMinhaEmpresa, atualizarMinhaEmpresa } from "../controllers/usuario.controller";
import { verificarToken } from "../middlewares/verificarToken";

const router = Router();

router.post("/empresas", verificarToken, tornarEmpresa);
router.get("/empresas/minha-empresa", verificarToken, buscarMinhaEmpresa);
router.put("/empresas/minha-empresa", verificarToken, atualizarMinhaEmpresa);

export default router;