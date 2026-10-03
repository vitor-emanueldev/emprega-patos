import { Router } from "express";
import { listarVagas, detalhesVaga, publicarVaga, minhasVagas, atualizarVaga } from "../controllers/vaga.controller";
import { verificarToken } from "../middlewares/verificarToken";
import { validar } from "../middlewares/validar";
import { publicarVagaSchema, atualizarVagaSchema, filtrosVagaSchema } from "../validacao/schemas";

const router = Router();

router.get("/vagas", validar(filtrosVagaSchema, "query"), listarVagas);
// precisa vir antes de "/vagas/:id", senão o Express interpreta "minhas" como um :id
router.get("/vagas/minhas", verificarToken, minhasVagas);
router.get("/vagas/:id", detalhesVaga);
router.post("/vagas", verificarToken, validar(publicarVagaSchema), publicarVaga);
router.put("/vagas/:id", verificarToken, validar(atualizarVagaSchema), atualizarVaga);

export default router;
