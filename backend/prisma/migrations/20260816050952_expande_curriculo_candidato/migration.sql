-- AlterTable
ALTER TABLE "Candidato" ADD COLUMN     "areaInteresse" TEXT,
ADD COLUMN     "cargoDesejado" TEXT,
ADD COLUMN     "categoriaCnh" TEXT,
ADD COLUMN     "diferencial" TEXT,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "possuiCnh" BOOLEAN,
ADD COLUMN     "possuiVeiculo" BOOLEAN,
ADD COLUMN     "pretensaoSalarial" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "CandidatoFormacao" (
    "id" TEXT NOT NULL,
    "nivelEscolaridade" TEXT NOT NULL,
    "instituicao" TEXT NOT NULL,
    "anoInicio" INTEGER,
    "anoConclusao" INTEGER,
    "candidatoId" TEXT NOT NULL,

    CONSTRAINT "CandidatoFormacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatoCurso" (
    "id" TEXT NOT NULL,
    "nomeCurso" TEXT NOT NULL,
    "cargaHoraria" TEXT,
    "instituicao" TEXT,
    "anoConclusao" INTEGER,
    "candidatoId" TEXT NOT NULL,

    CONSTRAINT "CandidatoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatoExperiencia" (
    "id" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "atual" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "candidatoId" TEXT NOT NULL,

    CONSTRAINT "CandidatoExperiencia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidatoFormacao" ADD CONSTRAINT "CandidatoFormacao_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatoCurso" ADD CONSTRAINT "CandidatoCurso_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatoExperiencia" ADD CONSTRAINT "CandidatoExperiencia_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
