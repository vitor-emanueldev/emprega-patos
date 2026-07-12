import { Router } from "express";
import { cadastrar, login } from "../controllers/auth.controller";

const router = Router();

router.post("/auth/cadastro", cadastrar);
router.post("/auth/login", login);

export default router;