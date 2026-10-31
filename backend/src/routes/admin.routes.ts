import { Router } from "express";
import { verificarToken } from "../middlewares/verificarToken";
import { verificarAdmin } from "../middlewares/verificarAdmin";
import { validar } from "../middlewares/validar";
import { recusarEmpresaSchema } from "../validacao/schemas";
import { aprovarEmpresa, consultarCnpjEmpresa, listarEmpresasAdmin, recusarEmpresa, souAdmin } from "../controllers/admin.controller";

// Tudo aqui exige login E e-mail na lista ADMIN_EMAILS
const router = Router();

router.get("/admin/eu", verificarToken, verificarAdmin, souAdmin);
router.get("/admin/empresas", verificarToken, verificarAdmin, listarEmpresasAdmin);
router.patch("/admin/empresas/:id/aprovar", verificarToken, verificarAdmin, aprovarEmpresa);
router.post("/admin/empresas/:id/consultar-cnpj", verificarToken, verificarAdmin, consultarCnpjEmpresa);
router.patch("/admin/empresas/:id/recusar", verificarToken, verificarAdmin, validar(recusarEmpresaSchema), recusarEmpresa);

export default router;
