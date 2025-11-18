/**
 * Script pour insérer 18 opérations dans PostgreSQL via l'API Worker
 * 3 opérations par type de procédure (PSD, PSC, PSL, PSO, AOO, PI)
 */

const API_URL = 'http://localhost:8787/api/entities/OPERATION';

const operations = [
  // ============================================
  // PSD - Procédure Simplifiée d'Entente Directe (< 10M XOF)
  // ============================================
  {
    id: 'OP-PSD-001',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de la Formation Continue',
    objet: 'Formation du personnel administratif sur les outils numériques',
    typeMarche: 'SERVICES_COURANTS',
    modePassation: 'PSD',
    revue: 'AUCUNE',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 5000000,
    montantActuel: 5000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Direction de zone 780 102',
      sectionCode: 'DZ780102',
      programme: 'Sous-préfecture 1300101',
      programmeCode: 'SP1300101',
      activite: 'Formation du personnel administratif',
      activiteCode: 'FORM_ADM',
      ligneBudgetaire: '62200000',
      nature: '223',
      bailleur: 'TRESOR'
    },
    delaiExecution: 30,
    dureePrevisionnelle: 30,
    categoriePrestation: 'FORMATION',
    beneficiaire: 'Direction des Ressources Humaines',
    livrables: [
      { id: 'LIV-PSD-001-1', type: 'SERVICE', libelle: 'Formation de 50 agents sur Word, Excel et PowerPoint', localisation: 'Abidjan > Cocody > Deux Plateaux' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Cocody',
      departementCode: 'COC',
      sousPrefecture: 'Cocody',
      sousPrefectureCode: 'COC-SP',
      localite: 'Deux Plateaux',
      longitude: -4.02290,
      latitude: 5.33255,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSD-002',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de l\'Équipement',
    objet: 'Achat de fournitures de bureau pour le siège',
    typeMarche: 'FOURNITURES',
    modePassation: 'PSD',
    revue: 'AUCUNE',
    naturePrix: 'UNITAIRE',
    montantPrevisionnel: 8500000,
    montantActuel: 8500000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Direction de zone 780 102',
      sectionCode: 'DZ780102',
      programme: 'Sous-préfecture 1300101',
      programmeCode: 'SP1300101',
      activite: 'Fonctionnement administratif',
      activiteCode: 'FONCT_ADM',
      ligneBudgetaire: '62100000',
      nature: '221',
      bailleur: 'TRESOR'
    },
    delaiExecution: 15,
    dureePrevisionnelle: 15,
    categoriePrestation: 'FOURNITURE',
    beneficiaire: 'Ensemble des services administratifs',
    livrables: [
      { id: 'LIV-PSD-002-1', type: 'FOURNITURE', libelle: 'Ramettes de papier A4, stylos, agrafeuses', localisation: 'Abidjan > Plateau > Centre-ville' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Plateau',
      departementCode: 'PLT',
      sousPrefecture: 'Plateau',
      sousPrefectureCode: 'PLT-SP',
      localite: 'Centre-ville',
      longitude: -4.01667,
      latitude: 5.31667,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSD-003',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction Informatique',
    objet: 'Maintenance préventive du parc informatique (50 postes)',
    typeMarche: 'SERVICES_COURANTS',
    modePassation: 'PSD',
    revue: 'AUCUNE',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 7200000,
    montantActuel: 7200000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Direction de zone 780 102',
      sectionCode: 'DZ780102',
      programme: 'Sous-préfecture 1300101',
      programmeCode: 'SP1300101',
      activite: 'Maintenance informatique',
      activiteCode: 'MAINT_INFO',
      ligneBudgetaire: '62220000',
      nature: '222',
      bailleur: 'TRESOR'
    },
    delaiExecution: 20,
    dureePrevisionnelle: 20,
    categoriePrestation: 'SERVICE',
    beneficiaire: 'Parc informatique de la Direction',
    livrables: [
      { id: 'LIV-PSD-003-1', type: 'SERVICE', libelle: 'Nettoyage, vérification et mise à jour de 50 postes', localisation: 'Abidjan > Cocody > Riviera' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Cocody',
      departementCode: 'COC',
      sousPrefecture: 'Cocody',
      sousPrefectureCode: 'COC-SP',
      localite: 'Riviera',
      longitude: -3.98333,
      latitude: 5.36667,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },

  // ============================================
  // PSC - Procédure Simplifiée de Cotation (10M - 30M XOF)
  // ============================================
  {
    id: 'OP-PSC-001',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction des Infrastructures Scolaires',
    objet: 'Réhabilitation de 3 salles de classe à l\'école primaire de Bassam',
    typeMarche: 'TRAVAUX',
    modePassation: 'PSC',
    revue: 'A_POSTERIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 18000000,
    montantActuel: 18000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Ministère de l\'Éducation Nationale',
      sectionCode: 'MEN',
      programme: 'Programme Construction Écoles',
      programmeCode: 'PCE',
      activite: 'Réhabilitation des infrastructures scolaires',
      activiteCode: 'REHAB_ECOLES',
      ligneBudgetaire: '63100000',
      nature: '231',
      bailleur: 'TRESOR'
    },
    delaiExecution: 60,
    dureePrevisionnelle: 60,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'École Primaire Publique de Grand-Bassam',
    livrables: [
      { id: 'LIV-PSC-001-1', type: 'BATIMENT', libelle: 'Réfection de 3 salles (toiture, peinture, menuiserie)', localisation: 'Comoé > Grand-Bassam > Centre' }
    ],
    localisation: {
      region: 'Comoé',
      regionCode: 'COM',
      departement: 'Grand-Bassam',
      departementCode: 'GBAS',
      sousPrefecture: 'Grand-Bassam',
      sousPrefectureCode: 'GBAS-SP',
      localite: 'Centre',
      longitude: -3.73889,
      latitude: 5.21111,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSC-002',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de la Santé Publique',
    objet: 'Fourniture d\'équipements médicaux pour le centre de santé de Bingerville',
    typeMarche: 'FOURNITURES',
    modePassation: 'PSC',
    revue: 'A_POSTERIORI',
    naturePrix: 'UNITAIRE',
    montantPrevisionnel: 25000000,
    montantActuel: 25000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Ministère de la Santé',
      sectionCode: 'MS',
      programme: 'Programme Équipement Sanitaire',
      programmeCode: 'PES',
      activite: 'Équipement des centres de santé',
      activiteCode: 'EQUIP_SANTE',
      ligneBudgetaire: '63200000',
      nature: '232',
      bailleur: 'TRESOR'
    },
    delaiExecution: 45,
    dureePrevisionnelle: 45,
    categoriePrestation: 'EQUIPEMENT',
    beneficiaire: 'Centre de Santé Urbain de Bingerville',
    livrables: [
      { id: 'LIV-PSC-002-1', type: 'EQUIPEMENT', libelle: 'Lits d\'hospitalisation, tables d\'examen, armoires médicales', localisation: 'Abidjan > Bingerville > Centre' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Bingerville',
      departementCode: 'BING',
      sousPrefecture: 'Bingerville',
      sousPrefectureCode: 'BING-SP',
      localite: 'Centre',
      longitude: -3.89722,
      latitude: 5.35833,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSC-003',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de l\'Équipement Scolaire',
    objet: 'Fourniture de 200 tables-bancs pour 5 écoles primaires',
    typeMarche: 'FOURNITURES',
    modePassation: 'PSC',
    revue: 'A_POSTERIORI',
    naturePrix: 'UNITAIRE',
    montantPrevisionnel: 22000000,
    montantActuel: 22000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Ministère de l\'Éducation Nationale',
      sectionCode: 'MEN',
      programme: 'Programme Équipement Écoles',
      programmeCode: 'PEE',
      activite: 'Équipement mobilier scolaire',
      activiteCode: 'EQUIP_SCOL',
      ligneBudgetaire: '63210000',
      nature: '232',
      bailleur: 'TRESOR'
    },
    delaiExecution: 30,
    dureePrevisionnelle: 30,
    categoriePrestation: 'EQUIPEMENT',
    beneficiaire: '5 écoles primaires du district d\'Abidjan',
    livrables: [
      { id: 'LIV-PSC-003-1', type: 'EQUIPEMENT', libelle: '200 tables-bancs en bois et métal', localisation: 'Abidjan > Abobo > Zone 1' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Abobo',
      departementCode: 'ABO',
      sousPrefecture: 'Abobo',
      sousPrefectureCode: 'ABO-SP',
      localite: 'Zone 1',
      longitude: -4.02000,
      latitude: 5.42500,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },

  // ============================================
  // PSL - Procédure Simplifiée à Compétition Limitée (30M - 50M XOF)
  // ============================================
  {
    id: 'OP-PSL-001',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction des Routes et Ponts',
    objet: 'Réhabilitation de la voie express de l\'aéroport',
    typeMarche: 'TRAVAUX',
    modePassation: 'PSL',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 42000000,
    montantActuel: 42000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Ministère des Infrastructures',
      sectionCode: 'MI',
      programme: 'Programme Entretien Routes',
      programmeCode: 'PER',
      activite: 'Réhabilitation des infrastructures routières',
      activiteCode: 'REHAB_ROUTES',
      ligneBudgetaire: '63150000',
      nature: '231',
      bailleur: 'TRESOR'
    },
    delaiExecution: 90,
    dureePrevisionnelle: 90,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'Population d\'Abidjan et usagers de l\'aéroport',
    livrables: [
      { id: 'LIV-PSL-001-1', type: 'INFRASTRUCTURE', libelle: 'Reprise de la chaussée sur 2 km, signalisation', localisation: 'Abidjan > Port-Bouët > Zone aéroportuaire' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Port-Bouët',
      departementCode: 'PB',
      sousPrefecture: 'Port-Bouët',
      sousPrefectureCode: 'PB-SP',
      localite: 'Zone aéroportuaire',
      longitude: -3.92667,
      latitude: 5.25639,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSL-002',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de l\'Informatique',
    objet: 'Déploiement d\'un système de gestion électronique des documents (GED)',
    typeMarche: 'SERVICES_INTELLECTUELS',
    modePassation: 'PSL',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 38000000,
    montantActuel: 38000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Primature',
      sectionCode: 'PM',
      programme: 'Programme Modernisation Administration',
      programmeCode: 'PMA',
      activite: 'Transformation numérique',
      activiteCode: 'TRANSFO_NUM',
      ligneBudgetaire: '63300000',
      nature: '233',
      bailleur: 'TRESOR'
    },
    delaiExecution: 120,
    dureePrevisionnelle: 120,
    categoriePrestation: 'ETUDE',
    beneficiaire: 'Ensemble des directions administratives',
    livrables: [
      { id: 'LIV-PSL-002-1', type: 'LOGICIEL', libelle: 'Plateforme GED avec modules de workflow et archivage', localisation: 'Abidjan > Plateau > Immeuble SCIAM' },
      { id: 'LIV-PSL-002-2', type: 'SERVICE', libelle: 'Formation de 100 utilisateurs', localisation: 'Abidjan > Plateau > Immeuble SCIAM' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Plateau',
      departementCode: 'PLT',
      sousPrefecture: 'Plateau',
      sousPrefectureCode: 'PLT-SP',
      localite: 'Immeuble SCIAM',
      longitude: -4.02556,
      latitude: 5.32083,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSL-003',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de la Jeunesse',
    objet: 'Construction d\'une maison des jeunes à Yamoussoukro',
    typeMarche: 'TRAVAUX',
    modePassation: 'PSL',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 48000000,
    montantActuel: 48000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Ministère de la Jeunesse',
      sectionCode: 'MJ',
      programme: 'Programme Infrastructures Jeunesse',
      programmeCode: 'PIJ',
      activite: 'Construction maisons des jeunes',
      activiteCode: 'CONST_MDJ',
      ligneBudgetaire: '63160000',
      nature: '231',
      bailleur: 'TRESOR'
    },
    delaiExecution: 180,
    dureePrevisionnelle: 180,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'Jeunesse de Yamoussoukro',
    livrables: [
      { id: 'LIV-PSL-003-1', type: 'BATIMENT', libelle: 'Bâtiment R+1 avec salles polyvalentes et bibliothèque', localisation: 'Yamoussoukro > Centre > Quartier résidentiel' }
    ],
    localisation: {
      region: 'Yamoussoukro',
      regionCode: 'YAM',
      departement: 'Yamoussoukro',
      departementCode: 'YAM',
      sousPrefecture: 'Yamoussoukro',
      sousPrefectureCode: 'YAM-SP',
      localite: 'Quartier résidentiel',
      longitude: -5.27580,
      latitude: 6.82055,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },

  // ============================================
  // PSO - Procédure Simplifiée à Compétition Ouverte (50M - 100M XOF)
  // ============================================
  {
    id: 'OP-PSO-001',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de l\'Hydraulique Rurale',
    objet: 'Construction de 10 forages d\'eau potable dans la région du Tchologo',
    typeMarche: 'TRAVAUX',
    modePassation: 'PSO',
    revue: 'A_PRIORI',
    naturePrix: 'UNITAIRE',
    montantPrevisionnel: 75000000,
    montantActuel: 75000000,
    devise: 'XOF',
    typeFinancement: 'DON',
    sourceFinancement: 'AFD',
    chaineBudgetaire: {
      section: 'Ministère de l\'Hydraulique',
      sectionCode: 'MH',
      programme: 'Programme Eau Rurale',
      programmeCode: 'PER',
      activite: 'Construction de forages',
      activiteCode: 'CONST_FORAGES',
      ligneBudgetaire: '63180000',
      nature: '231',
      bailleur: 'AFD'
    },
    delaiExecution: 150,
    dureePrevisionnelle: 150,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'Populations rurales du Tchologo (10 villages)',
    livrables: [
      { id: 'LIV-PSO-001-1', type: 'INFRASTRUCTURE', libelle: '10 forages équipés de pompes manuelles', localisation: 'Tchologo > Ferké > Villages' },
      { id: 'LIV-PSO-001-2', type: 'SERVICE', libelle: 'Formation de 20 comités de gestion', localisation: 'Tchologo > Ferké > Villages' }
    ],
    localisation: {
      region: 'Tchologo',
      regionCode: 'TCH',
      departement: 'Ferké',
      departementCode: 'FER',
      sousPrefecture: 'Ferké',
      sousPrefectureCode: 'FER-SP',
      localite: 'Villages',
      longitude: -5.38333,
      latitude: 9.50000,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSO-002',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de l\'Énergie Solaire',
    objet: 'Installation de systèmes solaires photovoltaïques pour 5 centres de santé',
    typeMarche: 'FOURNITURES',
    modePassation: 'PSO',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 68000000,
    montantActuel: 68000000,
    devise: 'XOF',
    typeFinancement: 'DON',
    sourceFinancement: 'UE',
    chaineBudgetaire: {
      section: 'Ministère de l\'Énergie',
      sectionCode: 'ME',
      programme: 'Programme Énergie Renouvelable',
      programmeCode: 'PENER',
      activite: 'Électrification rurale solaire',
      activiteCode: 'ELECT_SOLAIRE',
      ligneBudgetaire: '63250000',
      nature: '232',
      bailleur: 'UE'
    },
    delaiExecution: 90,
    dureePrevisionnelle: 90,
    categoriePrestation: 'EQUIPEMENT',
    beneficiaire: '5 centres de santé ruraux du Haut-Sassandra',
    livrables: [
      { id: 'LIV-PSO-002-1', type: 'EQUIPEMENT', libelle: 'Panneaux solaires, onduleurs, batteries et installation', localisation: 'Haut-Sassandra > Daloa > Zone rurale' },
      { id: 'LIV-PSO-002-2', type: 'SERVICE', libelle: 'Formation maintenance et garantie 2 ans', localisation: 'Haut-Sassandra > Daloa > Zone rurale' }
    ],
    localisation: {
      region: 'Haut-Sassandra',
      regionCode: 'HS',
      departement: 'Daloa',
      departementCode: 'DAL',
      sousPrefecture: 'Daloa',
      sousPrefectureCode: 'DAL-SP',
      localite: 'Zone rurale',
      longitude: -6.45000,
      latitude: 6.87778,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PSO-003',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction du Matériel Roulant',
    objet: 'Acquisition de 10 véhicules tout-terrain pour les services déconcentrés',
    typeMarche: 'FOURNITURES',
    modePassation: 'PSO',
    revue: 'A_PRIORI',
    naturePrix: 'UNITAIRE',
    montantPrevisionnel: 85000000,
    montantActuel: 85000000,
    devise: 'XOF',
    typeFinancement: 'ETAT',
    sourceFinancement: 'TRESOR',
    chaineBudgetaire: {
      section: 'Ministère de l\'Intérieur',
      sectionCode: 'MINT',
      programme: 'Programme Équipement Administrations',
      programmeCode: 'PEA',
      activite: 'Acquisition véhicules administratifs',
      activiteCode: 'ACQ_VEH',
      ligneBudgetaire: '63270000',
      nature: '232',
      bailleur: 'TRESOR'
    },
    delaiExecution: 60,
    dureePrevisionnelle: 60,
    categoriePrestation: 'EQUIPEMENT',
    beneficiaire: 'Services déconcentrés de 10 régions',
    livrables: [
      { id: 'LIV-PSO-003-1', type: 'EQUIPEMENT', libelle: '10 véhicules 4x4 double cabine', localisation: 'Abidjan > Plateau > Garage central' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Plateau',
      departementCode: 'PLT',
      sousPrefecture: 'Plateau',
      sousPrefectureCode: 'PLT-SP',
      localite: 'Garage central',
      longitude: -4.01800,
      latitude: 5.31500,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },

  // ============================================
  // AOO - Appel d'Offres Ouvert (≥ 100M XOF)
  // ============================================
  {
    id: 'OP-AOO-001',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction des Grands Travaux',
    objet: 'Construction de 5 lycées de proximité dans la région des Lagunes',
    typeMarche: 'TRAVAUX',
    modePassation: 'AOO',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 420000000,
    montantActuel: 420000000,
    devise: 'XOF',
    typeFinancement: 'EMPRUNT',
    sourceFinancement: 'BAD',
    chaineBudgetaire: {
      section: 'Ministère de l\'Éducation Nationale',
      sectionCode: 'MEN',
      programme: 'Programme Construction Établissements Secondaires',
      programmeCode: 'PCES',
      activite: 'Construction de lycées',
      activiteCode: 'CONST_LYCEES',
      ligneBudgetaire: '63500000',
      nature: '231',
      bailleur: 'BAD'
    },
    delaiExecution: 365,
    dureePrevisionnelle: 365,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'Population scolaire de la région des Lagunes',
    livrables: [
      { id: 'LIV-AOO-001-1', type: 'BATIMENT', libelle: '5 lycées de 12 classes avec équipements', localisation: 'Lagunes > Dabou > Zone périurbaine' },
      { id: 'LIV-AOO-001-2', type: 'INFRASTRUCTURE', libelle: 'Blocs administratifs, terrains de sport, sanitaires', localisation: 'Lagunes > Dabou > Zone périurbaine' }
    ],
    localisation: {
      region: 'Lagunes',
      regionCode: 'LAG',
      departement: 'Dabou',
      departementCode: 'DAB',
      sousPrefecture: 'Dabou',
      sousPrefectureCode: 'DAB-SP',
      localite: 'Zone périurbaine',
      longitude: -4.37667,
      latitude: 5.32500,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-AOO-002',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de la Construction Hospitalière',
    objet: 'Construction d\'un centre hospitalier régional à Bouaké',
    typeMarche: 'TRAVAUX',
    modePassation: 'AOO',
    revue: 'A_PRIORI',
    naturePrix: 'MIXTE',
    montantPrevisionnel: 850000000,
    montantActuel: 850000000,
    devise: 'XOF',
    typeFinancement: 'EMPRUNT',
    sourceFinancement: 'BM',
    chaineBudgetaire: {
      section: 'Ministère de la Santé',
      sectionCode: 'MS',
      programme: 'Programme Construction Hôpitaux',
      programmeCode: 'PCH',
      activite: 'Construction d\'hôpitaux régionaux',
      activiteCode: 'CONST_HOPITAUX',
      ligneBudgetaire: '63600000',
      nature: '231',
      bailleur: 'BM'
    },
    delaiExecution: 730,
    dureePrevisionnelle: 730,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'Population de Bouaké et de la région du Gbêkê (500 000 habitants)',
    livrables: [
      { id: 'LIV-AOO-002-1', type: 'BATIMENT', libelle: 'Hôpital de 200 lits avec bloc opératoire, urgences, maternité', localisation: 'Gbêkê > Bouaké > Zone nord' },
      { id: 'LIV-AOO-002-2', type: 'EQUIPEMENT', libelle: 'Équipements médicaux et mobilier hospitalier', localisation: 'Gbêkê > Bouaké > Zone nord' },
      { id: 'LIV-AOO-002-3', type: 'INFRASTRUCTURE', libelle: 'Réseaux VRD, parking, groupe électrogène, système solaire', localisation: 'Gbêkê > Bouaké > Zone nord' }
    ],
    localisation: {
      region: 'Gbêkê',
      regionCode: 'GBK',
      departement: 'Bouaké',
      departementCode: 'BKE',
      sousPrefecture: 'Bouaké',
      sousPrefectureCode: 'BKE-SP',
      localite: 'Zone nord',
      longitude: -5.03000,
      latitude: 7.69000,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-AOO-003',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction des Routes',
    objet: 'Construction de 25 km de route bitumée Man-Danané',
    typeMarche: 'TRAVAUX',
    modePassation: 'AOO',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 1200000000,
    montantActuel: 1200000000,
    devise: 'XOF',
    typeFinancement: 'EMPRUNT',
    sourceFinancement: 'BAD',
    chaineBudgetaire: {
      section: 'Ministère des Infrastructures',
      sectionCode: 'MI',
      programme: 'Programme Routes Nationales',
      programmeCode: 'PRN',
      activite: 'Construction routes bitumées',
      activiteCode: 'CONST_ROUTES',
      ligneBudgetaire: '63550000',
      nature: '231',
      bailleur: 'BAD'
    },
    delaiExecution: 540,
    dureePrevisionnelle: 540,
    categoriePrestation: 'INFRASTRUCTURE',
    beneficiaire: 'Population des régions Tonkpi et Guémon (800 000 habitants)',
    livrables: [
      { id: 'LIV-AOO-003-1', type: 'INFRASTRUCTURE', libelle: '25 km de route bitumée 2x1 voies avec accotements', localisation: 'Tonkpi > Man > Route de Danané' },
      { id: 'LIV-AOO-003-2', type: 'INFRASTRUCTURE', libelle: '3 ponts et 15 dalots', localisation: 'Tonkpi > Man > Route de Danané' }
    ],
    localisation: {
      region: 'Tonkpi',
      regionCode: 'TON',
      departement: 'Man',
      departementCode: 'MAN',
      sousPrefecture: 'Man',
      sousPrefectureCode: 'MAN-SP',
      localite: 'Route de Danané',
      longitude: -7.55278,
      latitude: 7.41250,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },

  // ============================================
  // PI - Prestations Intellectuelles
  // ============================================
  {
    id: 'OP-PI-001',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de la Planification Urbaine',
    objet: 'Étude de faisabilité pour un pont sur la lagune Ébrié',
    typeMarche: 'PRESTATIONS_INTELLECTUELLES',
    modePassation: 'PI',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 125000000,
    montantActuel: 125000000,
    devise: 'XOF',
    typeFinancement: 'EMPRUNT',
    sourceFinancement: 'AFD',
    chaineBudgetaire: {
      section: 'Ministère de l\'Équipement',
      sectionCode: 'MEQ',
      programme: 'Programme Grands Ponts',
      programmeCode: 'PGP',
      activite: 'Études d\'infrastructures majeures',
      activiteCode: 'ETUDE_PONTS',
      ligneBudgetaire: '63700000',
      nature: '233',
      bailleur: 'AFD'
    },
    delaiExecution: 180,
    dureePrevisionnelle: 180,
    categoriePrestation: 'ETUDE',
    beneficiaire: 'Ville d\'Abidjan et usagers',
    livrables: [
      { id: 'LIV-PI-001-1', type: 'DOCUMENT', libelle: 'Rapport d\'étude technique (géotechnique, hydraulique, trafic)', localisation: 'Abidjan > Plateau > Cabinet études' },
      { id: 'LIV-PI-001-2', type: 'DOCUMENT', libelle: 'Étude d\'impact environnemental et social (EIES)', localisation: 'Abidjan > Plateau > Cabinet études' },
      { id: 'LIV-PI-001-3', type: 'DOCUMENT', libelle: 'Plans détaillés et estimatifs financiers', localisation: 'Abidjan > Plateau > Cabinet études' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Plateau',
      departementCode: 'PLT',
      sousPrefecture: 'Plateau',
      sousPrefectureCode: 'PLT-SP',
      localite: 'Cabinet études',
      longitude: -4.02778,
      latitude: 5.31944,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PI-002',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de la Stratégie Numérique',
    objet: 'Assistance technique pour la modernisation du système informatique de l\'État',
    typeMarche: 'PRESTATIONS_INTELLECTUELLES',
    modePassation: 'PI',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 95000000,
    montantActuel: 95000000,
    devise: 'XOF',
    typeFinancement: 'DON',
    sourceFinancement: 'BM',
    chaineBudgetaire: {
      section: 'Primature',
      sectionCode: 'PM',
      programme: 'Programme E-Gouvernance',
      programmeCode: 'PEGOUV',
      activite: 'Assistance technique numérique',
      activiteCode: 'ASSIST_NUM',
      ligneBudgetaire: '63800000',
      nature: '233',
      bailleur: 'BM'
    },
    delaiExecution: 365,
    dureePrevisionnelle: 365,
    categoriePrestation: 'ETUDE',
    beneficiaire: 'Ensemble des administrations de l\'État',
    livrables: [
      { id: 'LIV-PI-002-1', type: 'DOCUMENT', libelle: 'Audit complet du SI actuel et recommandations', localisation: 'Abidjan > Plateau > Tour C' },
      { id: 'LIV-PI-002-2', type: 'DOCUMENT', libelle: 'Schéma directeur SI (SDSI) 2025-2030', localisation: 'Abidjan > Plateau > Tour C' },
      { id: 'LIV-PI-002-3', type: 'SERVICE', libelle: 'Accompagnement et formation de 50 cadres sur 12 mois', localisation: 'Abidjan > Plateau > Tour C' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Plateau',
      departementCode: 'PLT',
      sousPrefecture: 'Plateau',
      sousPrefectureCode: 'PLT-SP',
      localite: 'Tour C',
      longitude: -4.02500,
      latitude: 5.32222,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  },
  {
    id: 'OP-PI-003',
    planId: null,
    budgetLineId: null,
    exercice: 2024,
    unite: 'Direction de l\'Efficacité Énergétique',
    objet: 'Audit énergétique de 20 bâtiments administratifs',
    typeMarche: 'PRESTATIONS_INTELLECTUELLES',
    modePassation: 'PI',
    revue: 'A_PRIORI',
    naturePrix: 'FORFAIT',
    montantPrevisionnel: 65000000,
    montantActuel: 65000000,
    devise: 'XOF',
    typeFinancement: 'DON',
    sourceFinancement: 'UE',
    chaineBudgetaire: {
      section: 'Ministère de l\'Énergie',
      sectionCode: 'ME',
      programme: 'Programme Efficacité Énergétique',
      programmeCode: 'PEE',
      activite: 'Audits énergétiques',
      activiteCode: 'AUDIT_ENERG',
      ligneBudgetaire: '63850000',
      nature: '233',
      bailleur: 'UE'
    },
    delaiExecution: 120,
    dureePrevisionnelle: 120,
    categoriePrestation: 'ETUDE',
    beneficiaire: '20 bâtiments administratifs d\'Abidjan',
    livrables: [
      { id: 'LIV-PI-003-1', type: 'DOCUMENT', libelle: 'Rapports d\'audit énergétique pour 20 bâtiments', localisation: 'Abidjan > Plateau > Bureau études' },
      { id: 'LIV-PI-003-2', type: 'DOCUMENT', libelle: 'Plan d\'actions d\'économies d\'énergie', localisation: 'Abidjan > Plateau > Bureau études' }
    ],
    localisation: {
      region: 'Abidjan Autonome',
      regionCode: 'ABJ',
      departement: 'Plateau',
      departementCode: 'PLT',
      sousPrefecture: 'Plateau',
      sousPrefectureCode: 'PLT-SP',
      localite: 'Bureau études',
      longitude: -4.02300,
      latitude: 5.32000,
      coordsOK: true
    },
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null
  }
];

async function seedOperations() {
  console.log('🚀 Insertion de 18 opérations dans PostgreSQL...\n');

  let created = 0;
  let errors = 0;

  for (const operation of operations) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(operation)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${operation.id} - ${operation.modePassation} - ${operation.objet.substring(0, 50)}...`);
        created++;
      } else {
        const error = await response.text();
        console.error(`❌ ${operation.id} - Erreur: ${error}`);
        errors++;
      }
    } catch (err) {
      console.error(`❌ ${operation.id} - Exception: ${err.message}`);
      errors++;
    }
  }

  console.log('\n📊 Résumé:');
  console.log(`   ✅ Créées: ${created}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log(`   📋 Total: ${operations.length}`);
}

seedOperations();
