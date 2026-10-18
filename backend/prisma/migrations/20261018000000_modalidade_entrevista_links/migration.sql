-- Vaga: modalidade (presencial/hibrido/remoto). Candidatura: formato, local e link da entrevista.
-- Candidato: links (LinkedIn, GitHub, portfolio). So adiciona colunas.
ALTER TABLE "Vaga" ADD COLUMN "modalidade" TEXT NOT NULL DEFAULT 'presencial';
ALTER TABLE "Candidatura" ADD COLUMN "formatoEntrevista" TEXT;
ALTER TABLE "Candidatura" ADD COLUMN "localEntrevista" TEXT;
ALTER TABLE "Candidatura" ADD COLUMN "linkEntrevista" TEXT;
ALTER TABLE "Candidato" ADD COLUMN "links" TEXT[] DEFAULT ARRAY[]::TEXT[];
