-- Empresa: verificação pelo administrador (só adiciona colunas).
-- As empresas que já existem ficam "aprovada" (valor padrão).
ALTER TABLE "Empresa" ADD COLUMN "verificacao" TEXT NOT NULL DEFAULT 'aprovada';
ALTER TABLE "Empresa" ADD COLUMN "verificadaEm" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "motivoRecusa" TEXT;
