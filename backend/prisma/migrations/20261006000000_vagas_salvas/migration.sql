-- "Salvar vaga": só CRIA uma tabela nova, não altera nada existente.

-- CreateTable
CREATE TABLE "VagaSalva" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "vagaId" TEXT NOT NULL,

    CONSTRAINT "VagaSalva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VagaSalva_usuarioId_vagaId_key" ON "VagaSalva"("usuarioId", "vagaId");

-- AddForeignKey
ALTER TABLE "VagaSalva" ADD CONSTRAINT "VagaSalva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VagaSalva" ADD CONSTRAINT "VagaSalva_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "Vaga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
