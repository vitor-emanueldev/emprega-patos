import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import empresaRoutes from "./routes/empresa.routes";
import vagasRoutes from "./routes/vaga.routes";
import candidatoRoutes from "./routes/candidato.routes";
import estatisticasRoutes from "./routes/estatisticas.routes";
import candidaturaRoutes from "./routes/candidatura.routes";
import { limitarRequisicoes } from "./middlewares/limitarRequisicoes";

// ─── Variáveis obrigatórias: se faltar alguma, o servidor nem sobe ───
const VARIAVEIS_OBRIGATORIAS = ["DATABASE_URL", "JWT_SECRET", "GOOGLE_CLIENT_ID"];
const faltando = VARIAVEIS_OBRIGATORIAS.filter((nome) => !process.env[nome]);
if (faltando.length > 0) {
  console.error(`Variáveis de ambiente faltando: ${faltando.join(", ")}`);
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Aviso: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas. O envio de fotos ficará desativado.");
}

const app = express();
const PORTA = Number(process.env.PORT) || 3001;

// Atrás de um proxy (Render, Railway, etc.) o IP real vem no X-Forwarded-For.
// Só ative (TRUST_PROXY=true) quando estiver hospedado atrás de um proxy,
// senão qualquer um poderia falsificar o IP e driblar o limite de requisições.
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

// Cabeçalhos de segurança padrão (a API só devolve JSON)
app.use(helmet());

// ─── CORS: só o nosso frontend pode chamar a API pelo navegador ───
function normalizarOrigem(valor: string): string {
  const limpo = valor.trim().replace(/\/+$/, "");
  if (!limpo) return "";
  return /^https?:\/\//.test(limpo) ? limpo : `https://${limpo}`;
}

const origensPermitidas = new Set(
  [
    ...(process.env.FRONTEND_URL || "").split(","),
    ...(process.env.CORS_ORIGENS_EXTRAS || "").split(","),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .map(normalizarOrigem)
    .filter(Boolean)
);

app.use(
  cors({
    origin(origem, callback) {
      // Requisições sem Origin (ex: Postman, servidor-servidor) não passam pelo CORS do navegador
      if (!origem || origensPermitidas.has(origem)) return callback(null, true);
      return callback(null, false);
    },
  })
);

app.use(express.json({ limit: "100kb" }));

// ─── Limites de requisição por IP ───
// Geral: generoso, porque operadoras de celular colocam muita gente no mesmo IP
app.use(limitarRequisicoes({ janelaMs: 15 * 60 * 1000, maximo: 1000 }));
// Login: bem mais restrito
app.use(
  "/auth",
  limitarRequisicoes({
    janelaMs: 15 * 60 * 1000,
    maximo: 30,
    mensagem: "Muitas tentativas de login. Aguarde alguns minutos.",
  })
);
// Escritas (criar, editar, apagar)
const limiteEscrita = limitarRequisicoes({ janelaMs: 15 * 60 * 1000, maximo: 150 });
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return limiteEscrita(req, res, next);
  }
  return next();
});

app.get("/", (req, res) => {
  res.send("API do MapVagas rodando!");
});

app.use(authRoutes);
app.use(empresaRoutes);
app.use(vagasRoutes);
app.use(candidatoRoutes);
app.use(estatisticasRoutes);
app.use(candidaturaRoutes);

// ─── Rota não encontrada ───
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// ─── Tratamento central de erros: nunca devolve detalhes internos ao cliente ───
app.use((erro: any, req: Request, res: Response, next: NextFunction) => {
  if (erro?.type === "entity.too.large") {
    return res.status(413).json({ erro: "Dados enviados são grandes demais." });
  }
  if (erro?.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido." });
  }
  console.error("Erro não tratado:", erro);
  return res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
