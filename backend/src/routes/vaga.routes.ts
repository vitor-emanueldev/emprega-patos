import { Router } from "express";
import { listarVagas, detalhesVaga, publicarVaga, minhasVagas, atualizarVaga} from "../controllers/vaga.controller";
import { verificarToken } from "../middlewares/verificarToken";


const router = Router();

router.get("/vagas", listarVagas);
// precisa vir antes de "/vagas/:id", senão o Express interpreta "minhas" como um :id
router.get("/vagas/minhas", verificarToken, minhasVagas);
router.get("/vagas/:id", detalhesVaga);
router.post("/vagas", verificarToken, publicarVaga);
router.put("/vagas/:id", verificarToken, atualizarVaga);

export default router;