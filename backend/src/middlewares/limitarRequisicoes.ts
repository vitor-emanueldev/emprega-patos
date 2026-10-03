import { Request, Response, NextFunction } from "express";

// Limitador de requisições simples, em memória, por IP.
// Suficiente para um único servidor (MVP). Se um dia rodar com várias
// instâncias, trocar por um armazenamento compartilhado (ex: Redis).

type Registro = { contagem: number; expiraEm: number };

export function limitarRequisicoes(opcoes: {
  janelaMs: number;
  maximo: number;
  mensagem?: string;
}) {
  const registros = new Map<string, Registro>();

  // Limpa registros vencidos de tempos em tempos para não acumular memória
  setInterval(() => {
    const agora = Date.now();
    for (const [chave, registro] of registros) {
      if (registro.expiraEm <= agora) registros.delete(chave);
    }
  }, opcoes.janelaMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const chave = req.ip || req.socket.remoteAddress || "desconhecido";
    const agora = Date.now();
    let registro = registros.get(chave);

    if (!registro || registro.expiraEm <= agora) {
      registro = { contagem: 0, expiraEm: agora + opcoes.janelaMs };
      registros.set(chave, registro);
    }

    registro.contagem++;

    const restantes = Math.max(0, opcoes.maximo - registro.contagem);
    res.setHeader("RateLimit-Limit", String(opcoes.maximo));
    res.setHeader("RateLimit-Remaining", String(restantes));

    if (registro.contagem > opcoes.maximo) {
      const segundos = Math.ceil((registro.expiraEm - agora) / 1000);
      res.setHeader("Retry-After", String(segundos));
      return res.status(429).json({
        erro: opcoes.mensagem || "Muitas requisições. Tente novamente em alguns minutos.",
      });
    }

    return next();
  };
}
