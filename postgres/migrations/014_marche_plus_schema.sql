-- ============================================
-- Migration 014 : Module Marché+ - Tables MP_*
-- ============================================
-- Crée 21 tables mp_* avec la MÊME structure que les tables Marché
-- (LIKE ... INCLUDING ALL = clone défauts, contraintes, index, commentaires).
-- Initialise chaque table mp_* avec les données actuelles de la table Marché correspondante.
--
-- IDEMPOTENT : ré-exécutable sans erreur (DO blocks vérifient l'existence avant création).
--
-- Réversible :
--   DROP TABLE IF EXISTS mp_<table> CASCADE;
-- ============================================

BEGIN;

-- Tables Marché à cloner (en respectant les dépendances éventuelles)
DO $mp$
DECLARE
  src_tables TEXT[] := ARRAY[
    'ppm_plan', 'operation', 'budget_line', 'livrable',
    'entreprise', 'groupement',
    'procedure', 'recours', 'attribution', 'ano',
    'echeancier', 'cle_repartition',
    'visa_cf', 'ordre_service',
    'avenant', 'resiliation', 'garantie', 'cloture',
    'document', 'decompte', 'difficulte'
  ];
  src TEXT;
  dst TEXT;
  src_exists BOOLEAN;
  dst_exists BOOLEAN;
  inserted_count INTEGER;
BEGIN
  FOREACH src IN ARRAY src_tables LOOP
    dst := 'mp_' || src;

    SELECT EXISTS(SELECT 1 FROM information_schema.tables
                   WHERE table_schema='public' AND table_name=src)
      INTO src_exists;

    IF NOT src_exists THEN
      RAISE NOTICE '[Marché+] Table source "%" introuvable, skip', src;
      CONTINUE;
    END IF;

    SELECT EXISTS(SELECT 1 FROM information_schema.tables
                   WHERE table_schema='public' AND table_name=dst)
      INTO dst_exists;

    IF dst_exists THEN
      RAISE NOTICE '[Marché+] Table "%" existe déjà, skip création', dst;
    ELSE
      EXECUTE format('CREATE TABLE %I (LIKE %I INCLUDING ALL)', dst, src);
      EXECUTE format('INSERT INTO %I SELECT * FROM %I', dst, src);
      GET DIAGNOSTICS inserted_count = ROW_COUNT;
      RAISE NOTICE '[Marché+] Table "%" créée + % lignes copiées depuis "%"', dst, inserted_count, src;
    END IF;
  END LOOP;
END $mp$;

COMMIT;

-- ============================================
-- Vérification post-migration
-- ============================================
SELECT
  'mp_' || src AS table_name,
  (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema='public' AND table_name='mp_' || src) AS exists_,
  (SELECT reltuples::BIGINT FROM pg_class
    WHERE relname='mp_' || src) AS rows_estimate
FROM unnest(ARRAY[
  'ppm_plan','operation','budget_line','livrable','entreprise','groupement',
  'procedure','recours','attribution','ano','echeancier','cle_repartition',
  'visa_cf','ordre_service','avenant','resiliation','garantie','cloture',
  'document','decompte','difficulte'
]) AS src
ORDER BY table_name;
