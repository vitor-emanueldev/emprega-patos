// Descobre a rua e o bairro de um ponto clicado no mapa (geocodificação reversa).
// Usa o Nominatim do OpenStreetMap: grátis, sem chave, chamado direto do navegador.
// Regra de uso do serviço: no máximo 1 consulta por segundo.

export type EnderecoDoPonto = {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  endereco: string; // "Rua X, 120" (ou só "Rua X" quando o mapa não sabe o número)
};

let ultimaConsulta = 0;

// O OpenStreetMap usa nomes diferentes para "bairro" dependendo de como a área foi cadastrada
export function lerEndereco(a: Record<string, string | undefined>): EnderecoDoPonto {
  const rua = a.road || a.pedestrian || a.street || a.footway || a.path || "";
  const numero = a.house_number || "";
  const bairro = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.residential || a.hamlet || "";
  const cidade = a.city || a.town || a.municipality || a.village || "";
  const endereco = rua ? (numero ? `${rua}, ${numero}` : rua) : "";
  return { rua, numero, bairro, cidade, endereco };
}

export async function enderecoDoPonto(latitude: number, longitude: number): Promise<EnderecoDoPonto | null> {
  const espera = 1100 - (Date.now() - ultimaConsulta);
  if (espera > 0) await new Promise((ok) => setTimeout(ok, espera));
  ultimaConsulta = Date.now();

  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=pt-BR" +
    `&lat=${latitude.toFixed(6)}&lon=${longitude.toFixed(6)}`;

  const resposta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resposta.ok) throw new Error("Serviço de endereços indisponível");
  const dados = await resposta.json();
  if (!dados?.address) return null;

  const resultado = lerEndereco(dados.address);
  return resultado.endereco || resultado.bairro ? resultado : null;
}
