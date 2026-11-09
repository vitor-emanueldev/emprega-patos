// Vagas de EXEMPLO para o banco de TESTE (nunca roda no banco de produção).
//
// Uso, dentro da pasta backend:
//   node scripts/exemplos-teste.js criar    -> cria 12 estabelecimentos fictícios, cada um com 1 vaga, em Patos
//   node scripts/exemplos-teste.js apagar   -> apaga só o que este script criou
//
// Trava de segurança: compara o projeto do .env com o do .env.producao.
// Se forem o mesmo (ou se não der para conferir), não faz nada.

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

const DOMINIO_EXEMPLO = "@exemplo.mapvagas.test"; // e-mails fictícios: identificam o que é exemplo

function projetoDe(url) {
  try {
    const u = new URL(url);
    const usuario = decodeURIComponent(u.username);
    if (usuario.includes(".")) return usuario.split(".").slice(1).join("."); // pooler: postgres.<projeto>
    const host = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/); // conexão direta: db.<projeto>.supabase.co
    return host ? host[1] : null;
  } catch {
    return null;
  }
}

function sair(msg) {
  console.error("\n" + msg + "\n");
  process.exit(1);
}

function conferirBanco() {
  const raiz = path.join(__dirname, "..");
  const arqEnv = path.join(raiz, ".env");
  const arqProd = path.join(raiz, ".env.producao");
  if (!fs.existsSync(arqEnv)) sair("Não achei o .env na pasta backend.");
  if (!fs.existsSync(arqProd)) sair("Não achei o .env.producao. Sem ele não dá para garantir que o .env NÃO é a produção, então não vou rodar.");
  const env = dotenv.parse(fs.readFileSync(arqEnv));
  const prod = dotenv.parse(fs.readFileSync(arqProd));
  const url = env.DIRECT_URL || env.DATABASE_URL;
  const projetoTeste = projetoDe(url);
  const projetoProd = projetoDe(prod.DIRECT_URL || prod.DATABASE_URL);
  if (!projetoTeste || !projetoProd) sair("Não consegui identificar os projetos do Supabase nos arquivos .env. Nada foi feito.");
  if (projetoTeste === projetoProd) sair("PARADO: o .env está apontando para o banco de PRODUÇÃO. Nada foi feito.");
  console.log(`\nBanco de TESTE: projeto ${projetoTeste} (produção é ${projetoProd}, não será tocado)`);
  return url;
}

// Coordenadas aproximadas de bairros de Patos-PB (só para exemplo)
const B = {
  Centro: [-7.0236, -37.2781],
  "Brasília": [-7.0186, -37.2862],
  "Jatobá": [-7.0331, -37.2702],
  Salgadinho: [-7.0119, -37.2742],
  "Santo Antônio": [-7.0302, -37.2861],
  "Belo Horizonte": [-7.0398, -37.2763],
  Maternidade: [-7.0268, -37.2719],
  Liberdade: [-7.0158, -37.2948],
};
const perto = ([lat, lng], d1, d2) => [lat + d1 * 0.001, lng + d2 * 0.001];

// Uma vaga por estabelecimento, cada um num ponto diferente da cidade
const vaga = (v) => v;
const EMPRESAS = [
  { chave: "mercado", nomeEmpresa: "Supermercado Bom Preço Sertão", setor: "Comércio", bairro: "Centro", endereco: "Rua Pedro Firmino, 120", telefone: "83999990001",
    descricao: "Supermercado de bairro com padaria e açougue.", ponto: perto(B.Centro, 0.4, -0.3),
    vaga: vaga({ cargo: "Operador de Caixa", area: "Operador de Caixa", tipoContrato: "CLT", salario: 1518, cargaHoraria: "44h semanais, escala 6x1", quantidadeVagas: 3, pcd: "aceita",
      descricao: "Atendimento no caixa, registro de produtos e fechamento do caixa ao fim do turno.",
      responsabilidades: ["Registrar compras e receber pagamentos", "Conferir troco e fechar o caixa", "Atender os clientes com cordialidade"],
      requisitos: ["Ensino médio completo", "Facilidade com números"], beneficios: ["Vale-transporte", "Vale-alimentação", "Desconto em produtos"] }) },
  { chave: "atacado", nomeEmpresa: "Atacarejo Sertão Forte", setor: "Comércio", bairro: "Liberdade", endereco: "Av. Sólon de Lucena, 1500", telefone: "83999990007",
    descricao: "Atacado e varejo de alimentos e produtos de limpeza.", ponto: perto(B.Liberdade, 0.2, 0.3),
    vaga: vaga({ cargo: "Repositor de Mercadorias", area: "Repositor de Mercadorias", tipoContrato: "CLT", salario: 1518, cargaHoraria: "Seg a sáb, 7h às 15h20", quantidadeVagas: 2,
      descricao: "Reposição das gôndolas, controle de validade e organização do salão de vendas.",
      responsabilidades: ["Abastecer as prateleiras", "Conferir datas de validade", "Manter o setor organizado"],
      requisitos: ["Disponibilidade aos sábados"], beneficios: ["Vale-transporte", "Uniforme"] }) },
  { chave: "farmacia", nomeEmpresa: "Farmácia Popular do Bairro", setor: "Saúde", bairro: "Santo Antônio", endereco: "Rua Epitácio Pessoa, 640", telefone: "83999990008",
    descricao: "Farmácia com manipulação e entrega em domicílio.", ponto: perto(B["Santo Antônio"], -0.2, 0.2),
    vaga: vaga({ cargo: "Jovem Aprendiz - Atendimento", area: "Atendente", tipoContrato: "Jovem Aprendiz", salario: 760, cargaHoraria: "4h por dia, manhã", quantidadeVagas: 2,
      descricao: "Programa de aprendizagem com curso profissionalizante e prática no atendimento ao cliente.",
      responsabilidades: ["Apoiar o atendimento no balcão", "Ajudar na organização dos produtos"],
      requisitos: ["Ter entre 14 e 24 anos", "Estar estudando"], beneficios: ["Vale-transporte"] }) },
  { chave: "lanchonete", nomeEmpresa: "Lanchonete Sabor da Praça", setor: "Alimentação", bairro: "Brasília", endereco: "Rua Joaquim Pereira, 455", telefone: "83999990002",
    descricao: "Lanches, sucos e refeições rápidas.", ponto: perto(B["Brasília"], -0.2, 0.3),
    vaga: vaga({ cargo: "Chapeiro", area: "Chapeiro", tipoContrato: "CLT", salario: 1650, cargaHoraria: "Ter a dom, 16h às 23h", quantidadeVagas: 1,
      descricao: "Preparo de lanches na chapa seguindo o cardápio e as normas de higiene.",
      responsabilidades: ["Preparar lanches na chapa", "Manter a cozinha limpa", "Controlar o estoque de insumos"],
      requisitos: ["Experiência como chapeiro"], beneficios: ["Refeição no local", "Folga aos domingos"] }) },
  { chave: "pizzaria", nomeEmpresa: "Pizzaria Forno a Lenha", setor: "Alimentação", bairro: "Belo Horizonte", endereco: "Rua Manoel Mota, 210", telefone: "83999990009",
    descricao: "Pizzas artesanais no forno a lenha, salão e delivery.", ponto: perto(B["Belo Horizonte"], 0.3, -0.2),
    vaga: vaga({ cargo: "Atendente de Salão (meio período)", area: "Garçom", tipoContrato: "Meio período", salario: 900, cargaHoraria: "Qui a dom, 18h às 23h", quantidadeVagas: 1,
      descricao: "Atendimento no salão, anotação de pedidos e organização das mesas.",
      responsabilidades: ["Anotar pedidos", "Servir os clientes", "Organizar as mesas"],
      requisitos: ["Boa comunicação"], beneficios: ["Refeição no local"] }) },
  { chave: "clinica", nomeEmpresa: "Clínica Vida Sertaneja", setor: "Saúde", bairro: "Maternidade", endereco: "Rua Horácio Nóbrega, 88", telefone: "83999990003",
    descricao: "Clínica de atendimento ambulatorial e exames.", ponto: perto(B.Maternidade, 0.3, 0.2),
    vaga: vaga({ cargo: "Recepcionista", area: "Recepcionista", tipoContrato: "CLT", salario: 1600, cargaHoraria: "Seg a sex, 7h às 17h", quantidadeVagas: 1, pcd: "aceita",
      descricao: "Recepção de pacientes, agendamento de consultas e organização de prontuários.",
      responsabilidades: ["Receber e orientar pacientes", "Agendar consultas", "Atender telefone e WhatsApp"],
      requisitos: ["Ensino médio completo", "Informática básica"], beneficios: ["Vale-transporte", "Plano de saúde"] }) },
  { chave: "laboratorio", nomeEmpresa: "Laboratório Diagnóstico Sertão", setor: "Saúde", bairro: "Centro", endereco: "Rua Grão Mogol, 35", telefone: "83999990010",
    descricao: "Exames laboratoriais com coleta domiciliar.", ponto: perto(B.Centro, -0.6, -0.5),
    vaga: vaga({ cargo: "Técnico de Enfermagem", area: "Técnico de Enfermagem", tipoContrato: "CLT", salario: 2100, cargaHoraria: "Plantão 12x36", quantidadeVagas: 2,
      descricao: "Coleta de exames e apoio no atendimento aos pacientes.",
      responsabilidades: ["Realizar coletas", "Registrar atendimentos", "Organizar materiais"],
      requisitos: ["Curso técnico em enfermagem", "COREN ativo"], beneficios: ["Vale-transporte", "Plano de saúde", "Plano odontológico"] }) },
  { chave: "construtora", nomeEmpresa: "Construtora Pedra Sertão", setor: "Construção", bairro: "Jatobá", endereco: "Rua José Genuíno, 300", telefone: "83999990004",
    descricao: "Obras residenciais e comerciais em Patos e região.", ponto: perto(B["Jatobá"], -0.3, -0.2),
    vaga: vaga({ cargo: "Ajudante de Pedreiro", area: "Ajudante de Pedreiro", tipoContrato: "Temporário", salario: 1600, cargaHoraria: "Seg a sex, 7h às 16h", quantidadeVagas: 4,
      descricao: "Contrato de 3 meses para obra residencial.",
      responsabilidades: ["Preparar massa e materiais", "Auxiliar o pedreiro", "Manter a obra limpa"],
      requisitos: ["Disposição para trabalho pesado"], beneficios: ["Vale-transporte", "Uniforme"] }) },
  { chave: "eletrica", nomeEmpresa: "Elétrica Luz do Sertão", setor: "Serviços", bairro: "Salgadinho", endereco: "Rua Bossuet Wanderley, 410", telefone: "83999990011",
    descricao: "Instalações e manutenção elétrica residencial e comercial.", ponto: perto(B.Salgadinho, -0.4, 0.5),
    vaga: vaga({ cargo: "Eletricista", area: "Eletricista", tipoContrato: "PJ / Freelance", salario: 2800, cargaHoraria: "Por serviço", quantidadeVagas: 1,
      descricao: "Instalações elétricas em residências e pequenos comércios.",
      responsabilidades: ["Fazer instalações elétricas", "Ler projetos elétricos"],
      requisitos: ["Curso NR-10", "Experiência comprovada"], beneficios: [] }) },
  { chave: "loja", nomeEmpresa: "Loja Vitrine Calçados", setor: "Comércio", bairro: "Centro", endereco: "Rua Solon de Lucena, 210", telefone: "83999990005",
    descricao: "Calçados e acessórios no centro de Patos.", ponto: perto(B.Centro, 0.9, 0.6),
    vaga: vaga({ cargo: "Vendedor(a)", area: "Vendedor", tipoContrato: "CLT", salario: 1518, cargaHoraria: "44h semanais", quantidadeVagas: 2,
      descricao: "Atendimento e vendas na loja, com comissão sobre as vendas.",
      responsabilidades: ["Atender e orientar clientes", "Organizar a vitrine", "Bater metas de vendas"],
      requisitos: ["Gostar de vendas"], beneficios: ["Comissão", "Bônus por metas", "Vale-transporte"] }) },
  { chave: "distribuidora", nomeEmpresa: "Distribuidora Sertão Bebidas", setor: "Comércio", bairro: "Liberdade", endereco: "Rua Lindolfo Pires, 900", telefone: "83999990012",
    descricao: "Distribuição de bebidas para bares e mercados da região.", ponto: perto(B.Liberdade, -0.6, -0.4),
    vaga: vaga({ cargo: "Auxiliar de Estoque (vaga PcD)", area: "Estoquista", tipoContrato: "CLT", salario: 1518, cargaHoraria: "Seg a sex, 8h às 17h", quantidadeVagas: 1, pcd: "exclusiva",
      descricao: "Vaga exclusiva para pessoas com deficiência. Organização e controle do estoque.",
      responsabilidades: ["Receber e conferir mercadorias", "Organizar o estoque"],
      requisitos: [], beneficios: ["Vale-transporte", "Vale-alimentação"] }) },
  { chave: "agencia", nomeEmpresa: "Agência Conecta Digital", setor: "Tecnologia", bairro: "Salgadinho", endereco: "Rua Peregrino Filho, 77", telefone: "83999990006",
    descricao: "Marketing digital e atendimento online para empresas do Sertão.", ponto: perto(B.Salgadinho, 0.6, -0.6),
    vaga: vaga({ cargo: "Atendente de Telemarketing (home office)", area: "Atendente de Telemarketing", tipoContrato: "CLT", salario: 1518, cargaHoraria: "6h por dia", quantidadeVagas: 3, modalidade: "remoto",
      descricao: "Atendimento a clientes por telefone e WhatsApp, trabalhando de casa.",
      responsabilidades: ["Atender clientes por telefone e chat", "Registrar atendimentos no sistema"],
      requisitos: ["Computador e internet em casa", "Boa escrita"], beneficios: ["Auxílio internet"] }) },
];

async function criar(prisma) {
  const ja = await prisma.usuario.count({ where: { email: { endsWith: DOMINIO_EXEMPLO } } });
  if (ja > 0) sair(`Os exemplos já existem (${ja} empresas). Rode "apagar" antes de criar de novo.`);

  let totalVagas = 0;
  for (const e of EMPRESAS) {
    const [lat, lng] = e.ponto;
    await prisma.usuario.create({
      data: {
        email: `${e.chave}${DOMINIO_EXEMPLO}`,
        nome: `${e.nomeEmpresa} (exemplo)`,
        empresa: {
          create: {
            nomeEmpresa: e.nomeEmpresa,
            setor: e.setor,
            bairro: e.bairro,
            endereco: e.endereco,
            telefone: e.telefone,
            descricao: e.descricao,
            latitude: lat,
            longitude: lng,
            verificacao: "aprovada",
            verificadaEm: new Date(),
            vagas: {
              create: [e.vaga].map((v) => ({
                cargo: v.cargo,
                descricao: v.descricao,
                salario: v.salario,
                endereco: e.endereco,
                bairro: e.bairro,
                latitude: lat,
                longitude: lng,
                requisitos: v.requisitos || [],
                responsabilidades: v.responsabilidades,
                beneficios: v.beneficios || [],
                tipoContrato: v.tipoContrato,
                area: v.area,
                cargaHoraria: v.cargaHoraria,
                quantidadeVagas: v.quantidadeVagas || 1,
                pcd: v.pcd || "nao",
                modalidade: v.modalidade || "presencial",
                status: "aberta",
              })),
            },
          },
        },
      },
    });
    totalVagas += 1;
    console.log(`  + ${e.nomeEmpresa} (${e.bairro}): ${e.vaga.cargo}`);
  }
  console.log(`\nPronto: ${EMPRESAS.length} empresas e ${totalVagas} vagas de exemplo criadas.`);
}

async function apagar(prisma) {
  const usuarios = await prisma.usuario.findMany({
    where: { email: { endsWith: DOMINIO_EXEMPLO } },
    select: { id: true, empresa: { select: { id: true } } },
  });
  if (usuarios.length === 0) return console.log("\nNão há exemplos para apagar.");
  const empresaIds = usuarios.map((u) => u.empresa?.id).filter(Boolean);
  const vagas = await prisma.vaga.findMany({ where: { empresaId: { in: empresaIds } }, select: { id: true } });
  const vagaIds = vagas.map((v) => v.id);

  await prisma.$transaction([
    prisma.candidatura.deleteMany({ where: { vagaId: { in: vagaIds } } }),
    prisma.vagaSalva.deleteMany({ where: { vagaId: { in: vagaIds } } }),
    prisma.vaga.deleteMany({ where: { id: { in: vagaIds } } }),
    prisma.empresa.deleteMany({ where: { id: { in: empresaIds } } }),
    prisma.usuario.deleteMany({ where: { id: { in: usuarios.map((u) => u.id) } } }),
  ]);
  console.log(`\nApagados: ${empresaIds.length} empresas e ${vagaIds.length} vagas de exemplo (e as candidaturas feitas nelas).`);
}

async function principal() {
  const comando = process.argv[2];
  if (!["criar", "apagar"].includes(comando)) sair("Use: node scripts/exemplos-teste.js criar | apagar");
  const url = conferirBanco();
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    if (comando === "criar") await criar(prisma);
    else await apagar(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((e) => {
  console.error("\nErro:", e && e.message ? e.message : e);
  process.exit(1);
});
