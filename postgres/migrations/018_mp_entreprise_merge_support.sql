-- ============================================
-- Migration 018 : Modif #44 — Support de la fusion de fiches entreprise
-- ============================================
-- Ajoute la colonne `merged_into_id` sur `mp_entreprise` pour tracer
-- les fiches qui ont été fusionnées vers une autre fiche maîtresse.
-- Le statut `MERGED` (déjà autorisé en check constraint depuis 017)
-- prend tout son sens avec cette colonne.
--
-- Comportement applicatif :
--   - Une fiche en `MERGED` n'apparaît plus dans le picker (filtrage
--     `actif = TRUE AND validation_status != 'MERGED'`)
--   - Tous les `entrepriseId` qui pointaient vers la fiche source sont
--     mis à jour pour pointer vers la fiche cible (opération de fusion
--     gérée par l'écran admin)
--   - `merged_into_id` permet de remonter la chaîne d'historique
--
-- Idempotent. Réversible :
--   ALTER TABLE mp_entreprise DROP COLUMN IF EXISTS merged_into_id;
-- ============================================

BEGIN;

ALTER TABLE mp_entreprise
  ADD COLUMN IF NOT EXISTS merged_into_id UUID
    REFERENCES mp_entreprise(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mp_entreprise_merged_into_id
  ON mp_entreprise(merged_into_id)
  WHERE merged_into_id IS NOT NULL;

COMMENT ON COLUMN mp_entreprise.merged_into_id IS
  'Si non null, indique que cette fiche a été fusionnée vers la fiche pointée. Le statut associé est ''MERGED''.';

COMMIT;
