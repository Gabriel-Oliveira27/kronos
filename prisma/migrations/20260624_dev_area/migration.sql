-- =========================================================================
-- Kronos — Dev Area: configuração global do app (singleton)
-- =========================================================================

CREATE TABLE IF NOT EXISTS "configuracao_app" (
    "id"              TEXT NOT NULL,
    "config"          JSONB NOT NULL,
    "atualizadoPorId" TEXT,
    "atualizadoEm"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "configuracao_app_pkey" PRIMARY KEY ("id")
);
