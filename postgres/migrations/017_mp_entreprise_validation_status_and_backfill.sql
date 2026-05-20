-- ============================================
-- Migration 017 : Modif #43 — Validation status + backfill mp_entreprise
-- ============================================
-- Ajoute les colonnes de workflow de validation sur `mp_entreprise` et
-- backfill le référentiel à partir des entreprises mentionnées dans les
-- attributions existantes (mp_attribution.attributaire->'entreprises').
--
-- Dédoublonnage : NCC en clé primaire de comparaison (case-insensitive),
-- raison sociale normalisée (alphanumérique, lowercase, sans espaces) en
-- fallback si NCC absent.
--
-- Scope volontairement réduit pour cette migration :
--   ✓ Backfill depuis mp_attribution.attributaire->'entreprises'
--   ✗ PAS de backfill des sous-traitants ni des soumissionnaires (la
--     structure JSONB de ces collections est moins stable et l'enjeu
--     prioritaire est le référentiel maître).
--   ✗ PAS de mise à jour de mp_attribution pour injecter `entrepriseId`
--     dans le JSONB (le frontend gère dual-mode au runtime).
--
-- Idempotent : ALTER…IF NOT EXISTS, INSERT avec ON CONFLICT, contraintes
-- ré-exécutables sans erreur.
--
-- Réversible :
--   ALTER TABLE mp_entreprise DROP COLUMN IF EXISTS validation_status, …;
--   DROP INDEX IF EXISTS idx_mp_entreprise_validation_status;
--   (Le backfill n'est pas annulable automatiquement — sauvegarder
--    `mp_entreprise` avant exécution si besoin de rollback strict.)
-- ============================================

BEGIN;

-- Étape 1 : Schéma — ajout des colonnes de validation
ALTER TABLE mp_entreprise
  ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20)
    DEFAULT 'VALIDATED'
    CHECK (validation_status IN ('PENDING', 'VALIDATED', 'MERGED')),
  ADD COLUMN IF NOT EXISTS validation_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS validation_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mp_entreprise_validation_status
  ON mp_entreprise(validation_status);

COMMENT ON COLUMN mp_entreprise.validation_status IS
  'PENDING (créée en flux d''attribution) | VALIDATED (saisie/validée par admin) | MERGED (fusionnée vers une autre fiche — voir Modif #44 pour merged_into_id)';

-- Les fiches existantes sont considérées comme validées (state historique)
UPDATE mp_entreprise SET validation_status = 'VALIDATED' WHERE validation_status IS NULL;

-- Étape 2 : Backfill depuis mp_attribution.attributaire->'entreprises'
-- Une attribution peut avoir une ou plusieurs entreprises (cas groupement).
-- En mode multi-lot, attributaire.parLot[lotId].attributaire.entreprises[].
-- Pour la v1 on traite uniquement le mode simple (attributaire.entreprises).
-- Le multi-lot sera couvert dans une migration de suivi si besoin.

DO $backfill$
DECLARE
  attr_row RECORD;
  ent JSONB;
  ncc_val TEXT;
  rs_val TEXT;
  rs_norm TEXT;
  existing_id UUID;
  total_inserted INTEGER := 0;
  total_skipped_existing INTEGER := 0;
  total_skipped_invalid INTEGER := 0;
BEGIN
  FOR attr_row IN
    SELECT id, attributaire
      FROM mp_attribution
     WHERE attributaire IS NOT NULL
       AND attributaire ? 'entreprises'
       AND jsonb_typeof(attributaire->'entreprises') = 'array'
  LOOP
    FOR ent IN
      SELECT value
        FROM jsonb_array_elements(attr_row.attributaire->'entreprises') AS value
    LOOP
      ncc_val := NULLIF(trim(ent->>'ncc'), '');
      rs_val := NULLIF(trim(ent->>'raisonSociale'), '');

      -- Skip si pas de raison sociale (donnée invalide)
      IF rs_val IS NULL OR length(rs_val) < 2 THEN
        total_skipped_invalid := total_skipped_invalid + 1;
        CONTINUE;
      END IF;

      existing_id := NULL;

      -- Lookup #1 : par NCC (clé d'unicité forte)
      IF ncc_val IS NOT NULL THEN
        SELECT id INTO existing_id
          FROM mp_entreprise
         WHERE LOWER(ncc) = LOWER(ncc_val)
         LIMIT 1;
      END IF;

      -- Lookup #2 (fallback) : par raison sociale normalisée
      IF existing_id IS NULL THEN
        rs_norm := LOWER(REGEXP_REPLACE(rs_val, '[^[:alnum:]]+', '', 'g'));
        IF rs_norm <> '' THEN
          SELECT id INTO existing_id
            FROM mp_entreprise
           WHERE LOWER(REGEXP_REPLACE(COALESCE(raison_sociale, ''), '[^[:alnum:]]+', '', 'g')) = rs_norm
           LIMIT 1;
        END IF;
      END IF;

      IF existing_id IS NOT NULL THEN
        total_skipped_existing := total_skipped_existing + 1;
        CONTINUE;
      END IF;

      -- Insertion : entreprise inconnue, on l'enrôle au référentiel
      BEGIN
        INSERT INTO mp_entreprise (
          ncc,
          raison_sociale,
          adresse,
          telephone,
          email,
          banque,
          validation_status,
          actif,
          created_at,
          updated_at
        )
        VALUES (
          ncc_val,
          rs_val,
          NULLIF(trim(ent->>'adresse'), ''),
          NULLIF(trim(ent->>'telephone'), ''),
          NULLIF(trim(ent->>'email'), ''),
          COALESCE(
            ent->'coordonneesBancaires',
            ent->'banque',
            '{}'::jsonb
          ),
          'VALIDATED',
          TRUE,
          NOW(),
          NOW()
        );
        total_inserted := total_inserted + 1;
      EXCEPTION WHEN unique_violation THEN
        -- Course condition ou NCC dupliqué en JSONB → skip silencieusement
        total_skipped_existing := total_skipped_existing + 1;
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Backfill mp_entreprise terminé : % insérées, % skippées (déjà en base), % skippées (données invalides)',
               total_inserted, total_skipped_existing, total_skipped_invalid;
END $backfill$;

-- Étape 3 : Statistiques de vérification
DO $stats$
DECLARE
  cnt_total INTEGER;
  cnt_validated INTEGER;
  cnt_pending INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_total FROM mp_entreprise;
  SELECT COUNT(*) INTO cnt_validated FROM mp_entreprise WHERE validation_status = 'VALIDATED';
  SELECT COUNT(*) INTO cnt_pending FROM mp_entreprise WHERE validation_status = 'PENDING';
  RAISE NOTICE 'État final mp_entreprise : % fiches au total (% VALIDATED, % PENDING)',
               cnt_total, cnt_validated, cnt_pending;
END $stats$;

COMMIT;

-- ============================================
-- Note d'exploitation
-- ============================================
-- Vérification post-migration :
--   SELECT validation_status, COUNT(*) FROM mp_entreprise GROUP BY validation_status;
--   SELECT raison_sociale, ncc, validation_status FROM mp_entreprise ORDER BY created_at DESC LIMIT 20;
--
-- Si le résultat semble incohérent (ex: doublons malgré le dédoublonnage),
-- enquêter sur le contenu des JSONB sources :
--   SELECT id, jsonb_array_length(attributaire->'entreprises') AS nb_ent
--     FROM mp_attribution
--    WHERE attributaire ? 'entreprises'
--    LIMIT 10;
-- ============================================
