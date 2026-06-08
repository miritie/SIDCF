-- ============================================================
-- 033 — Traçabilité du mode de passation : planifié vs effectif
-- ============================================================
-- Feuille de route DÉROGATIONS (CR métier) : trois référentiels de mode
-- coexistent — planifié (PPM), imposé par le barème, et celui de la LIASSE
-- (qui fait foi). À la contractualisation, l'agent confirme le mode planifié
-- ou en sélectionne un autre ; le mode EFFECTIF (confirmé/sélectionné) pilote
-- tout le reste de la procédure, tandis que le mode PLANIFIÉ reste figé pour
-- tracer l'écart et la dérogation.
--
-- Le Worker écrit colonne par colonne (cf. migrations 031/032). Colonnes :
--   modePassationPlanifie → mode_passation_planifie   (sur mp_operation)
--   modePassationEffectif → mode_passation_effectif    (sur mp_procedure)
--   modeConfirmePlanifie  → mode_confirme_planifie      (sur mp_procedure)
-- (mode_passation effectif est aussi miroité dans operation.mode_passation
--  qui existe déjà, pour que les écrans aval cascadent correctement.)
-- ============================================================

-- Mode planifié figé sur l'opération (écrit aussi par ecr01d à la création PPM).
ALTER TABLE mp_operation ADD COLUMN IF NOT EXISTS mode_passation_planifie TEXT;   -- modePassationPlanifie

-- Mode effectif + confirmation, portés par la procédure (traçabilité de l'écart).
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS mode_passation_effectif TEXT;    -- modePassationEffectif
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS mode_confirme_planifie BOOLEAN;  -- modeConfirmePlanifie
