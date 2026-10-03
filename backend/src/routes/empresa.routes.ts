import { Router } from "express";
import { tornarEmpresa, buscarMinhaEmpresa, atualizarMinhaEmpresa } from "../controllers/empresa.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { validar } from "../middlewares/validar";
import { empresaSchema } from "../validacao/schemas";

const router = Router();

router.post("/empresas", verificarToken, validar(empresaSchema), tornarEmpresa);
router.get("/empresas/minha-empresa", verificarToken, buscarMinhaEmpresa);
router.put("/empresas/minha-empresa", verificarToken, validar(empresaSchema), atualizarMinhaEmpresa);

export default router;
