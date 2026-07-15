import express from "express";
import cors from "cors";
import { prisma } from "./prisma";
import authRoutes from "./routes/auth.routes";



const app = express();
const PORTA = 3001;


app.use(cors());      
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend do Emprega Patos rodando!");
});

app.get("/teste-banco", async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();
    res.json({ status: "conectado", totalUsuarios });
  } catch (erro) {
    res.status(500).json({ status: "erro", detalhe: String(erro) });
  }
});

app.use(authRoutes);

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});