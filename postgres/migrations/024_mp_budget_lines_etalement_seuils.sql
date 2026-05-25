-- ============================================
-- Migration 024 : Étaler les enveloppes AE des mp_budget_line pour couvrir
-- toutes les tranches de seuils du Code MP CI (PSD/PSC/PSL/PSO/AOO).
-- ============================================
-- Convention métier client : c'est la SOMME des AE de l'activité (toutes lignes
-- mp_budget_line confondues) qui pilote la recommandation automatique du mode
-- de passation. Pour permettre des tests / démos couvrant CHAQUE tranche,
-- chaque activité reçoit un total AE dans une tranche distincte :
--
--   PSD  (0  – 10M)   : ACT_13001_003 (Formation, 7M), ACT_13030_006 (Études/conseil, 9M)
--   PSC  (10 – 30M)   : ACT_13001_004 (Services courants, 22M), ACT_13030_005 (Fournitures, 18M)
--   PSL  (30 – 50M)   : ACT_13001_005 (Études et audits, 40M), ACT_13030_003 (Entretien, 45M)
--   PSO  (50 – 100M)  : ACT_13001_002 (Équipements, 75M), ACT_13030_002 (Équipement réunion, 90M)
--   AOO  (>100M)      : ACT_13001_001 (Réhab infras, 1.5G), ACT_13030_001 (Construction, 6G),
--                       ACT_13030_004 (Véhicules, 250M)
--
-- IDEMPOTENT : DELETE de tous les ACT_* avant réinsertion.
-- ============================================

BEGIN;

-- Nettoyage des budget lines de test (codes ACT_*)
DELETE FROM mp_budget_line WHERE activite_code LIKE 'ACT_%';

-- ============================================================
-- INSERTIONS — Enveloppes étalées par tranche
-- ============================================================
INSERT INTO mp_budget_line
  (id, section, section_lib, programme, programme_lib, grande_nature,
   ua_code, ua_lib, zone_code, zone_lib, action_code, action_lib,
   activite_code, activite_lib, type_financement, source_financement,
   ligne_code, ligne_lib, ae, cp, created_at, updated_at)
VALUES

-- ============================================================
-- UA 13001 — Section 31990001 / Programme 780102
-- ============================================================

-- ACT_13001_001 → AOO : 1.5G total (3 bailleurs)
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
 '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-INF', 'Réhabilitation',
 'ACT_13001_001', 'Réhabilitation des infrastructures administratives', 'ETAT', 'TRESOR',
 'ACT_13001_001-ETAT', 'Réhabilitation infrastructures (Trésor)', 750000000, 400000000, NOW(), NOW()),
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
 '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-INF', 'Réhabilitation',
 'ACT_13001_001', 'Réhabilitation des infrastructures administratives', 'DON', 'BM',
 'ACT_13001_001-DON-BM', 'Réhabilitation infrastructures (BM)', 500000000, 300000000, NOW(), NOW()),
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
 '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-INF', 'Réhabilitation',
 'ACT_13001_001', 'Réhabilitation des infrastructures administratives', 'EMPRUNT', 'BAD',
 'ACT_13001_001-EMP-BAD', 'Réhabilitation infrastructures (BAD)', 250000000, 150000000, NOW(), NOW()),

-- ACT_13001_002 → PSO : 75M total (2 bailleurs)
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
 '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-EQP', 'Équipement',
 'ACT_13001_002', 'Acquisition d''équipements bureautiques', 'ETAT', 'TRESOR',
 'ACT_13001_002-ETAT', 'Équipements bureautiques (Trésor)', 45000000, 30000000, NOW(), NOW()),
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
 '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-EQP', 'Équipement',
 'ACT_13001_002', 'Acquisition d''équipements bureautiques', 'DON', 'AFD',
 'ACT_13001_002-DON-AFD', 'Équipements bureautiques (AFD)', 30000000, 20000000, NOW(), NOW()),

-- ACT_13001_003 → PSD : 7M total (1 bailleur)
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
 '13001', 'Assemblée N 1 Personnel', '01', 'Zone Centre', '780102-FOR', 'Formation',
 'ACT_13001_003', 'Formation du personnel administratif', 'ETAT', 'TRESOR',
 'ACT_13001_003-ETAT', 'Formation personnel (Trésor)', 7000000, 5000000, NOW(), NOW()),

-- ACT_13001_004 → PSC : 22M total (1 bailleur)
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
 '13001', 'Assemblée N 2 Biens et services', '01', 'Zone Centre', '780102-SVC', 'Services',
 'ACT_13001_004', 'Prestations de services courants', 'ETAT', 'TRESOR',
 'ACT_13001_004-ETAT', 'Services courants (Trésor)', 22000000, 15000000, NOW(), NOW()),

-- ACT_13001_005 → PSL : 40M total (2 bailleurs)
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
 '13001', 'Assemblée N 2 Biens et services', '01', 'Zone Centre', '780102-ETD', 'Études',
 'ACT_13001_005', 'Études et audits', 'ETAT', 'TRESOR',
 'ACT_13001_005-ETAT', 'Études et audits (Trésor)', 25000000, 18000000, NOW(), NOW()),
(gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
 '13001', 'Assemblée N 2 Biens et services', '01', 'Zone Centre', '780102-ETD', 'Études',
 'ACT_13001_005', 'Études et audits', 'DON', 'BM',
 'ACT_13001_005-DON-BM', 'Études et audits (BM)', 15000000, 10000000, NOW(), NOW()),

-- ============================================================
-- UA 13030 — Section 13030016 (Sénat) / Programme 110101
-- ============================================================

-- ACT_13030_001 → AOO : 6G total (2 bailleurs)
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
 '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-INF', 'Construction',
 'ACT_13030_001', 'Construction de bâtiments administratifs', 'ETAT', 'TRESOR',
 'ACT_13030_001-ETAT', 'Construction bâtiments (Trésor)', 3500000000, 2200000000, NOW(), NOW()),
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
 '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-INF', 'Construction',
 'ACT_13030_001', 'Construction de bâtiments administratifs', 'EMPRUNT', 'BOAD',
 'ACT_13030_001-EMP-BOAD', 'Construction bâtiments (BOAD)', 2500000000, 1500000000, NOW(), NOW()),

-- ACT_13030_002 → PSO : 90M total (1 bailleur)
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
 '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-EQP', 'Équipement',
 'ACT_13030_002', 'Équipement des salles de réunion', 'ETAT', 'TRESOR',
 'ACT_13030_002-ETAT', 'Équipement salles (Trésor)', 90000000, 60000000, NOW(), NOW()),

-- ACT_13030_003 → PSL : 45M total (1 bailleur)
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
 '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-MNT', 'Maintenance',
 'ACT_13030_003', 'Services d''entretien et maintenance', 'ETAT', 'TRESOR',
 'ACT_13030_003-ETAT', 'Entretien et maintenance (Trésor)', 45000000, 30000000, NOW(), NOW()),

-- ACT_13030_004 → AOO : 250M total (1 bailleur)
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
 '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-VEH', 'Véhicules',
 'ACT_13030_004', 'Acquisition de véhicules administratifs', 'ETAT', 'TRESOR',
 'ACT_13030_004-ETAT', 'Véhicules administratifs (Trésor)', 250000000, 150000000, NOW(), NOW()),

-- ACT_13030_005 → PSC : 18M total (1 bailleur)
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
 '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-FRN', 'Fournitures',
 'ACT_13030_005', 'Fournitures de bureau', 'ETAT', 'TRESOR',
 'ACT_13030_005-ETAT', 'Fournitures de bureau (Trésor)', 18000000, 12000000, NOW(), NOW()),

-- ACT_13030_006 → PSD : 9M total (2 bailleurs)
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
 '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-INT', 'Études et conseil',
 'ACT_13030_006', 'Prestations intellectuelles et conseil', 'ETAT', 'TRESOR',
 'ACT_13030_006-ETAT', 'Études et conseil (Trésor)', 5000000, 3500000, NOW(), NOW()),
(gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
 '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-INT', 'Études et conseil',
 'ACT_13030_006', 'Prestations intellectuelles et conseil', 'DON', 'UE',
 'ACT_13030_006-DON-UE', 'Études et conseil (UE)', 4000000, 2800000, NOW(), NOW());

COMMIT;

-- ============================================
-- Vérification : tranches couvertes par activité
-- ============================================
SELECT
  activite_code,
  activite_lib,
  COUNT(*) AS nb_lignes,
  SUM(ae)::BIGINT AS total_ae,
  CASE
    WHEN SUM(ae) < 10000000 THEN 'PSD (<10M)'
    WHEN SUM(ae) < 30000000 THEN 'PSC (10-30M)'
    WHEN SUM(ae) < 50000000 THEN 'PSL (30-50M)'
    WHEN SUM(ae) < 100000000 THEN 'PSO (50-100M)'
    ELSE 'AOO (>100M)'
  END AS tranche_seuil
FROM mp_budget_line
WHERE activite_code LIKE 'ACT_%'
GROUP BY activite_code, activite_lib
ORDER BY total_ae;
