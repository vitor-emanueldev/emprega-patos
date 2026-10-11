-- Vaga: carga horária, quantidade de vagas e vaga PcD (só adiciona colunas, nada é apagado)
ALTER TABLE "Vaga" ADD COLUMN "cargaHoraria" TEXT;
ALTER TABLE "Vaga" ADD COLUMN "quantidadeVagas" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Vaga" ADD COLUMN "pcd" TEXT NOT NULL DEFAULT 'nao';
