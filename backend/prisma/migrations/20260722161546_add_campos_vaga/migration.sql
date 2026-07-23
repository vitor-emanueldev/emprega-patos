/*
  Warnings:

  - Added the required column `area` to the `Vaga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bairro` to the `Vaga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoContrato` to the `Vaga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vaga" ADD COLUMN     "area" TEXT NOT NULL,
ADD COLUMN     "bairro" TEXT NOT NULL,
ADD COLUMN     "tipoContrato" TEXT NOT NULL;
