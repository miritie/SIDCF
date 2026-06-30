-- ============================================================
-- 037 — Clôture : enseignements (leçons tirées + recommandations)
-- ============================================================
-- Note métier — « Enseignement à rajouter (existe déjà en partie). Mieux
-- structurer : LEÇONS TIRÉES et RECOMMANDATIONS. » Le bilan libre existant
-- (synthese_finale) est conservé ; on ajoute deux champs structurés.
--
-- Convention camelToSnake du Worker : leconsTirees -> lecons_tirees ;
-- recommandations -> recommandations.
-- ============================================================

BEGIN;
ALTER TABLE mp_cloture ADD COLUMN IF NOT EXISTS lecons_tirees TEXT;
ALTER TABLE mp_cloture ADD COLUMN IF NOT EXISTS recommandations TEXT;
COMMIT;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='mp_cloture'
  AND column_name IN ('lecons_tirees','recommandations') ORDER BY column_name;
