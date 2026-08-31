import { Router } from "express";
import { loginGoogle } from "../controllers/auth.controller";

const router = Router();

router.post("/auth/google", loginGoogle);

export default router;