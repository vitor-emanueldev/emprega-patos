import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Política de Privacidade | MapVagas",
  description: "Como o MapVagas coleta, usa e protege seus dados pessoais.",
};

const EMAIL_CONTATO = "mapvagas.avisos@gmail.com";
const ATUALIZADA_EM = "11 de outubro de 2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-lg font-bold text-[#0F2C4A] mb-2">{titulo}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-[#F0A93C]">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[#0F2C4A]">Política de Privacidade</h1>
        <p className="text-slate-500 mt-2 mb-8">Última atualização: {ATUALIZADA_EM}</p>

        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <div className="rounded-lg bg-[#FFF7EA] border border-[#F6D9A8] p-4 mb-8 text-sm text-[#0F2C4A] leading-relaxed">
            <b>Resumo:</b> usamos seus dados só para ligar candidatos e empresas de Patos. Não vendemos seus dados.
            A empresa só vê seu currículo quando <b>você</b> se candidata, e nunca vê seu CPF nem sua data de
            nascimento. Você pode pedir para ver, corrigir ou apagar seus dados a qualquer momento.
          </div>

          <Secao titulo="1. Quem somos">
            <p>
              O MapVagas é uma plataforma que mostra vagas de emprego no mapa de Patos-PB e conecta candidatos a
              empresas da cidade. Esta política explica, de forma simples, quais dados pessoais tratamos, por que e
              quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
            </p>
          </Secao>

          <Secao titulo="2. Quais dados coletamos">
            <p>
              <b>Ao entrar com o Google:</b> nome, e-mail e foto da sua conta Google. Não temos acesso à sua senha.
            </p>
            <p>
              <b>Se você é candidato</b>, os dados que você mesmo preenche no currículo:
            </p>
            <Lista
              itens={[
                "nome, telefone (e se é WhatsApp), bairro e foto;",
                "CPF e data de nascimento;",
                "cargo desejado, área de interesse, pretensão salarial e texto \"sobre mim\";",
                "escolaridade, cursos, experiências e habilidades;",
                "disponibilidade (turnos, fim de semana, início imediato), CNH e veículo;",
                "contato de referência (nome, telefone e relação), se você informar.",
              ]}
            />
            <p>
              <b>Se você é empresa:</b> nome da empresa, CNPJ, endereço, bairro, setor, descrição, telefone e a
              localização no mapa, além das vagas que você publica.
            </p>
            <p>
              <b>Candidaturas:</b> a mensagem que você escreve ao se candidatar e uma cópia do seu currículo naquele
              momento, para a empresa ver exatamente o que você enviou. Também guardamos a resposta da empresa
              (aprovação, recusa, data da entrevista e mensagem).
            </p>
            <p>
              <b>Vagas salvas:</b> a lista de vagas que você marcou para ver depois.
            </p>
            <p>
              <b>Sua localização:</b> só é usada quando você toca em &quot;Perto de mim&quot;. Ela fica apenas no seu
              aparelho para calcular a distância até as vagas e <b>não é enviada nem guardada</b> pelo MapVagas.
            </p>
            <p>
              <b>Dados técnicos:</b> o endereço IP de quem acessa é usado na hora para limitar acessos abusivos
              (proteção contra ataques) e pode aparecer em registros de erro do servidor.
            </p>
          </Secao>

          <Secao titulo="3. Para que usamos seus dados">
            <Lista
              itens={[
                "criar e manter sua conta;",
                "mostrar as vagas no mapa e permitir que você se candidate;",
                "enviar seu currículo para a empresa da vaga em que você se candidatou;",
                "mandar avisos por e-mail sobre suas candidaturas (novo candidato, aprovação ou recusa);",
                "manter o site seguro e funcionando.",
              ]}
            />
            <p>
              Fazemos isso para executar o serviço que você pediu ao usar o MapVagas (LGPD, art. 7º, V) e, no caso
              da segurança, pelo nosso legítimo interesse em proteger a plataforma (art. 7º, IX). Não usamos seus
              dados para propaganda e <b>não vendemos</b> seus dados para ninguém.
            </p>
          </Secao>

          <Secao titulo="4. Quem vê seus dados">
            <Lista
              itens={[
                <>
                  <b>Empresas</b> só veem o currículo de quem se candidatou às vagas delas: seu currículo, sua idade
                  (calculada, sem a data de nascimento), telefone, e-mail e foto. <b>Seu CPF e sua data de nascimento
                  nunca são mostrados às empresas.</b>
                </>,
                <>
                  <b>Qualquer visitante</b> do site vê as vagas publicadas: cargo, descrição, salário, nome e endereço
                  da empresa.
                </>,
                <>
                  <b>Candidatos</b> veem a resposta da empresa às próprias candidaturas.
                </>,
              ]}
            />
          </Secao>

          <Secao titulo="5. Serviços que usamos">
            <p>Para funcionar, o MapVagas usa serviços de outras empresas, que tratam dados só para essa finalidade:</p>
            <Lista
              itens={[
                <><b>Google</b>: login com a conta Google e envio dos e-mails de aviso (Gmail);</>,
                <><b>Supabase</b>: banco de dados e armazenamento das fotos;</>,
                <><b>Render</b>: servidor do sistema;</>,
                <><b>Vercel</b>: hospedagem do site;</>,
                <><b>OpenStreetMap</b>: imagens do mapa, que seu navegador baixa diretamente;</>,
                <><b>BrasilAPI e Nominatim</b>: consulta de CNPJ e localização do endereço no cadastro de empresas.</>,
              ]}
            />
            <p>
              Alguns desses serviços ficam fora do Brasil (por exemplo, nos Estados Unidos). Escolhemos provedores
              conhecidos e que adotam medidas de segurança.
            </p>
          </Secao>

          <Secao titulo="6. Por quanto tempo guardamos">
            <p>
              Guardamos seus dados enquanto sua conta existir. Se você pedir a exclusão, apagamos seus dados, exceto
              o que a lei nos obrigar a manter.
            </p>
          </Secao>

          <Secao titulo="7. Como protegemos seus dados">
            <Lista
              itens={[
                "a conexão com o site é sempre criptografada (HTTPS);",
                "o login é feito pelo Google, então não guardamos senhas;",
                "cada pessoa só acessa e altera os próprios dados;",
                "limitamos tentativas repetidas para dificultar ataques.",
              ]}
            />
          </Secao>

          <Secao titulo="8. O que fica guardado no seu navegador">
            <p>
              Para você continuar conectado, o site guarda no seu navegador um código de acesso e seus dados básicos (nome, e-mail e foto). Isso some
              quando você clica em &quot;Sair&quot;. <b>Não usamos cookies de propaganda nem de rastreamento.</b>
            </p>
          </Secao>

          <Secao titulo="9. Seus direitos">
            <p>Pela LGPD, você pode a qualquer momento:</p>
            <Lista
              itens={[
                "saber quais dados seus nós temos e receber uma cópia;",
                "corrigir dados errados (a maior parte você mesmo edita no seu perfil);",
                "pedir a exclusão da sua conta e dos seus dados;",
                "saber com quem compartilhamos seus dados;",
                "retirar seu consentimento e reclamar à ANPD (Autoridade Nacional de Proteção de Dados).",
              ]}
            />
            <p>
              Para isso, mande um e-mail para{" "}
              <a href={`mailto:${EMAIL_CONTATO}`} className="font-semibold text-[#1D6FA5] hover:underline">
                {EMAIL_CONTATO}
              </a>{" "}
              usando o mesmo e-mail da sua conta. Respondemos em até 15 dias.
            </p>
          </Secao>

          <Secao titulo="10. Mudanças nesta política">
            <p>
              Se esta política mudar, atualizamos a data no topo da página. Mudanças importantes também serão
              avisadas no site.
            </p>
          </Secao>
        </div>

        <p className="text-center mt-8">
          <Link href="/" className="text-sm font-semibold text-[#1D6FA5] hover:underline">
            Voltar para o início
          </Link>
        </p>
      </main>
    </div>
  );
}
