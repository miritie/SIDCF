-- ============================================================
-- 034 — Objection à la procédure + itérations (remise en cause)
-- ============================================================
-- Note 3 (réunion) — GESTION DES OBJECTIONS À LA PROCÉDURE.
--
-- À distinguer de l'Avis de Non-Objection (ANO, MP_ANO) qui est une étape
-- ORDINAIRE du workflow (DGMP/Bailleur). Ici il s'agit de l'OBJECTION À LA
-- PROCÉDURE : extraordinaire, déclenchée sur instruction d'une autorité (organe
-- saisi pour irrégularité), qui peut SUSPENDRE la procédure et imposer une
-- REPRISE. La reprise crée une nouvelle ITÉRATION sans écraser les précédentes.
--
-- Convention camelToSnake du Worker (un « _ » avant chaque majuscule) :
--   objection          -> objection
--   iterations         -> iterations
--   iterationCourante  -> iteration_courante
-- ============================================================

BEGIN;

-- Phase 1 — Objection courante à la procédure.
--   { active, organe, date, motif, decisionDocId }  (organe = ANRMP|DGMP|TUTELLE|JURIDICTION|AUTRE)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS objection JSONB;

-- Phase 2 — Historique des itérations archivées (remise en cause).
--   [{ numero, dateRemiseEnCause, objection, snapshotProcedure, snapshotAttribution }]
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS iterations JSONB;

-- Phase 2 — Numéro de l'itération courante (1 = première saisie).
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS iteration_courante INTEGER DEFAULT 1;

COMMIT;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mp_procedure'
  AND column_name IN ('objection', 'iterations', 'iteration_courante')
ORDER BY column_name;
