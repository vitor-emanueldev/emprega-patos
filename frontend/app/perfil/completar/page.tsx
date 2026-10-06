"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import FotoUpload from "@/components/FotoUpload";
import { useAuth } from "@/context/AuthContext";
import { tornarCandidato, atualizarMinhaFicha, buscarMinhaFicha } from "@/lib/api";
import { formatTelefone, formatSalario, parseSalario, telefoneValido } from "@/lib/masks";
import { buscarSugestoesHabilidade } from "@/lib/habilidadesCatalogo";
import { CATEGORIAS_VAGA } from "@/lib/categoriasVagas";
import { DURACOES_EXPERIENCIA, NIVEIS_ESCOLARIDADE, TURNOS } from "@/lib/curriculo";

type Experiencia = { cargo: string; empresa: string; duracao: string; atual: boolean; descricao: string };
type Curso = { nomeCurso: string; instituicao: string; anoConclusao: string };

const ETAPAS = [
  { numero: 1, titulo: "Você" },
  { numero: 2, titulo: "O que procura" },
  { numero: 3, titulo: "Experiência" },
  { numero: 4, titulo: "Formação e extras" },
] as const;

const LIMITE_SOBRE_MIM = 1500;

const classeCampo =
  "w-full rounded-md bg-white border border-slate-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D6FA5]";
const classeRotulo = "block text-sm text-[#0F2C4A] font-medium mb-1";

function formatSalarioDeNumero(numero: number | null | undefined) {
  if (numero === null || numero === undefined) return "";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Botões Sim / Não (mais fácil de tocar no celular do que "radio")
function SimNao({
  valor,
  aoMudar,
}: {
  valor: boolean | null;
  aoMudar: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((opcao) => (
        <button
          key={String(opcao)}
          type="button"
          onClick={() => aoMudar(opcao)}
          className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
            valor === opcao
              ? "bg-[#0F2C4A] text-white border-[#0F2C4A]"
              : "bg-white text-[#0F2C4A] border-slate-200 hover:bg-slate-50"
          }`}
        >
          {opcao ? "Sim" : "Não"}
        </button>
      ))}
    </div>
  );
}

function CompletarPerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, usuario } = useAuth();
  const redirect = searchParams.get("redirect");

  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);

  // ── Etapa 1: Você ──
  const [fotoUrl, setFotoUrl] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState(true);
  const [bairro, setBairro] = useState("");

  // ── Etapa 2: O que procura ──
  const [cargoDesejado, setCargoDesejado] = useState("");
  const [areaInteresse, setAreaInteresse] = useState("");
  const [turnos, setTurnos] = useState<string[]>([]);
  const [disponivelFimDeSemana, setDisponivelFimDeSemana] = useState<boolean | null>(null);
  const [inicioImediato, setInicioImediato] = useState<boolean | null>(null);
  const [pretensaoSalarial, setPretensaoSalarial] = useState("");
  const [sobreMim, setSobreMim] = useState("");

  // ── Etapa 3: Experiência ──
  const [primeiroEmprego, setPrimeiroEmprego] = useState(false);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);

  // ── Etapa 4: Formação e extras ──
  const [escolaridade, setEscolaridade] = useState("");
  const [estudandoAtualmente, setEstudandoAtualmente] = useState<boolean | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [habilidadeDigitada, setHabilidadeDigitada] = useState("");
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [possuiCnh, setPossuiCnh] = useState<boolean | null>(null);
  const [categoriaCnh, setCategoriaCnh] = useState("");
  const [possuiVeiculo, setPossuiVeiculo] = useState<boolean | null>(null);
  const [referenciaNome, setReferenciaNome] = useState("");
  const [referenciaTelefone, setReferenciaTelefone] = useState("");
  const [referenciaRelacao, setReferenciaRelacao] = useState("");

  const sugestoesHabilidade = buscarSugestoesHabilidade(habilidadeDigitada, habilidades);

  useEffect(() => {
    async function carregarSeExistir() {
      if (!token) {
        setCarregandoInicial(false);
        return;
      }

      try {
        const dados = await buscarMinhaFicha(token);
        if (!dados) return;

        setModoEdicao(true);
        setFotoUrl(dados.fotoUrl || "");
        setDataNascimento(dados.dataNascimento ? dados.dataNascimento.split("T")[0] : "");
        setTelefone(dados.telefone ? formatTelefone(dados.telefone) : "");
        setTelefoneWhatsapp(dados.telefoneWhatsapp ?? true);
        setBairro(dados.bairro || "");

        setCargoDesejado(dados.cargoDesejado || "");
        setAreaInteresse(dados.areaInteresse || "");
        setTurnos(dados.turnos || []);
        setDisponivelFimDeSemana(dados.disponivelFimDeSemana ?? null);
        setInicioImediato(dados.inicioImediato ?? null);
        setPretensaoSalarial(formatSalarioDeNumero(dados.pretensaoSalarial));
        setSobreMim(dados.sobreMim || dados.diferencial || "");

        setPrimeiroEmprego(Boolean(dados.primeiroEmprego));
        setExperiencias(
          (dados.experiencias || []).map((exp) => ({
            cargo: exp.cargo || "",
            empresa: exp.empresa || "",
            duracao: exp.duracao || "",
            atual: Boolean(exp.atual),
            descricao: exp.descricao || "",
          }))
        );

        setEscolaridade(dados.escolaridade || dados.formacoes?.find((f) => f.nivelEscolaridade)?.nivelEscolaridade || "");
        setEstudandoAtualmente(dados.estudandoAtualmente ?? null);
        setCursos(
          (dados.cursos || []).map((curso) => ({
            nomeCurso: curso.nomeCurso || "",
            instituicao: curso.instituicao || "",
            anoConclusao: curso.anoConclusao ? String(curso.anoConclusao) : "",
          }))
        );
        setHabilidades(dados.habilidades || []);
        setPossuiCnh(dados.possuiCnh ?? null);
        setCategoriaCnh(dados.categoriaCnh || "");
        setPossuiVeiculo(dados.possuiVeiculo ?? null);
        setReferenciaNome(dados.referenciaNome || "");
        setReferenciaTelefone(dados.referenciaTelefone ? formatTelefone(dados.referenciaTelefone) : "");
        setReferenciaRelacao(dados.referenciaRelacao || "");
      } catch {
        // se der erro ao buscar, segue como cadastro novo — sem travar o usuário
      } finally {
        setCarregandoInicial(false);
      }
    }

    carregarSeExistir();
  }, [token]);

  // ── Ajudantes das listas ──
  function alternarTurno(valor: string) {
    setTurnos((atual) => (atual.includes(valor) ? atual.filter((t) => t !== valor) : [...atual, valor]));
  }

  function adicionarHabilidade(valor: string) {
    const nova = valor.trim();
    if (!nova) return;
    if (!habilidades.some((item) => item.toLowerCase() === nova.toLowerCase())) {
      setHabilidades([...habilidades, nova]);
    }
    setHabilidadeDigitada("");
  }

  function atualizarExperiencia(indice: number, campo: keyof Experiencia, valor: string | boolean) {
    setExperiencias((prev) => prev.map((exp, i) => (i === indice ? { ...exp, [campo]: valor } : exp)));
  }

  function atualizarCurso(indice: number, campo: keyof Curso, valor: string) {
    setCursos((prev) => prev.map((curso, i) => (i === indice ? { ...curso, [campo]: valor } : curso)));
  }

  // ── Validação por etapa ──
  function validarEtapa(numero: number): string | null {
    if (numero === 1) {
      if (!dataNascimento) return "Informe sua data de nascimento.";
      if (!telefone) return "Informe um telefone de contato.";
      if (!telefoneValido(telefone)) return "Telefone inválido. Use DDD + número, ex: (83) 99999-9999.";
      if (!bairro.trim()) return "Informe o bairro onde você mora.";
    }
    if (numero === 2) {
      if (!cargoDesejado.trim()) return "Conte que tipo de trabalho você procura.";
      if (turnos.length === 0) return "Marque pelo menos um turno em que você pode trabalhar.";
    }
    if (numero === 3 && !primeiroEmprego) {
      const preenchidas = experiencias.filter((e) => e.cargo.trim() || e.empresa.trim() || e.descricao.trim());
      if (preenchidas.some((e) => !e.cargo.trim() || !e.empresa.trim())) {
        return "Em cada experiência, informe a função e o local.";
      }
    }
    if (numero === 4) {
      if (!escolaridade) return "Selecione sua escolaridade.";
      if (habilidades.length === 0) return "Adicione pelo menos uma habilidade.";
      if (referenciaTelefone && !telefoneValido(referenciaTelefone)) return "Telefone da referência inválido.";
    }
    return null;
  }

  function irPara(destino: 1 | 2 | 3 | 4) {
    setErro("");
    // Avançar exige a etapa atual válida; voltar é sempre livre
    if (destino > etapa) {
      for (let n = etapa; n < destino; n++) {
        const problema = validarEtapa(n);
        if (problema) {
          setEtapa(n as 1 | 2 | 3 | 4);
          setErro(problema);
          return;
        }
      }
    }
    setEtapa(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finalizar() {
    setErro("");
    for (let n = 1; n <= 4; n++) {
      const problema = validarEtapa(n);
      if (problema) {
        setEtapa(n as 1 | 2 | 3 | 4);
        setErro(problema);
        return;
      }
    }

    if (!token) {
      setErro("Você precisa estar logado para salvar seu currículo.");
      router.push("/login");
      return;
    }

    setSalvando(true);
    try {
      const dadosParaEnviar = {
        fotoUrl: fotoUrl || null,
        dataNascimento,
        telefone,
        telefoneWhatsapp,
        bairro: bairro.trim(),
        cargoDesejado: cargoDesejado.trim(),
        areaInteresse: areaInteresse.trim() || undefined,
        turnos,
        disponivelFimDeSemana,
        inicioImediato,
        pretensaoSalarial: parseSalario(pretensaoSalarial),
        sobreMim: sobreMim.trim(),
        primeiroEmprego,
        experiencias: primeiroEmprego
          ? []
          : experiencias
              .filter((e) => e.cargo.trim() && e.empresa.trim())
              .map((e) => ({
                cargo: e.cargo.trim(),
                empresa: e.empresa.trim(),
                duracao: e.duracao || null,
                atual: e.atual,
                descricao: e.descricao.trim() || undefined,
              })),
        escolaridade: escolaridade || null,
        estudandoAtualmente,
        formacoes: [], // substituído pelo campo "escolaridade"
        cursos: cursos
          .filter((c) => c.nomeCurso.trim())
          .map((c) => ({
            nomeCurso: c.nomeCurso.trim(),
            instituicao: c.instituicao.trim() || undefined,
            anoConclusao: c.anoConclusao ? Number(c.anoConclusao) : null,
          })),
        habilidades,
        possuiCnh,
        categoriaCnh: possuiCnh ? categoriaCnh.trim().toUpperCase() || undefined : undefined,
        possuiVeiculo,
        referenciaNome: referenciaNome.trim(),
        referenciaTelefone: referenciaNome.trim() ? referenciaTelefone : "",
        referenciaRelacao: referenciaNome.trim() ? referenciaRelacao.trim() : "",
      };

      if (modoEdicao) {
        await atualizarMinhaFicha(token, dadosParaEnviar);
      } else {
        await tornarCandidato(token, dadosParaEnviar);
      }

      router.push(redirect || "/perfil/candidato");
    } catch (erroCapturado: any) {
      setErro(erroCapturado.message || "Não foi possível salvar seu currículo.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoInicial) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8">
          <h1 className="text-2xl font-bold text-[#0F2C4A]">{modoEdicao ? "Editar currículo" : "Criar meu currículo"}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Leva poucos minutos. As empresas veem este currículo quando você se candidata.
          </p>

          {/* Indicador de etapas */}
          <div className="flex items-center gap-2 sm:gap-3 mt-6 mb-8 overflow-x-auto">
            {ETAPAS.map((item, indice) => (
              <div key={item.numero} className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button type="button" onClick={() => irPara(item.numero)} className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      etapa > item.numero
                        ? "bg-green-500 text-white"
                        : etapa === item.numero
                        ? "bg-[#0F2C4A] text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {etapa > item.numero ? "✓" : item.numero}
                  </span>
                  <span
                    className={`text-sm ${etapa === item.numero ? "inline" : "hidden sm:inline"} ${
                      etapa >= item.numero ? "text-[#0F2C4A]" : "text-slate-400"
                    }`}
                  >
                    {item.titulo}
                  </span>
                </button>
                {indice < ETAPAS.length - 1 && <div className="w-6 sm:w-8 h-px bg-slate-300" />}
              </div>
            ))}
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-5">{erro}</p>
          )}

          {/* ─── ETAPA 1: Você ─── */}
          {etapa === 1 && (
            <div className="space-y-6">
              <FotoUpload token={token} fotoUrl={fotoUrl} aoMudar={setFotoUrl} />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={classeRotulo}>Nome</label>
                  <input value={usuario?.nome || ""} disabled className={`${classeCampo} bg-slate-100 text-slate-500 cursor-not-allowed`} />
                  <p className="text-xs text-slate-400 mt-1">Vem da sua conta Google.</p>
                </div>
                <div>
                  <label className={classeRotulo}>Data de nascimento *</label>
                  <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className={classeCampo} />
                  <p className="text-xs text-slate-400 mt-1">A empresa vê só a sua idade.</p>
                </div>
                <div>
                  <label className={classeRotulo}>Telefone *</label>
                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    placeholder="(83) 99999-9999"
                    inputMode="tel"
                    maxLength={15}
                    className={classeCampo}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                    <input type="checkbox" checked={telefoneWhatsapp} onChange={(e) => setTelefoneWhatsapp(e.target.checked)} />
                    Este número tem WhatsApp
                  </label>
                </div>
                <div>
                  <label className={classeRotulo}>Bairro onde você mora *</label>
                  <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Centro" className={classeCampo} />
                  <p className="text-xs text-slate-400 mt-1">Ajuda a empresa a saber se você mora perto.</p>
                </div>
              </div>

              <div>
                <label className={classeRotulo}>E-mail</label>
                <input value={usuario?.email || ""} disabled className={`${classeCampo} bg-slate-100 text-slate-500 cursor-not-allowed`} />
              </div>
            </div>
          )}

          {/* ─── ETAPA 2: O que procura ─── */}
          {etapa === 2 && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={classeRotulo}>Que trabalho você procura? *</label>
                  <input
                    value={cargoDesejado}
                    onChange={(e) => setCargoDesejado(e.target.value)}
                    placeholder="Ex: Atendente, Caixa, Entregador"
                    list="lista-cargos"
                    className={classeCampo}
                  />
                  <datalist id="lista-cargos">
                    {CATEGORIAS_VAGA.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={classeRotulo}>Outra área que também topa (opcional)</label>
                  <input
                    value={areaInteresse}
                    onChange={(e) => setAreaInteresse(e.target.value)}
                    placeholder="Ex: Vendas, Estoque"
                    list="lista-cargos"
                    className={classeCampo}
                  />
                </div>
              </div>

              <div>
                <p className={classeRotulo}>Em que turnos você pode trabalhar? *</p>
                <div className="flex flex-wrap gap-2">
                  {TURNOS.map((t) => (
                    <button
                      key={t.valor}
                      type="button"
                      onClick={() => alternarTurno(t.valor)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        turnos.includes(t.valor)
                          ? "bg-[#0F2C4A] text-white border-[#0F2C4A]"
                          : "bg-white text-[#0F2C4A] border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {turnos.includes(t.valor) ? "✓ " : ""}
                      {t.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className={classeRotulo}>Pode trabalhar nos fins de semana?</p>
                  <SimNao valor={disponivelFimDeSemana} aoMudar={setDisponivelFimDeSemana} />
                </div>
                <div>
                  <p className={classeRotulo}>Pode começar imediatamente?</p>
                  <SimNao valor={inicioImediato} aoMudar={setInicioImediato} />
                </div>
              </div>

              <div className="max-w-xs">
                <label className={classeRotulo}>Pretensão salarial (opcional)</label>
                <input
                  value={pretensaoSalarial}
                  onChange={(e) => setPretensaoSalarial(formatSalario(e.target.value))}
                  placeholder="R$ 1.640,00"
                  inputMode="numeric"
                  className={classeCampo}
                />
              </div>

              <div>
                <label className={classeRotulo}>Sobre mim</label>
                <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2 leading-relaxed">
                  <p className="font-medium text-amber-900">Dicas para escrever:</p>
                  <p>• Como você é no trabalho? (pontual, organizado, gosta de atender pessoas...)</p>
                  <p>• O que você sabe fazer bem?</p>
                  <p>• Já ajudou em algum comércio, na família ou fez algum bico? Conte aqui.</p>
                  <p className="mt-1 italic">
                    Ex: &quot;Sou pontual e aprendo rápido. Ajudei 2 anos no mercadinho da minha família, onde cuidava do caixa e
                    do estoque. Gosto de conversar com os clientes.&quot;
                  </p>
                </div>
                <textarea
                  value={sobreMim}
                  onChange={(e) => setSobreMim(e.target.value.slice(0, LIMITE_SOBRE_MIM))}
                  rows={5}
                  placeholder="Escreva com suas palavras, do seu jeito."
                  className={`${classeCampo} resize-y`}
                />
                <p className="text-xs text-slate-400 text-right">
                  {sobreMim.length}/{LIMITE_SOBRE_MIM}
                </p>
              </div>
            </div>
          )}

          {/* ─── ETAPA 3: Experiência ─── */}
          {etapa === 3 && (
            <div className="space-y-6">
              <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={primeiroEmprego}
                  onChange={(e) => setPrimeiroEmprego(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-[#0F2C4A]">Estou procurando meu primeiro emprego</span>
                  <span className="block text-sm text-slate-500">
                    Sem problema! Capriche no &quot;Sobre mim&quot; e nas habilidades.
                  </span>
                </span>
              </label>

              {!primeiroEmprego && (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Vale tudo: emprego com carteira, bico, trabalho informal, ajudar no comércio da família.
                  </p>

                  <div className="space-y-4">
                    {experiencias.map((exp, indice) => (
                      <div key={indice} className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-[#0F2C4A]">Experiência {indice + 1}</p>
                          <button
                            type="button"
                            onClick={() => setExperiencias((prev) => prev.filter((_, i) => i !== indice))}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">O que você fazia (função)</label>
                            <input
                              value={exp.cargo}
                              onChange={(e) => atualizarExperiencia(indice, "cargo", e.target.value)}
                              placeholder="Ex: Atendente"
                              className={classeCampo}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Onde</label>
                            <input
                              value={exp.empresa}
                              onChange={(e) => atualizarExperiencia(indice, "empresa", e.target.value)}
                              placeholder="Ex: Farmácia do Centro, ou 'Comércio da família'"
                              className={classeCampo}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Por quanto tempo</label>
                            <select
                              value={exp.duracao}
                              onChange={(e) => atualizarExperiencia(indice, "duracao", e.target.value)}
                              className={classeCampo}
                            >
                              <option value="">Selecione...</option>
                              {DURACOES_EXPERIENCIA.map((d) => (
                                <option key={d.valor} value={d.valor}>
                                  {d.rotulo}
                                </option>
                              ))}
                            </select>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-slate-600 sm:pt-6">
                            <input
                              type="checkbox"
                              checked={exp.atual}
                              onChange={(e) => atualizarExperiencia(indice, "atual", e.target.checked)}
                            />
                            Ainda trabalho lá
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">O que você fazia lá (opcional)</label>
                          <textarea
                            value={exp.descricao}
                            onChange={(e) => atualizarExperiencia(indice, "descricao", e.target.value)}
                            placeholder="Ex: Atendia clientes, organizava as prateleiras e fechava o caixa."
                            rows={2}
                            className={`${classeCampo} resize-y`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExperiencias((prev) => [...prev, { cargo: "", empresa: "", duracao: "", atual: false, descricao: "" }])
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#F0A93C] text-white text-sm font-semibold px-4 py-2 hover:bg-[#dd9a30]"
                  >
                    + Adicionar experiência
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── ETAPA 4: Formação e extras ─── */}
          {etapa === 4 && (
            <div className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={classeRotulo}>Escolaridade *</label>
                  <select value={escolaridade} onChange={(e) => setEscolaridade(e.target.value)} className={classeCampo}>
                    <option value="">Selecione...</option>
                    {NIVEIS_ESCOLARIDADE.map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {nivel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className={classeRotulo}>Está estudando atualmente?</p>
                  <SimNao valor={estudandoAtualmente} aoMudar={setEstudandoAtualmente} />
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#0F2C4A] mb-1">Cursos (opcional)</h2>
                <p className="text-xs text-slate-500 mb-3">Informática, atendimento, manipulação de alimentos, cursos do SENAI/SENAC...</p>
                <div className="space-y-3">
                  {cursos.map((curso, indice) => (
                    <div key={indice} className="grid sm:grid-cols-[1fr_1fr_110px_auto] gap-2 items-start">
                      <input
                        value={curso.nomeCurso}
                        onChange={(e) => atualizarCurso(indice, "nomeCurso", e.target.value)}
                        placeholder="Nome do curso"
                        className={classeCampo}
                      />
                      <input
                        value={curso.instituicao}
                        onChange={(e) => atualizarCurso(indice, "instituicao", e.target.value)}
                        placeholder="Onde fez (opcional)"
                        className={classeCampo}
                      />
                      <input
                        type="number"
                        value={curso.anoConclusao}
                        onChange={(e) => atualizarCurso(indice, "anoConclusao", e.target.value)}
                        placeholder="Ano"
                        className={classeCampo}
                      />
                      <button
                        type="button"
                        onClick={() => setCursos((prev) => prev.filter((_, i) => i !== indice))}
                        className="text-xs text-red-600 hover:underline py-3"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCursos((prev) => [...prev, { nomeCurso: "", instituicao: "", anoConclusao: "" }])}
                  className="mt-3 text-sm font-semibold text-[#1D6FA5] hover:underline"
                >
                  + Adicionar curso
                </button>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#0F2C4A] mb-1">Habilidades *</h2>
                <p className="text-xs text-slate-500 mb-2">
                  Digite e pressione Enter, ou toque numa sugestão. Ex: atendimento ao cliente, caixa, organização.
                </p>
                <div className="relative">
                  <input
                    value={habilidadeDigitada}
                    onChange={(e) => setHabilidadeDigitada(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarHabilidade(habilidadeDigitada);
                      }
                    }}
                    placeholder="Ex: Atendimento ao cliente"
                    className={classeCampo}
                  />
                  {sugestoesHabilidade.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                      {sugestoesHabilidade.map((sugestao) => (
                        <button
                          type="button"
                          key={sugestao}
                          onClick={() => adicionarHabilidade(sugestao)}
                          className="w-full text-left px-3 py-2 text-sm text-[#0F2C4A] hover:bg-blue-50"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {habilidadeDigitada.trim() && (
                  <button
                    type="button"
                    onClick={() => adicionarHabilidade(habilidadeDigitada)}
                    className="mt-2 text-sm font-semibold text-[#1D6FA5] hover:underline sm:hidden"
                  >
                    + Adicionar &quot;{habilidadeDigitada.trim()}&quot;
                  </button>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {habilidades.length > 0 ? (
                    habilidades.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-[#0F2C4A] text-sm font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => setHabilidades(habilidades.filter((h) => h !== item))}
                          className="hover:text-red-600 font-bold"
                          aria-label={`Remover ${item}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-sm">Nenhuma habilidade adicionada</span>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className={classeRotulo}>Tem CNH?</p>
                  <SimNao
                    valor={possuiCnh}
                    aoMudar={(v) => {
                      setPossuiCnh(v);
                      if (!v) setCategoriaCnh("");
                    }}
                  />
                </div>
                {possuiCnh && (
                  <div>
                    <label className={classeRotulo}>Categoria</label>
                    <input
                      value={categoriaCnh}
                      onChange={(e) => setCategoriaCnh(e.target.value.slice(0, 5))}
                      placeholder="Ex: A, B, AB"
                      className={classeCampo}
                    />
                  </div>
                )}
                <div>
                  <p className={classeRotulo}>Tem veículo próprio?</p>
                  <SimNao valor={possuiVeiculo} aoMudar={setPossuiVeiculo} />
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-[#0F2C4A] mb-1">Referência (opcional)</h2>
                <p className="text-xs text-slate-500 mb-3">
                  Alguém que possa falar bem do seu trabalho, como um ex-patrão. Coloque só com a autorização da pessoa.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input value={referenciaNome} onChange={(e) => setReferenciaNome(e.target.value)} placeholder="Nome" className={classeCampo} />
                  <input
                    value={referenciaRelacao}
                    onChange={(e) => setReferenciaRelacao(e.target.value)}
                    placeholder="Ex: Ex-patrão"
                    className={classeCampo}
                  />
                  <input
                    value={referenciaTelefone}
                    onChange={(e) => setReferenciaTelefone(formatTelefone(e.target.value))}
                    placeholder="Telefone"
                    inputMode="tel"
                    maxLength={15}
                    className={classeCampo}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => (etapa === 1 ? router.back() : irPara((etapa - 1) as 1 | 2 | 3))}
              className="px-4 py-2.5 text-sm font-medium text-[#0F2C4A] hover:bg-slate-100 rounded-md transition-colors"
            >
              ← Voltar
            </button>

            {etapa < 4 ? (
              <button
                type="button"
                onClick={() => irPara((etapa + 1) as 2 | 3 | 4)}
                className="px-6 py-2.5 rounded-lg bg-[#0F2C4A] text-white font-semibold text-sm hover:bg-[#17436f] transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="button"
                onClick={finalizar}
                disabled={salvando}
                className="px-6 py-2.5 rounded-lg bg-[#0F2C4A] text-white font-semibold text-sm hover:bg-[#17436f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {salvando ? "Salvando..." : "Salvar currículo ✓"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CompletarPerfilContent />
    </Suspense>
  );
}
