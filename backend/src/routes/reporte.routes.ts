import { Router } from "express";
import { verificarToken } from "../middlewares/verificarToken";
import { verificarAdmin } from "../middlewares/verificarAdmin";
import { validar } from "../middlewares/validar";
import { limitarRequisicoes } from "../middlewares/limitarRequisicoes";
import { criarReporteSchema, situacaoReporteSchema } from "../validacao/schemas";
import { atualizarReporteAdmin, criarReporte, listarReportesAdmin } from "../controllers/reporte.controller";

const router = Router();

// Aberto a qualquer pessoa (logada ou não), mas com limite para evitar spam: 5 a cada 15 min por IP
router.post(
  "/reportes",
  limitarRequisicoes({ janelaMs: 15 * 60 * 1000, maximo: 5, mensagem: "Você já enviou vários reportes. Aguarde alguns minutos." }),
  validar(criarReporteSchema),
  criarReporte
);

// Administração
router.get("/admin/reportes", verificarToken, verificarAdmin, listarReportesAdmin);
router.patch("/admin/reportes/:id", verificarToken, verificarAdmin, validar(situacaoReporteSchema), atualizarReporteAdmin);

export default router;
