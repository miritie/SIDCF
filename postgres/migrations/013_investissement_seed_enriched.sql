-- ============================================
-- SIDCF Portal - Module Investissement Seed Enrichi V2
-- ============================================
-- Migration: 013_investissement_seed_enriched.sql
-- Description: Données de démonstration enrichies pour le module Investissement V2
-- Inclut: OP provisoires, régies, suivi trimestriel, valeurs GAR, décisions CF
-- ============================================

-- ============================================
-- 1. MISE À JOUR DES PROJETS EXISTANTS
-- ============================================

-- Enrichir les projets existants avec les nouveaux champs
UPDATE inv_project SET
    dans_perimetre_dcf = 'OUI',
    statut_temporal = 'RECURRENT',
    date_premiere_inscription = '2021-01-01',
    nb_annees_pip = 4,
    code_sigobe = 'SIGOBE-2021-001',
    historique_pip = '[
        {"annee": 2021, "montant": 35000000000, "statut": "INSCRIT"},
        {"annee": 2022, "montant": 40000000000, "statut": "INSCRIT"},
        {"annee": 2023, "montant": 42000000000, "statut": "INSCRIT"},
        {"annee": 2024, "montant": 45000000000, "statut": "INSCRIT"}
    ]'::jsonb,
    acteurs = '{
        "comptable": "M. KOUAME Jean",
        "auditeur": "Cabinet KPMG CI",
        "responsable_passation": "Mme DIABATE Fatou"
    }'::jsonb
WHERE code = 'PAPSE-II';

UPDATE inv_project SET
    dans_perimetre_dcf = 'OUI',
    statut_temporal = 'NOUVEAU',
    date_premiere_inscription = '2022-01-01',
    nb_annees_pip = 3
WHERE code = 'PEJEDEC';

UPDATE inv_project SET
    dans_perimetre_dcf = 'OUI',
    statut_temporal = 'PHASE_CONTINUATION',
    date_premiere_inscription = '2020-06-01',
    nb_annees_pip = 5
WHERE code = 'ProSEB';

UPDATE inv_project SET
    dans_perimetre_dcf = 'PARTIEL',
    statut_temporal = 'REAPPARU_NOUVELLE_DYNAMIQUE',
    date_premiere_inscription = '2022-01-01',
    nb_annees_pip = 3
WHERE code = 'PASEA';

UPDATE inv_project SET
    dans_perimetre_dcf = 'OUI',
    statut_temporal = 'NOUVEAU',
    date_premiere_inscription = '2023-01-01',
    nb_annees_pip = 2
WHERE code = 'C2D-SANTE';

UPDATE inv_project SET
    dans_perimetre_dcf = 'OUI',
    statut_temporal = 'RECURRENT',
    date_premiere_inscription = '2020-01-01',
    nb_annees_pip = 5
WHERE code = 'PRICI';

-- ============================================
-- 2. HISTORIQUE PIP
-- ============================================

-- PAPSE-II - Historique complet
INSERT INTO inv_pip_history (project_id, annee, montant_inscrit, montant_execute, taux_execution, statut, rang_priorite, observations)
SELECT id, 2021, 35000000000, 28000000000, 80.0, 'INSCRIT', 12, 'Première année complète'
FROM inv_project WHERE code = 'PAPSE-II';

INSERT INTO inv_pip_history (project_id, annee, montant_inscrit, montant_execute, taux_execution, statut, rang_priorite, observations)
SELECT id, 2022, 40000000000, 32500000000, 81.3, 'INSCRIT', 10, 'Bonne performance'
FROM inv_project WHERE code = 'PAPSE-II';

INSERT INTO inv_pip_history (project_id, annee, montant_inscrit, montant_execute, taux_execution, statut, rang_priorite, observations)
SELECT id, 2023, 42000000000, 35000000000, 83.3, 'INSCRIT', 8, 'Performance en amélioration'
FROM inv_project WHERE code = 'PAPSE-II';

INSERT INTO inv_pip_history (project_id, annee, montant_inscrit, montant_execute, taux_execution, statut, rang_priorite, observations)
SELECT id, 2024, 45000000000, 32100000000, 71.3, 'INSCRIT', 5, 'En cours - T3'
FROM inv_project WHERE code = 'PAPSE-II';

-- PRICI - Historique (OPE)
INSERT INTO inv_pip_history (project_id, annee, montant_inscrit, montant_execute, taux_execution, statut, rang_priorite, observations)
SELECT id, 2024, 85000000000, 65800000000, 77.4, 'INSCRIT', 1, 'Projet OPE prioritaire'
FROM inv_project WHERE code = 'PRICI';

-- ============================================
-- 3. OP PROVISOIRES
-- ============================================

-- OP provisoire régularisé
INSERT INTO inv_provisional_op (
    project_id, reference, montant, date_emission, annee_exercice,
    montant_regularise, date_regularisation, reference_regularisation,
    statut, objet, beneficiaire, ua_code
)
SELECT id, 'OPP-2024-001', 850000000, '2024-02-15', 2024,
    850000000, '2024-04-20', 'REG-2024-015',
    'REGULARISE', 'Avance travaux lot 1 - Construction salles de classe',
    'SOGEA SATOM CI', 'UA-EDU-01'
FROM inv_project WHERE code = 'PAPSE-II';

-- OP provisoire partiellement régularisé
INSERT INTO inv_provisional_op (
    project_id, reference, montant, date_emission, annee_exercice,
    montant_regularise, date_regularisation,
    statut, objet, beneficiaire, ua_code
)
SELECT id, 'OPP-2024-008', 1200000000, '2024-06-10', 2024,
    400000000, '2024-08-15',
    'PARTIEL', 'Equipements informatiques phase 1',
    'CFAO Technology', 'UA-EDU-02'
FROM inv_project WHERE code = 'PEJEDEC';

-- OP provisoire non régularisé (alerte)
INSERT INTO inv_provisional_op (
    project_id, reference, montant, date_emission, annee_exercice,
    montant_regularise, statut, objet, beneficiaire, ua_code,
    is_prioritaire_n_plus_1
)
SELECT id, 'OPP-2024-012', 650000000, '2024-09-05', 2024,
    0, 'EMIS', 'Travaux d''urgence - Réhabilitation centre de santé',
    'COLAS CI', 'UA-SANTE-01',
    TRUE
FROM inv_project WHERE code = 'C2D-SANTE';

-- OP provisoire annulé en fin d'exercice précédent, reporté
INSERT INTO inv_provisional_op (
    project_id, reference, montant, date_emission, annee_exercice,
    montant_regularise, date_annulation, motif_annulation,
    statut, objet, beneficiaire, ua_code,
    is_prioritaire_n_plus_1, annee_report
)
SELECT id, 'OPP-2023-045', 500000000, '2023-11-20', 2023,
    0, '2023-12-31', 'Non régularisé à la clôture de l''exercice',
    'REPORTE', 'Fourniture mobilier scolaire',
    'KONE EQUIPEMENTS', 'UA-EDU-03',
    TRUE, 2024
FROM inv_project WHERE code = 'ProSEB';

-- ============================================
-- 4. RÉGIES
-- ============================================

-- Régie d'avances PAPSE-II
INSERT INTO inv_imprest (
    project_id, reference, type_regie, plafond,
    montant_alimente, montant_depense, montant_justifie, solde_disponible,
    regisseur_nom, regisseur_fonction, date_nomination,
    statut, date_creation, date_dernier_approvisionnement, date_derniere_justification
)
SELECT id, 'REG-PAPSE-001', 'AVANCES', 50000000,
    45000000, 38000000, 35000000, 7000000,
    'M. BAMBA Moussa', 'Comptable UCP', '2023-01-15',
    'ACTIVE', '2023-01-15', '2024-09-01', '2024-08-30'
FROM inv_project WHERE code = 'PAPSE-II';

-- Régie PRICI
INSERT INTO inv_imprest (
    project_id, reference, type_regie, plafond,
    montant_alimente, montant_depense, montant_justifie, solde_disponible,
    regisseur_nom, regisseur_fonction, date_nomination,
    statut, date_creation, date_dernier_approvisionnement
)
SELECT id, 'REG-PRICI-001', 'AVANCES', 100000000,
    95000000, 92000000, 88000000, 3000000,
    'Mme SEKA Aya', 'RAF AGEROUTE', '2022-06-01',
    'ACTIVE', '2022-06-01', '2024-10-15'
FROM inv_project WHERE code = 'PRICI';

-- Mouvements de régie
INSERT INTO inv_imprest_movement (imprest_id, type_mouvement, montant, date_mouvement, reference, objet, beneficiaire, numero_op)
SELECT i.id, 'ALIMENTATION', 25000000, '2024-01-15', 'OP-2024-REG-001', 'Approvisionnement T1', NULL, 'OP-2024-012'
FROM inv_imprest i JOIN inv_project p ON i.project_id = p.id WHERE p.code = 'PAPSE-II' AND i.reference = 'REG-PAPSE-001';

INSERT INTO inv_imprest_movement (imprest_id, type_mouvement, montant, date_mouvement, reference, objet, beneficiaire)
SELECT i.id, 'DEPENSE', 8500000, '2024-02-20', 'DEP-2024-001', 'Fournitures de bureau', 'LIBRAIRIE DE FRANCE'
FROM inv_imprest i JOIN inv_project p ON i.project_id = p.id WHERE p.code = 'PAPSE-II' AND i.reference = 'REG-PAPSE-001';

INSERT INTO inv_imprest_movement (imprest_id, type_mouvement, montant, date_mouvement, reference, objet)
SELECT i.id, 'JUSTIFICATION', 8500000, '2024-03-05', 'JUST-2024-001', 'Justification dépenses T1'
FROM inv_imprest i JOIN inv_project p ON i.project_id = p.id WHERE p.code = 'PAPSE-II' AND i.reference = 'REG-PAPSE-001';

-- ============================================
-- 5. SUIVI TRIMESTRIEL
-- ============================================

-- PAPSE-II - Suivi trimestriel 2024
INSERT INTO inv_quarterly_tracking (
    project_id, annee, trimestre,
    niveau_attendu, niveau_reel, ecart,
    budget_prevu_cumule, budget_execute_cumule, taux_execution,
    activites_prevues, activites_realisees, livrables_attendus, livrables_livres,
    appreciation, observations, actions_correctives, date_rapport, valide_par, date_validation
)
SELECT id, 2024, 1,
    25.0, 22.5, -2.5,
    11250000000, 9800000000, 87.1,
    8, 7, 5, 4,
    'BON', 'Léger retard sur construction salles mais rattrapage prévu', 'Renforcement équipes chantier',
    '2024-04-10', 'M. KOUASSI CF', '2024-04-15'
FROM inv_project WHERE code = 'PAPSE-II';

INSERT INTO inv_quarterly_tracking (
    project_id, annee, trimestre,
    niveau_attendu, niveau_reel, ecart,
    budget_prevu_cumule, budget_execute_cumule, taux_execution,
    activites_prevues, activites_realisees, livrables_attendus, livrables_livres,
    appreciation, observations, date_rapport, valide_par, date_validation
)
SELECT id, 2024, 2,
    50.0, 48.0, -2.0,
    22500000000, 20500000000, 91.1,
    15, 14, 12, 11,
    'BON', 'Progression conforme, un livrable en cours de validation',
    '2024-07-12', 'M. KOUASSI CF', '2024-07-18'
FROM inv_project WHERE code = 'PAPSE-II';

INSERT INTO inv_quarterly_tracking (
    project_id, annee, trimestre,
    niveau_attendu, niveau_reel, ecart,
    budget_prevu_cumule, budget_execute_cumule, taux_execution,
    activites_prevues, activites_realisees, livrables_attendus, livrables_livres,
    appreciation, observations, risques_identifies, date_rapport
)
SELECT id, 2024, 3,
    75.0, 71.3, -3.7,
    33750000000, 32100000000, 95.1,
    22, 20, 18, 16,
    'NORMAL', 'Retard cumulé à surveiller, nécessite accélération T4',
    'Risque de non atteinte des objectifs annuels si rythme non accéléré',
    '2024-10-08'
FROM inv_project WHERE code = 'PAPSE-II';

-- ProSEB - Suivi avec anomalie (exécuté > transféré)
INSERT INTO inv_quarterly_tracking (
    project_id, annee, trimestre,
    niveau_attendu, niveau_reel, ecart,
    budget_prevu_cumule, budget_execute_cumule, taux_execution,
    appreciation, observations, risques_identifies
)
SELECT id, 2024, 3,
    75.0, 80.3, 5.3,
    26250000000, 28120000000, 107.1,
    'CRITIQUE', 'ANOMALIE: Exécution supérieure au budget transféré. Investigation en cours.',
    'Risque de rejet des paiements, nécessite régularisation urgente'
FROM inv_project WHERE code = 'ProSEB';

-- ============================================
-- 6. VALEURS GAR PÉRIODIQUES
-- ============================================

-- Valeurs T3 2024 pour indicateurs PAPSE-II
INSERT INTO inv_gar_values (
    indicator_id, project_id, annee, periode,
    valeur_cible, valeur_realisee, ecart, taux_atteinte,
    source_donnee, methode_collecte, date_collecte,
    observations, valide_par, date_validation, validateur_type
)
SELECT
    gi.id,
    p.id,
    2024, 'T3',
    225, 245, 20, 108.9,
    'Rapport UCP + Mission terrain', 'Comptage physique sur sites',
    '2024-09-30',
    'Objectif T3 dépassé, 82% de l''objectif annuel atteint',
    'M. KOUASSI CF', '2024-10-05', 'CF'
FROM inv_gar_indicator gi
JOIN inv_project p ON gi.project_id = p.id
WHERE p.code = 'PAPSE-II' AND gi.code = 'IND-01';

INSERT INTO inv_gar_values (
    indicator_id, project_id, annee, periode,
    valeur_cible, valeur_realisee, ecart, taux_atteinte,
    source_donnee, date_collecte,
    observations, facteursSucces, valide_par, validateur_type
)
SELECT
    gi.id,
    p.id,
    2024, 'T3',
    3750, 4200, 450, 112.0,
    'Attestations de formation', '2024-09-30',
    'Formation accélérée pour rattraper retard S1',
    'Partenariat avec ENS renforcé',
    'Dr. N''GUESSAN', 'TECHNIQUE'
FROM inv_gar_indicator gi
JOIN inv_project p ON gi.project_id = p.id
WHERE p.code = 'PAPSE-II' AND gi.code = 'IND-02';

-- ============================================
-- 7. DÉCISIONS CF/DCF
-- ============================================

-- Décision de validation budget éclaté
INSERT INTO inv_decision (
    project_id, reference, type_decision, objet, motif,
    emetteur, signataire_nom, signataire_fonction,
    date_decision, date_effet, statut,
    entite_concernee, commentaire
)
SELECT id, 'DCF-2024-INV-001', 'VISA',
    'Validation du budget éclaté 2024',
    'Budget conforme aux prévisions PTBA et à la notification LF',
    'CF', 'M. KOUASSI Yao', 'Contrôleur Financier',
    '2024-01-25', '2024-01-25', 'VALIDE',
    'BUDGET', 'Validation sans réserve'
FROM inv_project WHERE code = 'PAPSE-II';

-- Avis sur avenant
INSERT INTO inv_decision (
    project_id, reference, type_decision, objet, motif,
    emetteur, signataire_nom, signataire_fonction,
    date_decision, date_effet, statut,
    entite_concernee, commentaire
)
SELECT id, 'DCF-2024-INV-015', 'AVIS',
    'Avis sur projet d''avenant n°3 - Extension périmètre',
    'Avis favorable sous réserve de soutenabilité budgétaire confirmée',
    'DCF', 'M. KOFFI Robert', 'Directeur Contrôle Financier',
    '2024-08-10', '2024-08-15', 'VALIDE',
    'AVENANT', 'Nécessite actualisation des marchés associés'
FROM inv_project WHERE code = 'PASEA';

-- Dérogation accordée
INSERT INTO inv_decision (
    project_id, reference, type_decision, objet, motif,
    emetteur, signataire_nom, signataire_fonction,
    date_decision, date_effet, date_expiration, statut,
    commentaire
)
SELECT id, 'DCF-2024-DER-003', 'DEROGATION',
    'Dérogation délai de régularisation lettre d''avance',
    'Contexte exceptionnel - Difficultés d''approvisionnement',
    'DCF', 'M. KOFFI Robert', 'Directeur Contrôle Financier',
    '2024-09-01', '2024-09-01', '2024-12-31', 'VALIDE',
    'Délai de régularisation porté à 120 jours exceptionnellement'
FROM inv_project WHERE code = 'C2D-SANTE';

-- Suspension (exemple)
INSERT INTO inv_decision (
    project_id, reference, type_decision, objet, motif,
    emetteur, signataire_nom, signataire_fonction,
    date_decision, date_effet, statut,
    commentaire
)
SELECT id, 'CF-2024-SUS-001', 'SUSPENSION',
    'Suspension temporaire des engagements',
    'Anomalie détectée - Exécution supérieure au transféré',
    'CF', 'M. KOUAME Paul', 'Contrôleur Financier',
    '2024-10-05', '2024-10-05', 'VALIDE',
    'Suspension maintenue jusqu''à régularisation de l''anomalie'
FROM inv_project WHERE code = 'ProSEB';

-- ============================================
-- 8. NOUVELLES ALERTES ENRICHIES
-- ============================================

-- Alerte OP provisoire non régularisé
INSERT INTO inv_alert (
    project_id, type_alerte, code_alerte, priorite,
    titre, description, entite_type, annee,
    valeur_seuil, valeur_actuelle,
    statut, date_detection, lien_action
)
SELECT id, 'OP_PROVISOIRE_NON_REGULARISE', 'OPP-NR-001', 'MAJEURE',
    'OP provisoire non régularisé',
    'L''OP provisoire OPP-2024-012 de 650 M FCFA émis le 05/09/2024 n''est pas encore régularisé. Délai restant: 56 jours avant fin d''exercice.',
    'INV_PROVISIONAL_OP', 2024,
    60, 56,
    'ACTIVE', '2024-11-05', '/investissement/projet?id={id}&tab=financier'
FROM inv_project WHERE code = 'C2D-SANTE';

-- Alerte régie proche du plafond
INSERT INTO inv_alert (
    project_id, type_alerte, code_alerte, priorite,
    titre, description, entite_type, annee,
    valeur_seuil, valeur_actuelle,
    statut, date_detection, lien_action
)
SELECT id, 'REGIE_PLAFOND_ATTEINT', 'REG-PLA-001', 'INFO',
    'Régie proche du plafond',
    'La régie REG-PRICI-001 a un taux d''utilisation de 97%. Solde disponible: 3 M FCFA sur un plafond de 100 M FCFA.',
    'INV_IMPREST', 2024,
    90, 97,
    'ACTIVE', '2024-10-20', '/investissement/projet?id={id}&tab=financier'
FROM inv_project WHERE code = 'PRICI';

-- Alerte baseline manquante
INSERT INTO inv_alert (
    project_id, type_alerte, code_alerte, priorite,
    titre, description, entite_type, annee,
    statut, date_detection, lien_action
)
SELECT id, 'BASELINE_MANQUANTE', 'BAS-001', 'MAJEURE',
    'Mission baseline non réalisée',
    'Le projet C2D-SANTE Phase III a démarré depuis 9 mois mais n''a pas de mission baseline de référence.',
    'INV_PHYSICAL_TRACKING', 2024,
    'ACTIVE', '2024-10-01', '/investissement/projet?id={id}&tab=physique'
FROM inv_project WHERE code = 'C2D-SANTE';

-- Alerte projet OPE en difficulté
INSERT INTO inv_alert (
    project_id, type_alerte, code_alerte, priorite,
    titre, description, entite_type, annee,
    valeur_seuil, valeur_actuelle,
    statut, date_detection, lien_action
)
SELECT id, 'PROJET_OPE_EN_DIFFICULTE', 'OPE-DIF-001', 'CRITIQUE',
    'Projet OPE en situation critique',
    'Le projet OPE ProSEB présente une anomalie grave (exécution > transféré) et une suspension CF active.',
    'INV_PROJECT', 2024,
    0, 1,
    'ACTIVE', '2024-10-06', '/investissement/projet?id={id}'
FROM inv_project WHERE code = 'ProSEB';

-- ============================================
-- 9. MISE À JOUR DES BUDGETS AVEC SOURCE LF
-- ============================================

UPDATE inv_budget SET
    source_lf = 'LF_INITIALE',
    reports_anterieurs = 2500000000,
    autorisation_executer = 41000000000,
    date_notification = '2024-01-15',
    reference_notification = 'NOT-2024-001'
WHERE project_id = (SELECT id FROM inv_project WHERE code = 'PAPSE-II') AND annee = 2024;

UPDATE inv_budget SET
    source_lf = 'LF_RECTIFICATIVE',
    reports_anterieurs = 0,
    autorisation_executer = 45500000000,
    date_notification = '2024-06-01',
    reference_notification = 'NOT-2024-REC-015'
WHERE project_id = (SELECT id FROM inv_project WHERE code = 'PASEA') AND annee = 2024;

-- ============================================
-- FIN DU SEED ENRICHI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Seed Enrichi V2 - Module Investissement';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Données ajoutées:';
  RAISE NOTICE '  - Historique PIP: 5 entrées';
  RAISE NOTICE '  - OP Provisoires: 4 entrées';
  RAISE NOTICE '  - Régies: 2 entrées + mouvements';
  RAISE NOTICE '  - Suivi trimestriel: 4 entrées';
  RAISE NOTICE '  - Valeurs GAR: 2 entrées';
  RAISE NOTICE '  - Décisions CF/DCF: 4 entrées';
  RAISE NOTICE '  - Alertes enrichies: 4 entrées';
  RAISE NOTICE '==============================================';
END $$;
