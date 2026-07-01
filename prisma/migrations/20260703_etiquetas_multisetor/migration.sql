-- =========================================================================
-- Kronos — etiquetas de escala por setor, multi-setor por usuário,
-- etiqueta por dia de escala e jornada da semana de plantão
-- =========================================================================

-- 1. Usuario: lista de setores (multi-setor). Backfill com o setor atual.
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "setores" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "usuarios"
SET "setores" = ARRAY["setor"]
WHERE (cardinality("setores") = 0 OR "setores" IS NULL)
  AND "setor" IS NOT NULL AND btrim("setor") <> '';

-- 2. Setor: etiquetas de escala personalizadas (JSON; null = padrão do código)
ALTER TABLE "setores" ADD COLUMN IF NOT EXISTS "etiquetas" JSONB;

-- 3. EscalaDia: vínculo com a etiqueta personalizada (sem FK — vive no JSON)
ALTER TABLE "escalas_dia" ADD COLUMN IF NOT EXISTS "etiquetaId" TEXT;

-- 4. ModeloHorario: jornada reduzida na semana de plantão (7h30 por padrão)
ALTER TABLE "modelos_horario" ADD COLUMN IF NOT EXISTS "jornadaPlantao" DOUBLE PRECISION NOT NULL DEFAULT 7.5;
