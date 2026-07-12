import express from "express";
import { prisma } from "./prisma";

const app = express();
const PORTA = 3001;

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

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});