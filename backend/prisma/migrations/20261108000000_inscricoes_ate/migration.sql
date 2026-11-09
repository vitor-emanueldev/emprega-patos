-- "Inscrições até" da vaga. Só adiciona uma coluna opcional: vagas existentes ficam sem prazo.
ALTER TABLE "Vaga" ADD COLUMN "inscricoesAte" TIMESTAMP(3);
