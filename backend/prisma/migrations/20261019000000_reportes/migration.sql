-- Reportes de problemas/sugestões enviados pelo site. Só cria tabela nova.
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "contato" TEXT,
    "pagina" TEXT,
    "navegador" TEXT,
    "situacao" TEXT NOT NULL DEFAULT 'novo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reporte_situacao_createdAt_idx" ON "Reporte"("situacao", "createdAt");

ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
