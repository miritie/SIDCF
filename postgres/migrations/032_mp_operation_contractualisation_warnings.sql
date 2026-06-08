-- ============================================================
-- 032 — Colonne contractualisation_warnings manquante sur mp_operation
-- ============================================================
-- Suite du correctif #150/#151 (Worker column-mapped, cf. migration 031) :
-- l'écran de contractualisation (ecr02a) met à jour MP_OPERATION avec
-- `contractualisationWarnings` (avertissements non bloquants consommés par la
-- fiche de vie, modif #79). Cette colonne n'existait pas → l'UPDATE de
-- l'opération échouait (HTTP 500) après la sauvegarde de la procédure.
-- Les autres champs écrits (mode_passation, proc_derogation, timeline, etat)
-- existent déjà.
-- camelToSnake : contractualisationWarnings → contractualisation_warnings.
-- ============================================================

ALTER TABLE mp_operation ADD COLUMN IF NOT EXISTS contractualisation_warnings JSONB;  -- contractualisationWarnings
