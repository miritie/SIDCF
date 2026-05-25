-- ============================================
-- Migration 027 : Ajouter la colonne `relations` à mp_operation
-- ============================================
-- La Modif #28 (Liens entre marchés) stocke les liaisons dans
-- `MP_OPERATION.relations[]` (JSONB array de { id, sens, role, note, createdAt }).
-- Mais la colonne n'existait pas dans la table — d'où l'erreur observée :
--   « column "relations" of relation "mp_operation" does not exist »
-- au moment de sauvegarder une nouvelle liaison.
--
-- IDEMPOTENT : ADD COLUMN IF NOT EXISTS.
-- Réversible : ALTER TABLE mp_operation DROP COLUMN IF EXISTS relations;
-- ============================================

BEGIN;

ALTER TABLE mp_operation
  ADD COLUMN IF NOT EXISTS relations JSONB DEFAULT '[]'::jsonb;

-- Index GIN pour les recherches sur le contenu (rares mais utiles pour
-- retrouver « tous les marchés liés à X »).
CREATE INDEX IF NOT EXISTS idx_mp_operation_relations
  ON mp_operation USING GIN (relations);

COMMIT;

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'mp_operation' AND column_name = 'relations';
