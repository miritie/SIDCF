-- ============================================================================
-- Migration 030 — Cohérence des données de démo (Marché+)
-- ----------------------------------------------------------------------------
-- Objectifs (CR 26 mai 2026 + demande cohérence du 29 mai 2026) :
--   1. Alimenter / corriger la NATURE ÉCONOMIQUE de toutes les opérations
--      (chaine_budgetaire.natureCode) pour qu'elle soit cohérente avec le
--      type de marché. Pour ADMIN_CENTRALE, les seuils du barème sont ['all']
--      → la natureCode n'affecte PAS le mode de passation (aucun impact sur les
--      scénarios conforme/dérogation existants).
--   2. Recadrer 4 opérations « clones » dont l'état était en avance sur les
--      données réellement présentes (cascade incohérente) → remises à PLANIFIE
--      cohérent + nettoyage des entités aval orphelines.
--   3. Ajouter un cas de DÉROGATION visible à l'étape Contractualisation :
--      une opération EN_PROC dont le mode (AOO) est hors barème (8 M → PSD
--      recommandé) → le bloc dérogation s'affiche sur l'écran Procédure.
--
-- Idempotent : ré-exécutable sans effet de bord (UPDATE par type, DELETE+INSERT
-- ciblés pour l'op de dérogation).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NATURE ÉCONOMIQUE COHÉRENTE (chaine_budgetaire.natureCode + .nature)
-- ----------------------------------------------------------------------------
-- Mapping type_marche → code NATURE_ECO (référentiel registries.json) :
--   TRAVAUX               → 231 Constructions
--   FOURNITURES           → 232 Équipements et matériels
--   SERVICES_INTELLECTUELS → 233 Études et prestations intellectuelles
--   PI                    → 233 Études et prestations intellectuelles
--   SERVICES_COURANTS     → 221 Fonctionnement courant
--   SERVICES              → 223 Achats de biens et services
-- (raffinement maintenance ci-dessous → 222)

UPDATE mp_operation SET
  chaine_budgetaire = jsonb_set(
    jsonb_set(COALESCE(chaine_budgetaire, '{}'::jsonb), '{natureCode}', '"231"'),
    '{nature}', '"231 - Constructions"'),
  updated_at = NOW()
WHERE type_marche = 'TRAVAUX';

UPDATE mp_operation SET
  chaine_budgetaire = jsonb_set(
    jsonb_set(COALESCE(chaine_budgetaire, '{}'::jsonb), '{natureCode}', '"232"'),
    '{nature}', '"232 - Équipements et matériels"'),
  updated_at = NOW()
WHERE type_marche = 'FOURNITURES';

UPDATE mp_operation SET
  chaine_budgetaire = jsonb_set(
    jsonb_set(COALESCE(chaine_budgetaire, '{}'::jsonb), '{natureCode}', '"233"'),
    '{nature}', '"233 - Études et prestations intellectuelles"'),
  updated_at = NOW()
WHERE type_marche IN ('SERVICES_INTELLECTUELS', 'PI');

UPDATE mp_operation SET
  chaine_budgetaire = jsonb_set(
    jsonb_set(COALESCE(chaine_budgetaire, '{}'::jsonb), '{natureCode}', '"221"'),
    '{nature}', '"221 - Fonctionnement courant"'),
  updated_at = NOW()
WHERE type_marche = 'SERVICES_COURANTS';

UPDATE mp_operation SET
  chaine_budgetaire = jsonb_set(
    jsonb_set(COALESCE(chaine_budgetaire, '{}'::jsonb), '{natureCode}', '"223"'),
    '{nature}', '"223 - Achats de biens et services"'),
  updated_at = NOW()
WHERE type_marche = 'SERVICES';

-- Raffinement : prestations de maintenance / réparation / entretien → 222
UPDATE mp_operation SET
  chaine_budgetaire = jsonb_set(
    jsonb_set(COALESCE(chaine_budgetaire, '{}'::jsonb), '{natureCode}', '"222"'),
    '{nature}', '"222 - Dépenses de maintenance"'),
  updated_at = NOW()
WHERE type_marche IN ('SERVICES', 'SERVICES_COURANTS')
  AND (objet ILIKE '%maintenance%' OR objet ILIKE '%réparation%'
       OR objet ILIKE '%entretien%' OR objet ILIKE '%climatis%'
       OR objet ILIKE '%ascenseur%' OR objet ILIKE '%nettoyage%');

-- ----------------------------------------------------------------------------
-- 2. RECADRAGE DES 4 OPÉRATIONS « CLONES » À CASCADE INCOHÉRENTE
-- ----------------------------------------------------------------------------
-- Ces opérations affichaient un état en avance sur leurs données (entités de
-- stades antérieurs manquantes). On les remet à un état PLANIFIE cohérent et on
-- supprime les éventuelles entités aval orphelines pour garantir la cohérence.
--   ffffffff…  VISE    (manquait procédure + attribution)
--   88888888…  EN_EXEC (manquait attribution ; visa/OS orphelins)
--   77777777…  EN_PROC (manquait procédure)
--   aaaaaaaa…  EN_EXEC (manquait visa)
DO $$
DECLARE
  ids uuid[] := ARRAY[
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ]::uuid[];
BEGIN
  DELETE FROM mp_procedure      WHERE operation_id = ANY(ids);
  DELETE FROM mp_attribution    WHERE operation_id = ANY(ids);
  DELETE FROM mp_visa_cf        WHERE operation_id = ANY(ids);
  DELETE FROM mp_ordre_service  WHERE operation_id = ANY(ids);
  DELETE FROM mp_echeancier     WHERE operation_id = ANY(ids);
  DELETE FROM mp_cle_repartition WHERE operation_id = ANY(ids);
  DELETE FROM mp_garantie       WHERE operation_id = ANY(ids);
  DELETE FROM mp_cloture        WHERE operation_id = ANY(ids);

  UPDATE mp_operation
     SET etat = 'PLANIFIE',
         timeline = '["PLANIF"]'::jsonb,
         updated_at = NOW()
   WHERE id = ANY(ids);
END $$;

-- ----------------------------------------------------------------------------
-- 3. CAS DE DÉROGATION À LA CONTRACTUALISATION (EN_PROC, mode hors barème)
-- ----------------------------------------------------------------------------
-- Op FOURNITURES à 8 M XOF (barème ADMIN_CENTRALE 0-10 M → PSD recommandé) mais
-- mode retenu = AOO → hors barème → le bloc dérogation s'affiche sur l'écran
-- Procédure (modePlanifieCode = modePassation faute de modePassationPlanifie).
DELETE FROM mp_procedure WHERE operation_id = '00000000-0000-0000-0000-190000000099'::uuid;
DELETE FROM mp_operation WHERE id = '00000000-0000-0000-0000-190000000099'::uuid;

INSERT INTO mp_operation (
  id, plan_id, budget_line_id, exercice, unite, objet,
  type_marche, mode_passation, revue, nature_prix,
  montant_previsionnel, montant_actuel, devise,
  type_financement, source_financement,
  chaine_budgetaire, delai_execution, duree_previsionnelle,
  categorie_prestation, beneficiaire, livrables, localisation,
  timeline, etat, proc_derogation,
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-190000000099'::uuid, NULL, NULL, 2026,
  'Assemblée N 3 Biens et services',
  'TEST-EN_PROC-DEROG — Acquisition équipement (mode AOO hors barème → dérogation)',
  'FOURNITURES', 'AOO', 'A_PRIORI', 'UNITAIRE',
  8000000, 8000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Sénat', 'sectionCode', '13030016',
    'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
    'activite', 'Fournitures de bureau', 'activiteCode', 'ACT_13030_005',
    'nature', '232 - Équipements et matériels', 'natureCode', '232',
    'ligneBudgetaire', 'ACT_13030_005232',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR')
    )
  ),
  60, 60, 'EQUIPEMENT', 'Direction des moyens généraux',
  jsonb_build_array(
    jsonb_build_object('id', 'LIV-099-1', 'type', 'FOURNITURE',
      'libelle', 'Équipement bureautique', 'localisation', 'Abidjan > Plateau')
  ),
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Plateau', 'localite', 'Plateau'),
  '["PLANIF", "EN_PROC"]'::jsonb, 'EN_PROC', NULL,
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'
);

INSERT INTO mp_procedure
  (id, operation_id, commission, mode_passation, categorie,
   type_dossier_appel, dossier_appel_doc, dates,
   nb_offres_recues, nb_offres_classees, pv, rapport_analyse_doc,
   decision_attribution_ref, created_at, updated_at)
VALUES (
  '00000000-0000-0001-0099-190000000099'::uuid,
  '00000000-0000-0000-0000-190000000099'::uuid,
  'COJO', 'AOO', 'NATIONALE',
  'DAO', NULL,
  jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '8 days')::date,
                     'dateRemiseOffres', (NOW() + INTERVAL '10 days')::date),
  0, 0, '{}'::jsonb, NULL, NULL,
  NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'
);

-- ----------------------------------------------------------------------------
-- Contrôle
-- ----------------------------------------------------------------------------
SELECT
  type_marche,
  chaine_budgetaire->>'natureCode' AS nature_code,
  COUNT(*) AS nb
FROM mp_operation
GROUP BY type_marche, chaine_budgetaire->>'natureCode'
ORDER BY type_marche;
