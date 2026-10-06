-- Currículo v2 + cópia do currículo na candidatura.
-- Só ADICIONA colunas (nada é apagado), então o site antigo continua funcionando.

-- AlterTable
ALTER TABLE "Candidato" ADD COLUMN     "sobreMim" TEXT,
ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "telefoneWhatsapp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "turnos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "disponivelFimDeSemana" BOOLEAN,
ADD COLUMN     "inicioImediato" BOOLEAN,
ADD COLUMN     "primeiroEmprego" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "escolaridade" TEXT,
ADD COLUMN     "estudandoAtualmente" BOOLEAN,
ADD COLUMN     "referenciaNome" TEXT,
ADD COLUMN     "referenciaTelefone" TEXT,
ADD COLUMN     "referenciaRelacao" TEXT;

-- AlterTable
ALTER TABLE "CandidatoExperiencia" ADD COLUMN     "duracao" TEXT;

-- AlterTable
ALTER TABLE "Candidatura" ADD COLUMN     "mensagemCandidato" TEXT,
ADD COLUMN     "curriculoEnviado" JSONB;

-- Aproveita os dados antigos: "diferencial" vira o início do "Sobre mim"
UPDATE "Candidato" SET "sobreMim" = "diferencial"
WHERE "sobreMim" IS NULL AND "diferencial" IS NOT NULL AND "diferencial" <> '';

-- Aproveita a escolaridade que estava em "formações"
UPDATE "Candidato" c SET "escolaridade" = f."nivelEscolaridade"
FROM (
  SELECT DISTINCT ON ("candidatoId") "candidatoId", "nivelEscolaridade"
  FROM "CandidatoFormacao"
  WHERE "nivelEscolaridade" <> ''
  ORDER BY "candidatoId", "id"
) f
WHERE f."candidatoId" = c."id" AND c."escolaridade" IS NULL;
