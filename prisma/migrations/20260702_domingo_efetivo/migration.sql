-- =========================================================================
-- Kronos — novo tipo de dia: DOMINGO_EFETIVO (exclusivo de domingos)
-- Em migração própria: ALTER TYPE ... ADD VALUE não pode ser usado na mesma
-- transação em que o valor novo é referenciado.
-- =========================================================================

ALTER TYPE "TipoDiaEscala" ADD VALUE IF NOT EXISTS 'DOMINGO_EFETIVO';
