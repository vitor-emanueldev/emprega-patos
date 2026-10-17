import { Router } from "express";
import { calcularRota } from "../controllers/rota.controller";
import { limitarRequisicoes } from "../middlewares/limitarRequisicoes";

const router = Router();

// A cota grátis do serviço de rotas é limitada: no máximo 40 rotas a cada 15 min por IP
router.get(
  "/rota",
  limitarRequisicoes({ janelaMs: 15 * 60 * 1000, maximo: 40, mensagem: "Muitas rotas em pouco tempo. Aguarde alguns minutos." }),
  calcularRota
);

export default router;
