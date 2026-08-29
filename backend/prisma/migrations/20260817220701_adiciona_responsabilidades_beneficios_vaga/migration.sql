-- AlterTable
ALTER TABLE "Vaga" ADD COLUMN     "responsabilidades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "beneficios" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Candidatura" ADD COLUMN     "mensagemResposta" TEXT,
ADD COLUMN     "dataEntrevista" TIMESTAMP(3),
ADD COLUMN     "respondidoEm" TIMESTAMP(3);