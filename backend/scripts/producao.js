// Ferramenta de manutenção do banco de PRODUÇÃO (o banco do site real).
//
// Uso, dentro da pasta backend:
//   node scripts/producao.js ver      -> mostra quantos registros existem (não altera nada)
//   node scripts/producao.js backup   -> salva uma cópia de TODOS os dados em backups/
//   node scripts/producao.js apagar   -> apaga TODOS os dados (pede confirmação e exige backup recente)
//
// As credenciais vêm do arquivo .env.producao (o .env normal aponta para o banco de TESTE).
// A tabela de migrations (_prisma_migrations) nunca é tocada: a estrutura do banco continua igual.

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

// Ordem: tabelas "filhas" primeiro
const TABELAS = [
  "Reporte",
  "Candidatura",
  "VagaSalva",
  "Vaga",
  "CandidatoExperiencia",
  "CandidatoCurso",
  "CandidatoFormacao",
  "Candidato",
  "Empresa",
  "Usuario",
];

const PASTA_BACKUP = path.join(__dirname, "..", "backups");
const ARQUIVO_ENV = path.join(__dirname, "..", ".env.producao");
const VALIDADE_BACKUP_MS = 2 * 60 * 60 * 1000; // backup precisa ter no máximo 2 horas

function sair(mensagem) {
  console.error("\n" + mensagem + "\n");
  process.exit(1);
}

function lerConexao() {
  if (!fs.existsSync(ARQUIVO_ENV)) sair("Não achei o arquivo .env.producao na pasta backend.");
  const env = dotenv.parse(fs.readFileSync(ARQUIVO_ENV));
  const url = env.DIRECT_URL || env.DATABASE_URL;
  if (!url) sair("O .env.producao não tem DIRECT_URL nem DATABASE_URL.");
  let usuario = "", servidor = "";
  try {
    const u = new URL(url);
    usuario = decodeURIComponent(u.username);
    servidor = u.host;
  } catch {
    sair("Não consegui ler o endereço do banco no .env.producao.");
  }
  // No Supabase o usuário é "postgres.<id-do-projeto>"
  const projeto = usuario.includes(".") ? usuario.split(".").slice(1).join(".") : "(não identificado)";
  return { url, projeto, servidor };
}

async function contar(prisma) {
  const totais = {};
  for (const t of TABELAS) {
    const [linha] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${t}"`);
    totais[t] = Number(linha.n);
  }
  return totais;
}

function mostrarTotais(totais) {
  for (const t of TABELAS) console.log(`  ${t.padEnd(22)} ${String(totais[t]).padStart(6)}`);
  const soma = Object.values(totais).reduce((a, b) => a + b, 0);
  console.log(`  ${"TOTAL".padEnd(22)} ${String(soma).padStart(6)}`);
}

function carimbo() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function backupMaisRecente() {
  if (!fs.existsSync(PASTA_BACKUP)) return null;
  const arquivos = fs
    .readdirSync(PASTA_BACKUP)
    .filter((n) => /^producao-.*\.json$/.test(n))
    .map((n) => ({ nome: n, caminho: path.join(PASTA_BACKUP, n), mtime: fs.statSync(path.join(PASTA_BACKUP, n)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return arquivos[0] || null;
}

function perguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolver) => rl.question(texto, (r) => { rl.close(); resolver(r.trim()); }));
}

async function ver(prisma, conexao) {
  const totais = await contar(prisma);
  console.log("\nRegistros no banco de PRODUÇÃO:");
  mostrarTotais(totais);
  const empresas = await prisma.$queryRawUnsafe(`SELECT "nomeEmpresa" FROM "Empresa" ORDER BY "createdAt" LIMIT 50`);
  if (empresas.length) console.log("\nEmpresas: " + empresas.map((e) => e.nomeEmpresa).join(", "));
  return totais;
}

async function backup(prisma, conexao) {
  const dados = { geradoEm: new Date().toISOString(), projeto: conexao.projeto, tabelas: {} };
  for (const t of TABELAS) dados.tabelas[t] = await prisma.$queryRawUnsafe(`SELECT * FROM "${t}"`);
  const totais = Object.fromEntries(TABELAS.map((t) => [t, dados.tabelas[t].length]));
  dados.totais = totais;

  fs.mkdirSync(PASTA_BACKUP, { recursive: true });
  const arquivo = path.join(PASTA_BACKUP, `producao-${carimbo()}.json`);
  fs.writeFileSync(arquivo, JSON.stringify(dados, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2));

  // Confere se o arquivo foi gravado e lê de volta
  const relido = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  for (const t of TABELAS) {
    if ((relido.tabelas[t] || []).length !== totais[t]) sair(`O backup ficou incompleto na tabela ${t}. Nada foi apagado.`);
  }

  console.log("\nBackup salvo e conferido:");
  mostrarTotais(totais);
  console.log(`\n  Arquivo: ${arquivo}`);
  console.log(`  Tamanho: ${(fs.statSync(arquivo).size / 1024).toFixed(1)} KB`);
  console.log("\n  Atenção: esse arquivo tem dados pessoais. Guarde em lugar seguro e não envie para ninguém.");
}

async function apagar(prisma, conexao) {
  const totais = await ver(prisma, conexao);

  const ultimo = backupMaisRecente();
  if (!ultimo) sair("Não encontrei nenhum backup. Rode primeiro: node scripts/producao.js backup");
  if (Date.now() - ultimo.mtime > VALIDADE_BACKUP_MS) {
    sair(`O backup mais recente (${ultimo.nome}) tem mais de 2 horas. Rode o backup de novo antes de apagar.`);
  }
  const conteudo = JSON.parse(fs.readFileSync(ultimo.caminho, "utf8"));
  if (conteudo.projeto !== conexao.projeto) sair("O backup mais recente é de outro banco. Rode o backup de novo.");
  for (const t of TABELAS) {
    if ((conteudo.tabelas[t] || []).length !== totais[t]) {
      sair(`Os dados mudaram desde o backup (tabela ${t}). Rode o backup de novo antes de apagar.`);
    }
  }
  console.log(`\nBackup conferido: ${ultimo.nome}`);

  console.log("\n================  ATENÇÃO  ================");
  console.log("Isto vai APAGAR TODOS os dados do banco de PRODUÇÃO (usuários, empresas, vagas, candidaturas...).");
  console.log("Não dá para desfazer pelo site. A estrutura (tabelas) continua.");
  console.log("============================================\n");
  const frase = `APAGAR ${conexao.projeto}`;
  const resposta = await perguntar(`Para confirmar, digite exatamente:  ${frase}\n> `);
  if (resposta !== frase) sair("Confirmação diferente. Nada foi apagado.");

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABELAS.map((t) => `"${t}"`).join(", ")} CASCADE`);

  console.log("\nPronto. Como ficou:");
  mostrarTotais(await contar(prisma));
}

async function principal() {
  const comando = process.argv[2];
  if (!["ver", "backup", "apagar"].includes(comando)) {
    sair("Use: node scripts/producao.js ver | backup | apagar");
  }

  const conexao = lerConexao();
  console.log(`\nBanco de PRODUÇÃO (lido do .env.producao)`);
  console.log(`  Servidor: ${conexao.servidor}`);
  console.log(`  Projeto:  ${conexao.projeto}   <- confira se é o Reference ID do projeto de PRODUÇÃO no Supabase`);

  const prisma = new PrismaClient({ datasources: { db: { url: conexao.url } } });
  try {
    if (comando === "ver") await ver(prisma, conexao);
    if (comando === "backup") await backup(prisma, conexao);
    if (comando === "apagar") await apagar(prisma, conexao);
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((erro) => {
  console.error("\nErro:", erro && erro.message ? erro.message : erro);
  process.exit(1);
});
