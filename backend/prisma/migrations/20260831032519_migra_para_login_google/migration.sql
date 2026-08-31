/*
  Warnings:

  - You are about to drop the column `emailVerificado` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVerificacao` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVerificacaoExpira` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Usuario_tokenVerificacao_key";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "emailVerificado",
DROP COLUMN "tokenVerificacao",
DROP COLUMN "tokenVerificacaoExpira",
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "senha" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");
