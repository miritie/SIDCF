-- ============================================
-- Migration 019 : Opérations de test Marché+ couvrant tous les états du cycle
-- ============================================
-- Objectif : permettre la démonstration et le test de toutes les étapes du
-- processus en disposant d'au moins une opération dans chaque état :
--   PLANIFIE → EN_PROC → ATTRIBUE → VISE → EN_EXEC → CLOS (et RESILIE en
--   alternative terminale).
--
-- Chaque opération référence une activité existante dans mp_budget_line
-- (issue de la migration 015), avec une combinaison (typeMarche, natureCode,
-- montantPrevisionnel) cohérente avec les seuils du Code MP CI pour vérifier
-- le bon fonctionnement de la recommandation automatique de mode (Modif #53).
--
-- IDEMPOTENT : ré-exécutable. Les DELETE retirent les opérations TEST-* avant
-- réinsertion. Cela ne touche pas aux opérations réelles (préfixe différent).
--
-- Réversible :
--   DELETE FROM mp_operation WHERE id::text LIKE '00000000-0000-0000-0000-1900%';
-- ============================================

BEGIN;

-- 1) Nettoyage des opérations de test précédentes (préfixe d'UUID convenu)
DELETE FROM mp_operation
WHERE id IN (
  '00000000-0000-0000-0000-190000000001'::uuid,
  '00000000-0000-0000-0000-190000000002'::uuid,
  '00000000-0000-0000-0000-190000000003'::uuid,
  '00000000-0000-0000-0000-190000000004'::uuid,
  '00000000-0000-0000-0000-190000000005'::uuid,
  '00000000-0000-0000-0000-190000000006'::uuid,
  '00000000-0000-0000-0000-190000000007'::uuid
);

-- 2) Insertion des 7 opérations de démo (1 par état du cycle)
INSERT INTO mp_operation (
  id, plan_id, budget_line_id, exercice, unite, objet,
  type_marche, mode_passation, revue, nature_prix,
  montant_previsionnel, montant_actuel, devise,
  type_financement, source_financement,
  chaine_budgetaire, delai_execution, duree_previsionnelle,
  categorie_prestation, beneficiaire, livrables, localisation,
  timeline, etat, proc_derogation,
  created_at, updated_at
) VALUES

-- ======================================================================
-- 1. PLANIFIE — Petit marché Études/Audits, mode PSD recommandé
--    Activité ACT_13001_005 : enveloppe AE 130 M (50M TRESOR + 80M BM)
--    Montant op 6 M → tranche 0-10M → PSD selon ADMIN_CENTRALE
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000001'::uuid, NULL, NULL, 2026,
  'Assemblée N 1 Personnel',
  'TEST-PLANIF — Étude diagnostic de l''organisation administrative',
  'SERVICES_INTELLECTUELS', 'PSD', 'AUCUNE', 'FORFAIT',
  6000000, 6000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
    'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
    'activite', 'Études et audits', 'activiteCode', 'ACT_13001_005',
    'nature', '232 - Études et recherches', 'natureCode', '232',
    'ligneBudgetaire', 'ACT_13001_005232',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR')
    )
  ),
  30, 30, 'ETUDE', 'Direction administrative',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Plateau', 'localite', 'Plateau'),
  '["PLANIF"]'::jsonb, 'PLANIFIE', NULL,
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
),

-- ======================================================================
-- 2. EN_PROC — Fournitures de bureau, tranche moyenne, mode PSC
--    Activité ACT_13030_005 : enveloppe 100 M
--    Montant op 15 M → tranche 10-30M → PSC
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000002'::uuid, NULL, NULL, 2026,
  'Assemblée N 3 Biens et services',
  'TEST-EN_PROC — Acquisition de fournitures de bureau (DAO en cours)',
  'FOURNITURES', 'PSC', 'A_PRIORI', 'UNITAIRE',
  15000000, 15000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Sénat', 'sectionCode', '13030016',
    'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
    'activite', 'Fournitures de bureau', 'activiteCode', 'ACT_13030_005',
    'nature', '222 - Achats de biens', 'natureCode', '222',
    'ligneBudgetaire', 'ACT_13030_005222',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR')
    )
  ),
  60, 60, 'FOURNITURE', 'Services centraux',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Plateau', 'localite', 'Plateau'),
  '["PLANIF","EN_PROC"]'::jsonb, 'EN_PROC', NULL,
  NOW() - INTERVAL '21 days', NOW() - INTERVAL '5 days'
),

-- ======================================================================
-- 3. ATTRIBUE — Équipement bureautique, mode PSL (30-50M)
--    Activité ACT_13030_002 : enveloppe 600 M
--    Montant op 35 M → tranche 30-50M → PSL
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000003'::uuid, NULL, NULL, 2026,
  'Assemblée N 3 Investissements',
  'TEST-ATTRIBUE — Équipement audiovisuel des salles de réunion',
  'FOURNITURES', 'PSL', 'A_PRIORI', 'FORFAIT',
  35000000, 35000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Sénat', 'sectionCode', '13030016',
    'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
    'activite', 'Équipement des salles de réunion', 'activiteCode', 'ACT_13030_002',
    'nature', '232 - Matériel et outillage technique', 'natureCode', '232',
    'ligneBudgetaire', 'ACT_13030_002232',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR')
    )
  ),
  90, 90, 'EQUIPEMENT', 'Sénat — services généraux',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Plateau', 'localite', 'Plateau'),
  '["PLANIF","EN_PROC","ATTRIBUE"]'::jsonb, 'ATTRIBUE', NULL,
  NOW() - INTERVAL '45 days', NOW() - INTERVAL '3 days'
),

-- ======================================================================
-- 4. VISE — Acquisition véhicules, mode PSO (50-100M)
--    Activité ACT_13030_004 : enveloppe 800 M
--    Montant op 75 M → tranche 50-100M → PSO
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000004'::uuid, NULL, NULL, 2026,
  'Assemblée N 3 Investissements',
  'TEST-VISE — Acquisition de 5 véhicules administratifs (visa CF obtenu)',
  'FOURNITURES', 'PSO', 'A_PRIORI', 'UNITAIRE',
  75000000, 75000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Sénat', 'sectionCode', '13030016',
    'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
    'activite', 'Acquisition de véhicules administratifs', 'activiteCode', 'ACT_13030_004',
    'nature', '233 - Mobilier matériel et instruments', 'natureCode', '233',
    'ligneBudgetaire', 'ACT_13030_004233',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR')
    )
  ),
  120, 120, 'EQUIPEMENT', 'Cabinet et directions',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Plateau', 'localite', 'Plateau'),
  '["PLANIF","EN_PROC","ATTRIBUE","VISE"]'::jsonb, 'VISE', NULL,
  NOW() - INTERVAL '90 days', NOW() - INTERVAL '2 days'
),

-- ======================================================================
-- 5. EN_EXEC — Construction bâtiment, mode AOO (>100M)
--    Activité ACT_13030_001 : enveloppe 6500 M (TRESOR 4G + BOAD 2.5G)
--    Montant op 850 M → tranche >100M → AOO
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000005'::uuid, NULL, NULL, 2026,
  'Assemblée N 3 Investissements',
  'TEST-EN_EXEC — Construction d''un nouveau bâtiment administratif (chantier en cours)',
  'TRAVAUX', 'AOO', 'A_PRIORI', 'UNITAIRE',
  850000000, 850000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Sénat', 'sectionCode', '13030016',
    'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
    'activite', 'Construction de bâtiments administratifs', 'activiteCode', 'ACT_13030_001',
    'nature', '231 - Constructions', 'natureCode', '231',
    'ligneBudgetaire', 'ACT_13030_001231',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR', 'BOAD'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'),
      jsonb_build_object('montant', 0, 'typeFinancement', 'EMPRUNT', 'bailleur', 'BOAD')
    )
  ),
  365, 365, 'INFRASTRUCTURE', 'Sénat',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Plateau', 'localite', 'Plateau'),
  '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC"]'::jsonb, 'EN_EXEC', NULL,
  NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 days'
),

-- ======================================================================
-- 6. CLOS — Réhabilitation infrastructures, mode AOO, marché achevé
--    Activité ACT_13001_001 : enveloppe 6500 M
--    Montant op 1 200 M → tranche >100M → AOO
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000006'::uuid, NULL, NULL, 2025,
  'Assemblée N 1 Investissements',
  'TEST-CLOS — Réhabilitation infrastructures bloc administratif (réception définitive)',
  'TRAVAUX', 'AOO', 'A_PRIORI', 'UNITAIRE',
  1200000000, 1180000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
    'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
    'activite', 'Réhabilitation des infrastructures administratives', 'activiteCode', 'ACT_13001_001',
    'nature', '231 - Constructions', 'natureCode', '231',
    'ligneBudgetaire', 'ACT_13001_001231',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR', 'BM', 'BAD'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'),
      jsonb_build_object('montant', 0, 'typeFinancement', 'DON', 'bailleur', 'BM'),
      jsonb_build_object('montant', 0, 'typeFinancement', 'EMPRUNT', 'bailleur', 'BAD')
    )
  ),
  300, 300, 'INFRASTRUCTURE', 'Direction administrative',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Cocody', 'localite', 'Riviera'),
  '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC","CLOS"]'::jsonb, 'CLOS', NULL,
  NOW() - INTERVAL '420 days', NOW() - INTERVAL '15 days'
),

-- ======================================================================
-- 7. RESILIE — Services courants, mode PSO, marché résilié (terminal alternatif)
--    Activité ACT_13001_004 : enveloppe 200 M
--    Montant op 60 M → tranche 50-100M → PSO
-- ======================================================================
(
  '00000000-0000-0000-0000-190000000007'::uuid, NULL, NULL, 2026,
  'Assemblée N 2 Biens et services',
  'TEST-RESILIE — Marché nettoyage des locaux (résilié aux torts du titulaire)',
  'SERVICES_COURANTS', 'PSO', 'A_PRIORI', 'FORFAIT',
  60000000, 60000000, 'XOF',
  'ETAT', 'TRESOR',
  jsonb_build_object(
    'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
    'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
    'activite', 'Prestations de services courants', 'activiteCode', 'ACT_13001_004',
    'nature', '222 - Achats de biens', 'natureCode', '222',
    'ligneBudgetaire', 'ACT_13001_004222',
    'bailleur', 'TRESOR',
    'bailleurs', jsonb_build_array('TRESOR'),
    'financements', jsonb_build_array(
      jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR')
    )
  ),
  180, 180, 'SERVICE', 'Direction administrative',
  '[]'::jsonb,
  jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                     'departement', 'Cocody', 'localite', 'Cocody'),
  '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC","RESILIE"]'::jsonb, 'RESILIE', NULL,
  NOW() - INTERVAL '120 days', NOW() - INTERVAL '10 days'
);

COMMIT;

-- ============================================
-- Vérification post-migration
-- ============================================
SELECT
  etat,
  COUNT(*) AS nb_ops,
  STRING_AGG(SUBSTRING(objet FROM 1 FOR 60), ' | ' ORDER BY etat) AS exemples
FROM mp_operation
WHERE id::text LIKE '00000000-0000-0000-0000-1900%'
GROUP BY etat
ORDER BY array_position(
  ARRAY['PLANIFIE','EN_PROC','ATTRIBUE','VISE','EN_EXEC','CLOS','RESILIE']::text[],
  etat
);
