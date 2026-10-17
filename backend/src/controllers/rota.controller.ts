import { Request, Response } from "express";
import { prisma } from "../prisma";

// Rota de carro de um ponto até a vaga, calculada pelo OpenRouteService (grátis, com chave).
// A chave fica só aqui no servidor (ORS_API_KEY). A posição da pessoa não é guardada.

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

// Área aceita para o ponto de partida: Patos e arredores (evita usar nossa cota para outras cidades)
const LIMITES = { sul: -7.25, norte: -6.8, oeste: -37.55, leste: -37.0 };

type Rota = { distanciaM: number; duracaoS: number; caminho: [number, number][] };

// Cache simples em memória: mesma partida (arredondada a ~10 m) e mesma vaga = mesma rota
const cache = new Map<string, { rota: Rota; expiraEm: number }>();
const CACHE_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;

export function rotaConfigurada() {
  return !!process.env.ORS_API_KEY?.trim();
}

// GET /rota?vagaId=...&lat=...&lng=...
export async function calcularRota(req: Request, res: Response) {
  const chave = process.env.ORS_API_KEY?.trim();
  if (!chave) return res.status(503).json({ erro: "Rota indisponível no momento." });

  const vagaId = String(req.query.vagaId || "");
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!vagaId || vagaId.length > 40 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ erro: "Dados da rota inválidos." });
  }
  if (lat < LIMITES.sul || lat > LIMITES.norte || lng < LIMITES.oeste || lng > LIMITES.leste) {
    return res.status(400).json({ erro: "O ponto de partida precisa ser em Patos ou na região." });
  }

  try {
    const vaga = await prisma.vaga.findUnique({ where: { id: vagaId }, select: { latitude: true, longitude: true } });
    if (!vaga || vaga.latitude == null || vaga.longitude == null) {
      return res.status(404).json({ erro: "Vaga sem localização no mapa." });
    }

    const chaveCache = `${vagaId}:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const guardada = cache.get(chaveCache);
    if (guardada && guardada.expiraEm > Date.now()) return res.json(guardada.rota);

    const resposta = await fetch(ORS_URL, {
      method: "POST",
      headers: { Authorization: chave, "Content-Type": "application/json", Accept: "application/geo+json" },
      body: JSON.stringify({ coordinates: [[lng, lat], [vaga.longitude, vaga.latitude]] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!resposta.ok) {
      console.error("Rota: OpenRouteService respondeu", resposta.status);
      return res.status(502).json({ erro: "Não foi possível calcular a rota agora." });
    }

    const dados: any = await resposta.json();
    const rotaBruta = dados?.features?.[0];
    const resumo = rotaBruta?.properties?.summary;
    const coordenadas: [number, number][] = rotaBruta?.geometry?.coordinates;
    if (!resumo || !Array.isArray(coordenadas)) {
      return res.status(502).json({ erro: "Não foi possível calcular a rota agora." });
    }

    const rota: Rota = {
      distanciaM: Math.round(resumo.distance ?? 0),
      duracaoS: Math.round(resumo.duration ?? 0),
      caminho: coordenadas.map(([x, y]) => [y, x]), // GeoJSON vem como [lng, lat]
    };

    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(chaveCache, { rota, expiraEm: Date.now() + CACHE_MS });
    return res.json(rota);
  } catch (erro) {
    console.error("Erro ao calcular rota:", erro);
    return res.status(502).json({ erro: "Não foi possível calcular a rota agora." });
  }
}
