// Formatações usadas nos cards e páginas de vagas

export function formatarSalario(valor: number | null | undefined) {
  if (valor == null) return "A combinar";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: valor % 1 ? 2 : 0 });
}

export function tempoPublicacao(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
  const meses = Math.floor(dias / 30);
  return `Há ${meses} ${meses > 1 ? "meses" : "mês"}`;
}

export function formatarDistancia(km: number) {
  if (km < 1) return `${Math.round(km * 1000 / 50) * 50} m`;
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

// Distância em linha reta entre dois pontos (fórmula de Haversine), em km
export function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
