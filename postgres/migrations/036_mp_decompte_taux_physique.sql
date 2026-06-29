-- ============================================================
-- 036 — Décompte : taux d'exécution PHYSIQUE (en plus du financier)
-- ============================================================
-- Doc clôture 24/06 / obs. métier — « Dans la saisie des décomptes, prendre en
-- charge les taux physiques ET les taux financiers ». Le taux financier
-- (taux_execution) est calculé (Net TTC / montant total). Le taux PHYSIQUE est
-- saisi par l'agent (avancement réel des prestations).
--
-- Convention camelToSnake du Worker : tauxPhysique -> taux_physique
-- ============================================================

BEGIN;
ALTER TABLE mp_decompte ADD COLUMN IF NOT EXISTS taux_physique DECIMAL(5,2) DEFAULT 0;
COMMIT;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='mp_decompte' AND column_name='taux_physique';
