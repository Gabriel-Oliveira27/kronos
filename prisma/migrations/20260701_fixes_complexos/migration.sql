-- =========================================================================
-- Kronos — fixes_complexos: setores gerenciáveis + usuários-fantasma (escala)
-- =========================================================================

-- 1. Usuario: marcadores de usuário-fantasma (avulso criado pela escala)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ehGhost" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "origem" TEXT;

-- 2. Setores: lista canônica de setores (vínculo de usuário + recorte de escala)
CREATE TABLE IF NOT EXISTS "setores" (
    "id"                 TEXT NOT NULL,
    "nome"               TEXT NOT NULL,
    "palavraSecretaHash" TEXT,
    "criadoEm"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "setores_nome_key" ON "setores"("nome");

-- 3. Semear a tabela de setores a partir dos setores já usados nos usuários,
--    para que os vínculos existentes já apareçam no seletor. gen_random_uuid()
--    é nativo do PostgreSQL 13+ (Neon) — o id é apenas TEXT.
INSERT INTO "setores" ("id", "nome", "atualizadoEm")
SELECT gen_random_uuid()::text, s."setor", CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "setor"
  FROM "usuarios"
  WHERE "setor" IS NOT NULL AND btrim("setor") <> ''
) s
ON CONFLICT ("nome") DO NOTHING;
