-- ============================================
-- Migration 006: Seed Operations (18 opérations - 3 par type de procédure)
-- ============================================
-- Données cohérentes pour tester le workflow complet de chaque type de procédure
-- PSD (3), PSC (3), PSL (3), PSO (3), AOO (3), PI (3)

-- Nettoyer les opérations existantes
DELETE FROM operations;

-- ============================================
-- PSD - Procédure Simplifiée d'Entente Directe (< 10M XOF)
-- ============================================

INSERT INTO operations (
  id, plan_id, budget_line_id, exercice, unite, unite_code, objet,
  type_marche, mode_passation, revue, nature_prix,
  montant_previsionnel, montant_actuel, devise,
  type_financement, source_financement,
  chaine_budgetaire,
  delai_execution, duree_previsionnelle, categorie_prestation, beneficiaire,
  livrables, localisation,
  timeline, etat, proc_derogation,
  created_at, updated_at
) VALUES
-- PSD-001: Formation bureautique
(
  'OP-PSD-001', NULL, NULL, 2024, 'Direction de la Formation Continue', 'DFC',
  'Formation du personnel administratif sur les outils numériques',
  'SERVICES_COURANTS', 'PSD', 'AUCUNE', 'FORFAIT',
  5000000, 5000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Direction de zone 780 102", "sectionCode": "DZ780102", "programme": "Sous-préfecture 1300101", "programmeCode": "SP1300101", "activite": "Formation du personnel administratif", "activiteCode": "FORM_ADM", "ligneBudgetaire": "62200000", "nature": "223", "bailleur": "TRESOR"}'::jsonb,
  30, 30, 'FORMATION', 'Direction des Ressources Humaines',
  '[{"id": "LIV-PSD-001-1", "type": "SERVICE", "libelle": "Formation de 50 agents sur Word, Excel et PowerPoint", "localisation": "Abidjan > Cocody > Deux Plateaux"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Cocody", "departementCode": "COC", "sousPrefecture": "Cocody", "sousPrefectureCode": "COC-SP", "localite": "Deux Plateaux", "longitude": -4.02290, "latitude": 5.33255, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-01-15 08:00:00', '2024-01-15 08:00:00'
),
-- PSD-002: Fournitures de bureau
(
  'OP-PSD-002', NULL, NULL, 2024, 'Direction de l''Équipement', 'DEQ',
  'Achat de fournitures de bureau pour le siège',
  'FOURNITURES', 'PSD', 'AUCUNE', 'UNITAIRE',
  8500000, 8500000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Direction de zone 780 102", "sectionCode": "DZ780102", "programme": "Sous-préfecture 1300101", "programmeCode": "SP1300101", "activite": "Fonctionnement administratif", "activiteCode": "FONCT_ADM", "ligneBudgetaire": "62100000", "nature": "221", "bailleur": "TRESOR"}'::jsonb,
  15, 15, 'FOURNITURE', 'Ensemble des services administratifs',
  '[{"id": "LIV-PSD-002-1", "type": "FOURNITURE", "libelle": "Ramettes de papier A4, stylos, agrafeuses", "localisation": "Abidjan > Plateau > Centre-ville"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Plateau", "departementCode": "PLT", "sousPrefecture": "Plateau", "sousPrefectureCode": "PLT-SP", "localite": "Centre-ville", "longitude": -4.01667, "latitude": 5.31667, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-02-10 09:30:00', '2024-02-10 09:30:00'
),
-- PSD-003: Maintenance informatique
(
  'OP-PSD-003', NULL, NULL, 2024, 'Direction Informatique', 'DI',
  'Maintenance préventive du parc informatique (50 postes)',
  'SERVICES_COURANTS', 'PSD', 'AUCUNE', 'FORFAIT',
  7200000, 7200000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Direction de zone 780 102", "sectionCode": "DZ780102", "programme": "Sous-préfecture 1300101", "programmeCode": "SP1300101", "activite": "Maintenance informatique", "activiteCode": "MAINT_INFO", "ligneBudgetaire": "62220000", "nature": "222", "bailleur": "TRESOR"}'::jsonb,
  20, 20, 'SERVICE', 'Parc informatique de la Direction',
  '[{"id": "LIV-PSD-003-1", "type": "SERVICE", "libelle": "Nettoyage, vérification et mise à jour de 50 postes", "localisation": "Abidjan > Cocody > Riviera"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Cocody", "departementCode": "COC", "sousPrefecture": "Cocody", "sousPrefectureCode": "COC-SP", "localite": "Riviera", "longitude": -3.98333, "latitude": 5.36667, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-03-01 10:00:00', '2024-03-01 10:00:00'
),

-- ============================================
-- PSC - Procédure Simplifiée de Cotation (10M - 30M XOF)
-- ============================================

-- PSC-001: Réhabilitation école
(
  'OP-PSC-001', NULL, NULL, 2024, 'Direction des Infrastructures Scolaires', 'DIS',
  'Réhabilitation de 3 salles de classe à l''école primaire de Bassam',
  'TRAVAUX', 'PSC', 'A_POSTERIORI', 'FORFAIT',
  18000000, 18000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Ministère de l''Éducation Nationale", "sectionCode": "MEN", "programme": "Programme Construction Écoles", "programmeCode": "PCE", "activite": "Réhabilitation des infrastructures scolaires", "activiteCode": "REHAB_ECOLES", "ligneBudgetaire": "63100000", "nature": "231", "bailleur": "TRESOR"}'::jsonb,
  60, 60, 'INFRASTRUCTURE', 'École Primaire Publique de Grand-Bassam',
  '[{"id": "LIV-PSC-001-1", "type": "BATIMENT", "libelle": "Réfection de 3 salles (toiture, peinture, menuiserie)", "localisation": "Comoé > Grand-Bassam > Centre"}]'::jsonb,
  '{"region": "Comoé", "regionCode": "COM", "departement": "Grand-Bassam", "departementCode": "GBAS", "sousPrefecture": "Grand-Bassam", "sousPrefectureCode": "GBAS-SP", "localite": "Centre", "longitude": -3.73889, "latitude": 5.21111, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-03-05 10:00:00', '2024-03-05 10:00:00'
),
-- PSC-002: Équipements médicaux
(
  'OP-PSC-002', NULL, NULL, 2024, 'Direction de la Santé Publique', 'DSP',
  'Fourniture d''équipements médicaux pour le centre de santé de Bingerville',
  'FOURNITURES', 'PSC', 'A_POSTERIORI', 'UNITAIRE',
  25000000, 25000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Ministère de la Santé", "sectionCode": "MS", "programme": "Programme Équipement Sanitaire", "programmeCode": "PES", "activite": "Équipement des centres de santé", "activiteCode": "EQUIP_SANTE", "ligneBudgetaire": "63200000", "nature": "232", "bailleur": "TRESOR"}'::jsonb,
  45, 45, 'EQUIPEMENT', 'Centre de Santé Urbain de Bingerville',
  '[{"id": "LIV-PSC-002-1", "type": "EQUIPEMENT", "libelle": "Lits d''hospitalisation, tables d''examen, armoires médicales", "localisation": "Abidjan > Bingerville > Centre"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Bingerville", "departementCode": "BING", "sousPrefecture": "Bingerville", "sousPrefectureCode": "BING-SP", "localite": "Centre", "longitude": -3.89722, "latitude": 5.35833, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-04-12 11:15:00', '2024-04-12 11:15:00'
),
-- PSC-003: Mobilier scolaire
(
  'OP-PSC-003', NULL, NULL, 2024, 'Direction de l''Équipement Scolaire', 'DES',
  'Fourniture de 200 tables-bancs pour 5 écoles primaires',
  'FOURNITURES', 'PSC', 'A_POSTERIORI', 'UNITAIRE',
  22000000, 22000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Ministère de l''Éducation Nationale", "sectionCode": "MEN", "programme": "Programme Équipement Écoles", "programmeCode": "PEE", "activite": "Équipement mobilier scolaire", "activiteCode": "EQUIP_SCOL", "ligneBudgetaire": "63210000", "nature": "232", "bailleur": "TRESOR"}'::jsonb,
  30, 30, 'EQUIPEMENT', '5 écoles primaires du district d''Abidjan',
  '[{"id": "LIV-PSC-003-1", "type": "EQUIPEMENT", "libelle": "200 tables-bancs en bois et métal", "localisation": "Abidjan > Abobo > Zone 1"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Abobo", "departementCode": "ABO", "sousPrefecture": "Abobo", "sousPrefectureCode": "ABO-SP", "localite": "Zone 1", "longitude": -4.02000, "latitude": 5.42500, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-05-08 09:00:00', '2024-05-08 09:00:00'
),

-- ============================================
-- PSL - Procédure Simplifiée à Compétition Limitée (30M - 50M XOF)
-- ============================================

-- PSL-001: Voie express aéroport
(
  'OP-PSL-001', NULL, NULL, 2024, 'Direction des Routes et Ponts', 'DRP',
  'Réhabilitation de la voie express de l''aéroport',
  'TRAVAUX', 'PSL', 'A_PRIORI', 'FORFAIT',
  42000000, 42000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Ministère des Infrastructures", "sectionCode": "MI", "programme": "Programme Entretien Routes", "programmeCode": "PER", "activite": "Réhabilitation des infrastructures routières", "activiteCode": "REHAB_ROUTES", "ligneBudgetaire": "63150000", "nature": "231", "bailleur": "TRESOR"}'::jsonb,
  90, 90, 'INFRASTRUCTURE', 'Population d''Abidjan et usagers de l''aéroport',
  '[{"id": "LIV-PSL-001-1", "type": "INFRASTRUCTURE", "libelle": "Reprise de la chaussée sur 2 km, signalisation", "localisation": "Abidjan > Port-Bouët > Zone aéroportuaire"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Port-Bouët", "departementCode": "PB", "sousPrefecture": "Port-Bouët", "sousPrefectureCode": "PB-SP", "localite": "Zone aéroportuaire", "longitude": -3.92667, "latitude": 5.25639, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-05-20 08:30:00', '2024-05-20 08:30:00'
),
-- PSL-002: Système GED
(
  'OP-PSL-002', NULL, NULL, 2024, 'Direction de l''Informatique', 'DIT',
  'Déploiement d''un système de gestion électronique des documents (GED)',
  'SERVICES_INTELLECTUELS', 'PSL', 'A_PRIORI', 'FORFAIT',
  38000000, 38000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Primature", "sectionCode": "PM", "programme": "Programme Modernisation Administration", "programmeCode": "PMA", "activite": "Transformation numérique", "activiteCode": "TRANSFO_NUM", "ligneBudgetaire": "63300000", "nature": "233", "bailleur": "TRESOR"}'::jsonb,
  120, 120, 'ETUDE', 'Ensemble des directions administratives',
  '[{"id": "LIV-PSL-002-1", "type": "LOGICIEL", "libelle": "Plateforme GED avec modules de workflow et archivage", "localisation": "Abidjan > Plateau > Immeuble SCIAM"}, {"id": "LIV-PSL-002-2", "type": "SERVICE", "libelle": "Formation de 100 utilisateurs", "localisation": "Abidjan > Plateau > Immeuble SCIAM"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Plateau", "departementCode": "PLT", "sousPrefecture": "Plateau", "sousPrefectureCode": "PLT-SP", "localite": "Immeuble SCIAM", "longitude": -4.02556, "latitude": 5.32083, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-06-15 09:45:00', '2024-06-15 09:45:00'
),
-- PSL-003: Construction maison des jeunes
(
  'OP-PSL-003', NULL, NULL, 2024, 'Direction de la Jeunesse', 'DJ',
  'Construction d''une maison des jeunes à Yamoussoukro',
  'TRAVAUX', 'PSL', 'A_PRIORI', 'FORFAIT',
  48000000, 48000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Ministère de la Jeunesse", "sectionCode": "MJ", "programme": "Programme Infrastructures Jeunesse", "programmeCode": "PIJ", "activite": "Construction maisons des jeunes", "activiteCode": "CONST_MDJ", "ligneBudgetaire": "63160000", "nature": "231", "bailleur": "TRESOR"}'::jsonb,
  180, 180, 'INFRASTRUCTURE', 'Jeunesse de Yamoussoukro',
  '[{"id": "LIV-PSL-003-1", "type": "BATIMENT", "libelle": "Bâtiment R+1 avec salles polyvalentes et bibliothèque", "localisation": "Yamoussoukro > Centre > Quartier résidentiel"}]'::jsonb,
  '{"region": "Yamoussoukro", "regionCode": "YAM", "departement": "Yamoussoukro", "departementCode": "YAM", "sousPrefecture": "Yamoussoukro", "sousPrefectureCode": "YAM-SP", "localite": "Quartier résidentiel", "longitude": -5.27580, "latitude": 6.82055, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-07-01 10:30:00', '2024-07-01 10:30:00'
),

-- ============================================
-- PSO - Procédure Simplifiée à Compétition Ouverte (50M - 100M XOF)
-- ============================================

-- PSO-001: Forages d'eau
(
  'OP-PSO-001', NULL, NULL, 2024, 'Direction de l''Hydraulique Rurale', 'DHR',
  'Construction de 10 forages d''eau potable dans la région du Tchologo',
  'TRAVAUX', 'PSO', 'A_PRIORI', 'UNITAIRE',
  75000000, 75000000, 'XOF',
  'DON', 'AFD',
  '{"section": "Ministère de l''Hydraulique", "sectionCode": "MH", "programme": "Programme Eau Rurale", "programmeCode": "PER", "activite": "Construction de forages", "activiteCode": "CONST_FORAGES", "ligneBudgetaire": "63180000", "nature": "231", "bailleur": "AFD"}'::jsonb,
  150, 150, 'INFRASTRUCTURE', 'Populations rurales du Tchologo (10 villages)',
  '[{"id": "LIV-PSO-001-1", "type": "INFRASTRUCTURE", "libelle": "10 forages équipés de pompes manuelles", "localisation": "Tchologo > Ferké > Villages"}, {"id": "LIV-PSO-001-2", "type": "SERVICE", "libelle": "Formation de 20 comités de gestion", "localisation": "Tchologo > Ferké > Villages"}]'::jsonb,
  '{"region": "Tchologo", "regionCode": "TCH", "departement": "Ferké", "departementCode": "FER", "sousPrefecture": "Ferké", "sousPrefectureCode": "FER-SP", "localite": "Villages", "longitude": -5.38333, "latitude": 9.50000, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-07-10 10:20:00', '2024-07-10 10:20:00'
),
-- PSO-002: Systèmes solaires
(
  'OP-PSO-002', NULL, NULL, 2024, 'Direction de l''Énergie Solaire', 'DES',
  'Installation de systèmes solaires photovoltaïques pour 5 centres de santé',
  'FOURNITURES', 'PSO', 'A_PRIORI', 'FORFAIT',
  68000000, 68000000, 'XOF',
  'DON', 'UE',
  '{"section": "Ministère de l''Énergie", "sectionCode": "ME", "programme": "Programme Énergie Renouvelable", "programmeCode": "PENER", "activite": "Électrification rurale solaire", "activiteCode": "ELECT_SOLAIRE", "ligneBudgetaire": "63250000", "nature": "232", "bailleur": "UE"}'::jsonb,
  90, 90, 'EQUIPEMENT', '5 centres de santé ruraux du Haut-Sassandra',
  '[{"id": "LIV-PSO-002-1", "type": "EQUIPEMENT", "libelle": "Panneaux solaires, onduleurs, batteries et installation", "localisation": "Haut-Sassandra > Daloa > Zone rurale"}, {"id": "LIV-PSO-002-2", "type": "SERVICE", "libelle": "Formation maintenance et garantie 2 ans", "localisation": "Haut-Sassandra > Daloa > Zone rurale"}]'::jsonb,
  '{"region": "Haut-Sassandra", "regionCode": "HS", "departement": "Daloa", "departementCode": "DAL", "sousPrefecture": "Daloa", "sousPrefectureCode": "DAL-SP", "localite": "Zone rurale", "longitude": -6.45000, "latitude": 6.87778, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-08-05 11:00:00', '2024-08-05 11:00:00'
),
-- PSO-003: Véhicules administratifs
(
  'OP-PSO-003', NULL, NULL, 2024, 'Direction du Matériel Roulant', 'DMR',
  'Acquisition de 10 véhicules tout-terrain pour les services déconcentrés',
  'FOURNITURES', 'PSO', 'A_PRIORI', 'UNITAIRE',
  85000000, 85000000, 'XOF',
  'ETAT', 'TRESOR',
  '{"section": "Ministère de l''Intérieur", "sectionCode": "MINT", "programme": "Programme Équipement Administrations", "programmeCode": "PEA", "activite": "Acquisition véhicules administratifs", "activiteCode": "ACQ_VEH", "ligneBudgetaire": "63270000", "nature": "232", "bailleur": "TRESOR"}'::jsonb,
  60, 60, 'EQUIPEMENT', 'Services déconcentrés de 10 régions',
  '[{"id": "LIV-PSO-003-1", "type": "EQUIPEMENT", "libelle": "10 véhicules 4x4 double cabine", "localisation": "Abidjan > Plateau > Garage central"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Plateau", "departementCode": "PLT", "sousPrefecture": "Plateau", "sousPrefectureCode": "PLT-SP", "localite": "Garage central", "longitude": -4.01800, "latitude": 5.31500, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-08-20 09:30:00', '2024-08-20 09:30:00'
),

-- ============================================
-- AOO - Appel d'Offres Ouvert (≥ 100M XOF)
-- ============================================

-- AOO-001: 5 lycées
(
  'OP-AOO-001', NULL, NULL, 2024, 'Direction des Grands Travaux', 'DGT',
  'Construction de 5 lycées de proximité dans la région des Lagunes',
  'TRAVAUX', 'AOO', 'A_PRIORI', 'FORFAIT',
  420000000, 420000000, 'XOF',
  'EMPRUNT', 'BAD',
  '{"section": "Ministère de l''Éducation Nationale", "sectionCode": "MEN", "programme": "Programme Construction Établissements Secondaires", "programmeCode": "PCES", "activite": "Construction de lycées", "activiteCode": "CONST_LYCEES", "ligneBudgetaire": "63500000", "nature": "231", "bailleur": "BAD"}'::jsonb,
  365, 365, 'INFRASTRUCTURE', 'Population scolaire de la région des Lagunes',
  '[{"id": "LIV-AOO-001-1", "type": "BATIMENT", "libelle": "5 lycées de 12 classes avec équipements", "localisation": "Lagunes > Dabou > Zone périurbaine"}, {"id": "LIV-AOO-001-2", "type": "INFRASTRUCTURE", "libelle": "Blocs administratifs, terrains de sport, sanitaires", "localisation": "Lagunes > Dabou > Zone périurbaine"}]'::jsonb,
  '{"region": "Lagunes", "regionCode": "LAG", "departement": "Dabou", "departementCode": "DAB", "sousPrefecture": "Dabou", "sousPrefectureCode": "DAB-SP", "localite": "Zone périurbaine", "longitude": -4.37667, "latitude": 5.32500, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-01-20 08:00:00', '2024-01-20 08:00:00'
),
-- AOO-002: Hôpital régional
(
  'OP-AOO-002', NULL, NULL, 2024, 'Direction de la Construction Hospitalière', 'DCH',
  'Construction d''un centre hospitalier régional à Bouaké',
  'TRAVAUX', 'AOO', 'A_PRIORI', 'MIXTE',
  850000000, 850000000, 'XOF',
  'EMPRUNT', 'BM',
  '{"section": "Ministère de la Santé", "sectionCode": "MS", "programme": "Programme Construction Hôpitaux", "programmeCode": "PCH", "activite": "Construction d''hôpitaux régionaux", "activiteCode": "CONST_HOPITAUX", "ligneBudgetaire": "63600000", "nature": "231", "bailleur": "BM"}'::jsonb,
  730, 730, 'INFRASTRUCTURE', 'Population de Bouaké et de la région du Gbêkê (500 000 habitants)',
  '[{"id": "LIV-AOO-002-1", "type": "BATIMENT", "libelle": "Hôpital de 200 lits avec bloc opératoire, urgences, maternité", "localisation": "Gbêkê > Bouaké > Zone nord"}, {"id": "LIV-AOO-002-2", "type": "EQUIPEMENT", "libelle": "Équipements médicaux et mobilier hospitalier", "localisation": "Gbêkê > Bouaké > Zone nord"}, {"id": "LIV-AOO-002-3", "type": "INFRASTRUCTURE", "libelle": "Réseaux VRD, parking, groupe électrogène, système solaire", "localisation": "Gbêkê > Bouaké > Zone nord"}]'::jsonb,
  '{"region": "Gbêkê", "regionCode": "GBK", "departement": "Bouaké", "departementCode": "BKE", "sousPrefecture": "Bouaké", "sousPrefectureCode": "BKE-SP", "localite": "Zone nord", "longitude": -5.03000, "latitude": 7.69000, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-02-15 09:00:00', '2024-02-15 09:00:00'
),
-- AOO-003: Route bitumée
(
  'OP-AOO-003', NULL, NULL, 2024, 'Direction des Routes', 'DR',
  'Construction de 25 km de route bitumée Man-Danané',
  'TRAVAUX', 'AOO', 'A_PRIORI', 'FORFAIT',
  1200000000, 1200000000, 'XOF',
  'EMPRUNT', 'BAD',
  '{"section": "Ministère des Infrastructures", "sectionCode": "MI", "programme": "Programme Routes Nationales", "programmeCode": "PRN", "activite": "Construction routes bitumées", "activiteCode": "CONST_ROUTES", "ligneBudgetaire": "63550000", "nature": "231", "bailleur": "BAD"}'::jsonb,
  540, 540, 'INFRASTRUCTURE', 'Population des régions Tonkpi et Guémon (800 000 habitants)',
  '[{"id": "LIV-AOO-003-1", "type": "INFRASTRUCTURE", "libelle": "25 km de route bitumée 2x1 voies avec accotements", "localisation": "Tonkpi > Man > Route de Danané"}, {"id": "LIV-AOO-003-2", "type": "INFRASTRUCTURE", "libelle": "3 ponts et 15 dalots", "localisation": "Tonkpi > Man > Route de Danané"}]'::jsonb,
  '{"region": "Tonkpi", "regionCode": "TON", "departement": "Man", "departementCode": "MAN", "sousPrefecture": "Man", "sousPrefectureCode": "MAN-SP", "localite": "Route de Danané", "longitude": -7.55278, "latitude": 7.41250, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-03-01 08:00:00', '2024-03-01 08:00:00'
),

-- ============================================
-- PI - Prestations Intellectuelles
-- ============================================

-- PI-001: Étude pont lagune
(
  'OP-PI-001', NULL, NULL, 2024, 'Direction de la Planification Urbaine', 'DPU',
  'Étude de faisabilité pour un pont sur la lagune Ébrié',
  'PRESTATIONS_INTELLECTUELLES', 'PI', 'A_PRIORI', 'FORFAIT',
  125000000, 125000000, 'XOF',
  'EMPRUNT', 'AFD',
  '{"section": "Ministère de l''Équipement", "sectionCode": "MEQ", "programme": "Programme Grands Ponts", "programmeCode": "PGP", "activite": "Études d''infrastructures majeures", "activiteCode": "ETUDE_PONTS", "ligneBudgetaire": "63700000", "nature": "233", "bailleur": "AFD"}'::jsonb,
  180, 180, 'ETUDE', 'Ville d''Abidjan et usagers',
  '[{"id": "LIV-PI-001-1", "type": "DOCUMENT", "libelle": "Rapport d''étude technique (géotechnique, hydraulique, trafic)", "localisation": "Abidjan > Plateau > Cabinet études"}, {"id": "LIV-PI-001-2", "type": "DOCUMENT", "libelle": "Étude d''impact environnemental et social (EIES)", "localisation": "Abidjan > Plateau > Cabinet études"}, {"id": "LIV-PI-001-3", "type": "DOCUMENT", "libelle": "Plans détaillés et estimatifs financiers", "localisation": "Abidjan > Plateau > Cabinet études"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Plateau", "departementCode": "PLT", "sousPrefecture": "Plateau", "sousPrefectureCode": "PLT-SP", "localite": "Cabinet études", "longitude": -4.02778, "latitude": 5.31944, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-03-10 10:30:00', '2024-03-10 10:30:00'
),
-- PI-002: Modernisation SI
(
  'OP-PI-002', NULL, NULL, 2024, 'Direction de la Stratégie Numérique', 'DSN',
  'Assistance technique pour la modernisation du système informatique de l''État',
  'PRESTATIONS_INTELLECTUELLES', 'PI', 'A_PRIORI', 'FORFAIT',
  95000000, 95000000, 'XOF',
  'DON', 'BM',
  '{"section": "Primature", "sectionCode": "PM", "programme": "Programme E-Gouvernance", "programmeCode": "PEGOUV", "activite": "Assistance technique numérique", "activiteCode": "ASSIST_NUM", "ligneBudgetaire": "63800000", "nature": "233", "bailleur": "BM"}'::jsonb,
  365, 365, 'ETUDE', 'Ensemble des administrations de l''État',
  '[{"id": "LIV-PI-002-1", "type": "DOCUMENT", "libelle": "Audit complet du SI actuel et recommandations", "localisation": "Abidjan > Plateau > Tour C"}, {"id": "LIV-PI-002-2", "type": "DOCUMENT", "libelle": "Schéma directeur SI (SDSI) 2025-2030", "localisation": "Abidjan > Plateau > Tour C"}, {"id": "LIV-PI-002-3", "type": "SERVICE", "libelle": "Accompagnement et formation de 50 cadres sur 12 mois", "localisation": "Abidjan > Plateau > Tour C"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Plateau", "departementCode": "PLT", "sousPrefecture": "Plateau", "sousPrefectureCode": "PLT-SP", "localite": "Tour C", "longitude": -4.02500, "latitude": 5.32222, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-04-18 11:45:00', '2024-04-18 11:45:00'
),
-- PI-003: Audit énergétique
(
  'OP-PI-003', NULL, NULL, 2024, 'Direction de l''Efficacité Énergétique', 'DEE',
  'Audit énergétique de 20 bâtiments administratifs',
  'PRESTATIONS_INTELLECTUELLES', 'PI', 'A_PRIORI', 'FORFAIT',
  65000000, 65000000, 'XOF',
  'DON', 'UE',
  '{"section": "Ministère de l''Énergie", "sectionCode": "ME", "programme": "Programme Efficacité Énergétique", "programmeCode": "PEE", "activite": "Audits énergétiques", "activiteCode": "AUDIT_ENERG", "ligneBudgetaire": "63850000", "nature": "233", "bailleur": "UE"}'::jsonb,
  120, 120, 'ETUDE', '20 bâtiments administratifs d''Abidjan',
  '[{"id": "LIV-PI-003-1", "type": "DOCUMENT", "libelle": "Rapports d''audit énergétique pour 20 bâtiments", "localisation": "Abidjan > Plateau > Bureau études"}, {"id": "LIV-PI-003-2", "type": "DOCUMENT", "libelle": "Plan d''actions d''économies d''énergie", "localisation": "Abidjan > Plateau > Bureau études"}]'::jsonb,
  '{"region": "Abidjan Autonome", "regionCode": "ABJ", "departement": "Plateau", "departementCode": "PLT", "sousPrefecture": "Plateau", "sousPrefectureCode": "PLT-SP", "localite": "Bureau études", "longitude": -4.02300, "latitude": 5.32000, "coordsOK": true}'::jsonb,
  ARRAY['PLANIF'], 'PLANIFIE', NULL,
  '2024-05-25 10:00:00', '2024-05-25 10:00:00'
);

-- Vérification
SELECT
  mode_passation,
  COUNT(*) as nb_operations,
  SUM(montant_previsionnel) as montant_total
FROM operations
GROUP BY mode_passation
ORDER BY mode_passation;

COMMIT;
