-- =========================================================================
-- Kronos — Etapa 3: schema migration
-- =========================================================================

-- 1. Usuario: campo ativo (desativação sem excluir)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;

-- 2. Usuario: configuração avançada de tema
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "temaConfig" JSONB;

-- 3. Usuario: vínculo com modelo de jornada
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "modeloHorarioId" TEXT;

-- 4. RegistroPonto: origem da batida (app mobile ou web)
ALTER TABLE "registros_ponto" ADD COLUMN IF NOT EXISTS "origem" TEXT NOT NULL DEFAULT 'app';

-- 5. ModeloHorario: nova tabela de jornadas reutilizáveis
CREATE TABLE IF NOT EXISTS "modelos_horario" (
    "id"             TEXT NOT NULL,
    "nome"           TEXT NOT NULL,
    "descricao"      TEXT,
    "horasSemanais"  DOUBLE PRECISION NOT NULL DEFAULT 44,
    "jornadaDiaria"  DOUBLE PRECISION NOT NULL DEFAULT 8,
    "configuracao"   JSONB,
    "criadoPorId"    TEXT NOT NULL,
    "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "modelos_horario_pkey" PRIMARY KEY ("id")
);

-- 6. FK: usuarios → modelos_horario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'usuarios_modeloHorarioId_fkey'
  ) THEN
    ALTER TABLE "usuarios"
      ADD CONSTRAINT "usuarios_modeloHorarioId_fkey"
      FOREIGN KEY ("modeloHorarioId")
      REFERENCES "modelos_horario"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 7. SABADO_REDUZIDO: converter registros existentes para NORMAL antes de
--    remover o valor do enum. Em PostgreSQL, não é possível DROP VALUE de
--    um enum existente (limitação do banco), então a estratégia é:
--    a) atualizar os dados
--    b) criar um enum novo sem o valor
--    c) fazer o cast da coluna
--    Por segurança em produção, fazemos apenas o passo (a) aqui; o enum
--    antigo continua existindo no banco mas não é mais usado no código.
UPDATE "escalas_dia" SET "tipo" = 'NORMAL' WHERE "tipo" = 'SABADO_REDUZIDO';

-- Nota: remover o valor do enum PostgreSQL via ALTER TYPE ... DROP VALUE
-- requer PostgreSQL 14+ e que nenhuma linha use o valor. Após rodar o
-- UPDATE acima, execute manualmente se necessário:
-- ALTER TYPE "TipoDiaEscala" RENAME TO "TipoDiaEscala_old";
-- CREATE TYPE "TipoDiaEscala" AS ENUM ('NORMAL','PLANTAO','HOME_OFFICE','FOLGA');
-- ALTER TABLE "escalas_dia" ALTER COLUMN "tipo" TYPE "TipoDiaEscala"
--   USING "tipo"::text::"TipoDiaEscala";
-- DROP TYPE "TipoDiaEscala_old";
