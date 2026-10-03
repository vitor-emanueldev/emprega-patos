import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

// Valida req.body (ou req.query) com um schema do zod.
// Se passar, substitui pelos dados já limpos (sem campos desconhecidos).
// Se falhar, responde 400 com a primeira mensagem de erro, em português.
export function validar(schema: ZodTypeAny, origem: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(origem === "body" ? req.body ?? {} : req.query);

    if (!resultado.success) {
      const primeiro = resultado.error.issues[0];
      const campo = primeiro?.path.join(".");
      return res.status(400).json({
        erro: primeiro?.message || "Dados inválidos.",
        campo: campo || undefined,
      });
    }

    if (origem === "body") {
      req.body = resultado.data;
    } else {
      res.locals.query = resultado.data;
    }

    return next();
  };
}
