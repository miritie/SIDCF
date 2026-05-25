-- ============================================
-- Migration 028 : Ajouter la colonne `lot_id` à mp_difficulte
-- ============================================
-- Règle métier : les difficultés sont rattachées à un lot spécifique d'un
-- marché. En mono-lot, ce sera le lot unique du marché. En multi-lot,
-- l'utilisateur précise le lot concerné à la saisie.
--
-- Le lot est un champ texte (libellé) plutôt qu'une FK car les lots sont
-- définis comme éléments de tableau JSONB dans mp_procedure.lots (pas de
-- table mp_lot dédiée à ce stade).
--
-- IDEMPOTENT : ADD COLUMN IF NOT EXISTS.
-- Réversible : ALTER TABLE mp_difficulte DROP COLUMN IF EXISTS lot_id;
-- ============================================

BEGIN;

ALTER TABLE mp_difficulte
  ADD COLUMN IF NOT EXISTS lot_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_mp_difficulte_lot_id
  ON mp_difficulte(lot_id)
  WHERE lot_id IS NOT NULL;

COMMIT;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mp_difficulte' AND column_name = 'lot_id';
