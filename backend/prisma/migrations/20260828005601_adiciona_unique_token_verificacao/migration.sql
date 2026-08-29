/*
  Warnings:

  - A unique constraint covering the columns `[tokenVerificacao]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tokenVerificacao" TEXT,
ADD COLUMN     "tokenVerificacaoExpira" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tokenVerificacao_key" ON "Usuario"("tokenVerificacao");
