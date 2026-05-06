-- ============================================
-- Migration 016 : Marché+ — Phase Approbation
-- ============================================
-- Ajoute les colonnes nécessaires à la phase Approbation sur la table
-- mp_visa_cf (renommée fonctionnellement mais gardée techniquement) :
--   - organe_approbateur : code du référentiel mp-organes-approbation.json
--   - date_approbation   : date d'approbation (peut différer de date_decision)
--   - document_approbation : URL R2 du document associé (facultatif)
--
-- IDEMPOTENT (ADD COLUMN IF NOT EXISTS).
-- Réversible : ALTER TABLE mp_visa_cf DROP COLUMN ...
-- ============================================

BEGIN;

ALTER TABLE mp_visa_cf
  ADD COLUMN IF NOT EXISTS organe_approbateur   TEXT,
  ADD COLUMN IF NOT EXISTS date_approbation     DATE,
  ADD COLUMN IF NOT EXISTS document_approbation TEXT;

-- Index pour les requêtes par organe
CREATE INDEX IF NOT EXISTS idx_mp_visa_cf_organe ON mp_visa_cf (organe_approbateur)
  WHERE organe_approbateur IS NOT NULL;

COMMIT;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mp_visa_cf'
  AND column_name IN ('organe_approbateur', 'date_approbation', 'document_approbation')
ORDER BY column_name;
