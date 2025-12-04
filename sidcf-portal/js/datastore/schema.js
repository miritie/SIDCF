/* ============================================
   Data Schemas - Entity Definitions
   ============================================ */

/**
 * Entity names (used as keys in storage)
 */
export const ENTITIES = {
  // Module Marché
  PPM_PLAN: 'PPM_PLAN',
  OPERATION: 'OPERATION',
  BUDGET_LINE: 'BUDGET_LINE',
  LIVRABLE: 'LIVRABLE',
  PROCEDURE: 'PROCEDURE',
  RECOURS: 'RECOURS',
  ATTRIBUTION: 'ATTRIBUTION',
  ECHEANCIER: 'ECHEANCIER',
  CLE_REPARTITION: 'CLE_REPARTITION',
  VISA_CF: 'VISA_CF',
  ORDRE_SERVICE: 'ORDRE_SERVICE',
  AVENANT: 'AVENANT',
  RESILIATION: 'RESILIATION',
  GARANTIE: 'GARANTIE',
  CLOTURE: 'CLOTURE',
  ENTREPRISE: 'ENTREPRISE',
  GROUPEMENT: 'GROUPEMENT',
  ANO: 'ANO',
  DOCUMENT: 'DOCUMENT',
  DECOMPTE: 'DECOMPTE',
  DIFFICULTE: 'DIFFICULTE',

  // Module Investissement
  INV_PROJECT: 'INV_PROJECT',
  INV_BUDGET: 'INV_BUDGET',
  INV_BUDGET_BREAKDOWN: 'INV_BUDGET_BREAKDOWN',
  INV_TRANSFER: 'INV_TRANSFER',
  INV_ADVANCE_LETTER: 'INV_ADVANCE_LETTER',
  INV_COMPONENT: 'INV_COMPONENT',
  INV_ACTIVITY: 'INV_ACTIVITY',
  INV_PHYSICAL_TRACKING: 'INV_PHYSICAL_TRACKING',
  INV_FINANCIAL_STATUS: 'INV_FINANCIAL_STATUS',
  INV_GLIDE: 'INV_GLIDE',
  INV_GAR_INDICATOR: 'INV_GAR_INDICATOR',
  INV_EVALUATION: 'INV_EVALUATION',
  INV_ALERT: 'INV_ALERT',
  INV_DOCUMENT: 'INV_DOCUMENT',
  // Module Investissement - Enrichissements
  INV_PIP_HISTORY: 'INV_PIP_HISTORY',
  INV_OPE_CRITERIA: 'INV_OPE_CRITERIA',
  INV_PROVISIONAL_OP: 'INV_PROVISIONAL_OP',
  INV_IMPREST: 'INV_IMPREST',
  INV_IMPREST_MOVEMENT: 'INV_IMPREST_MOVEMENT',
  INV_QUARTERLY_TRACKING: 'INV_QUARTERLY_TRACKING',
  INV_GAR_VALUES: 'INV_GAR_VALUES',
  INV_DOC_MATRIX: 'INV_DOC_MATRIX',
  INV_DECISION: 'INV_DECISION',
  INV_SETTINGS: 'INV_SETTINGS',

  // Module Investissement - Entités Import Annexes
  INV_FINANCING_SOURCE: 'INV_FINANCING_SOURCE',
  INV_LIVRABLE: 'INV_LIVRABLE',
  INV_STAKEHOLDER: 'INV_STAKEHOLDER',
  INV_SUSTAINABILITY: 'INV_SUSTAINABILITY',
  INV_IMPORT_LOG: 'INV_IMPORT_LOG'
};

/**
 * Schema definitions with default values
 */
export const SCHEMAS = {
  PPM_PLAN: {
    id: null,
    unite: '',
    exercice: new Date().getFullYear(),
    source: 'UNITAIRE', // 'IMPORT' | 'UNITAIRE'
    fichier: null,
    feuille: null,
    auteur: null,
    createdAt: null,
    updatedAt: null
  },

  OPERATION: {
    id: null,
    planId: null,
    budgetLineId: null, // (note Maxence) Liaison vers BUDGET_LINE

    // Identification
    unite: '',
    exercice: null,
    objet: '',

    // Classification marché
    typeMarche: null,
    modePassation: null,
    categorieProcedure: null,
    naturePrix: null,
    revue: null,

    // Financier
    montantPrevisionnel: 0,
    montantActuel: 0,
    devise: 'XOF',
    typeFinancement: '', // Trésor, Emprunt, Don, etc.
    sourceFinancement: '', // BADEA, BM, AFD, etc.

    // Technique
    dureePrevisionnelle: 0,
    delaiExecution: 0, // en jours
    categoriePrestation: '', // INFRASTRUCTURE, SERVICE, EQUIPEMENT, ETUDE, FORMATION, FOURNITURE
    beneficiaire: '',
    livrables: [],

    // Chaîne budgétaire complète
    chaineBudgetaire: {
      section: '',
      programme: '',
      activite: '',
      activiteCode: '',
      nature: '',
      ligneBudgetaire: '',
      bailleur: ''
    },

    // Localisation géographique
    localisation: {
      region: '',
      regionCode: '',
      departement: '',
      departementCode: '',
      sousPrefecture: '',
      sousPrefectureCode: '',
      localite: '',
      longitude: null,
      latitude: null,
      coordsOK: false
    },

    // Workflow
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null, // { isDerogation: bool, docId, comment, validatedAt }

    // Audit
    createdAt: null,
    updatedAt: null
  },

  BUDGET_LINE: {
    id: null,
    section: '',
    sectionLib: '',
    programme: '',
    programmeLib: '',
    grandeNature: '', // 1|2|3|4 (Personnel|B&S|Transferts|Investissements)
    uaCode: '',
    uaLib: '',
    zoneCode: '',
    zoneLib: '',
    actionCode: '',
    actionLib: '',
    activiteCode: '',
    activiteLib: '',
    typeFinancement: '',
    sourceFinancement: '',
    ligneCode: '',
    ligneLib: '',
    AE: 0,
    CP: 0,
    createdAt: null,
    updatedAt: null
  },

  LIVRABLE: {
    id: null,
    operationId: null, // lien avec l'opération parente
    type: '', // code from TYPE_LIVRABLE registry
    libelle: '', // description du livrable
    localisation: {
      region: '',
      regionCode: '',
      district: '', // nouveau niveau (si applicable)
      districtCode: '',
      commune: '',
      communeCode: '',
      sousPrefecture: '',
      sousPrefectureCode: '',
      localite: '',
      latitude: null,
      longitude: null,
      coordsOK: false
    },
    createdAt: null,
    updatedAt: null
  },

  PROCEDURE: {
    id: null,
    operationId: null,
    commission: 'COJO', // COJO | COPE (lié au type d'UA)
    modePassation: null,
    categorie: 'NATIONALE', // NATIONALE | INTERNATIONALE

    // Dossier d'appel à candidature
    typeDossierAppel: null, // DAO | AMI | AONO | DPI | etc. (selon mode passation)
    dossierAppelDoc: null, // document uploadé

    // Dates chronologiques
    dates: {
      ouverture: null,
      analyse: null,
      jugement: null
    },

    // Nombre d'offres
    nbOffresRecues: 0,
    nbOffresClassees: 0,

    // PV pour chaque étape
    pv: {
      ouverture: null, // document PV ouverture
      analyse: null, // document PV analyse
      jugement: null // document PV jugement
    },

    rapportAnalyseDoc: null,
    decisionAttributionRef: null,
    createdAt: null,
    updatedAt: null
  },

  RECOURS: {
    id: null,
    operationId: null,
    type: 'GRACIEUX',
    dateDepot: null,
    dateResolution: null,
    docs: [],
    statut: 'EN_COURS',
    commentaire: '',
    createdAt: null,
    updatedAt: null
  },

  ATTRIBUTION: {
    id: null,
    operationId: null,

    // Attributaire (entreprise simple ou groupement)
    attributaire: {
      singleOrGroup: 'SIMPLE', // SIMPLE | GROUPEMENT
      groupType: null, // COTRAITANCE | SOUSTRAITANCE (si groupement)
      entrepriseId: null, // ID entreprise si SIMPLE
      groupementId: null, // ID groupement si GROUPEMENT
      entreprises: [] // Liste des IDs des entreprises (pour affichage)
    },

    // Montants
    montants: {
      ht: 0,
      ttc: 0,
      confidentiel: false
    },

    // Garanties et cautionnement
    garanties: {
      garantieAvance: { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null },
      garantieBonneExec: { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null },
      cautionnement: { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null }
    },

    // Dates
    dates: {
      signatureTitulaire: null,
      signatureAC: null,
      approbation: null,
      decisionCF: null
    },

    // Décision du Contrôleur Financier (CF)
    decisionCF: {
      aReserves: false, // true si le CF émet des réserves
      typeReserve: null, // code from MOTIF_RESERVE registry
      motifReserve: '', // Texte libre
      commentaire: ''
    },

    createdAt: null,
    updatedAt: null
  },

  ENTREPRISE: {
    id: null,
    ncc: '', // Numéro Compte Contribuable (unique identifier)
    rccm: '', // Registre du Commerce
    raisonSociale: '',
    sigle: '',
    ifu: '', // Identifiant Fiscal Unique
    adresse: '',
    telephone: '',
    email: '',
    contacts: [], // [{nom, fonction, tel, email}]
    banque: {
      code: '',
      libelle: '',
      agence: ''
    },
    compte: {
      type: 'IBAN', // IBAN | RIB
      numero: '',
      intitule: ''
    },
    actif: true,
    createdAt: null,
    updatedAt: null
  },

  GROUPEMENT: {
    id: null,
    libelle: '',
    nature: 'COTRAITANCE', // COTRAITANCE | SOUSTRAITANCE
    mandataireId: null, // entrepriseId
    membres: [], // [{entrepriseId, role:'COTRAITANT'|'SOUSTRAITANT', partPourcent}]
    banque: {
      code: '',
      libelle: '',
      agence: ''
    },
    compte: {
      type: 'IBAN',
      numero: '',
      intitule: ''
    },
    actif: true,
    createdAt: null,
    updatedAt: null
  },

  ANO: {
    id: null,
    operationId: null,
    type: 'PROCEDURE', // PROCEDURE | AVENANT
    avenantId: null, // si type=AVENANT
    organisme: 'DGMP', // DGMP | BAILLEUR
    organismeDetail: '', // nom bailleur si BAILLEUR
    datedemande: null,
    dateReponse: null,
    decision: null, // ACCORD | REFUS | EN_ATTENTE
    motifRefus: '',
    documentDemande: null,
    documentReponse: null,
    commentaire: '',
    createdAt: null,
    updatedAt: null
  },

  ECHEANCIER: {
    id: null,
    operationId: null,
    periodicite: 'LIBRE', // LIBRE | MENSUEL | TRIMESTRIEL | SEMESTRIEL | ANNUEL
    periodiciteJours: null, // Nombre de jours entre deux échéances (si LIBRE)
    items: [], // Liste des ECHEANCE_ITEM
    total: 0, // Somme des montants
    totalPourcent: 0, // Doit atteindre 100%
    createdAt: null,
    updatedAt: null
  },

  ECHEANCE_ITEM: {
    num: 1,
    datePrevisionnelle: null,
    montant: 0,
    pourcentage: 0, // % par rapport au montant total du marché
    typeEcheance: 'ACOMPTE', // AVANCE | ACOMPTE | SOLDE
    livrablesCibles: [], // IDs des livrables concernés
    statutsLivrables: {} // { livrableId: { statut: 'DEMARRE|EN_COURS|TERMINE', pourcentage: 0-100 } }
  },

  CLE_REPARTITION: {
    id: null,
    operationId: null,
    lignes: [],
    total: 0,
    sumPourcent: 0,
    createdAt: null,
    updatedAt: null
  },

  CLE_LIGNE: {
    annee: null,
    bailleur: '', // code from BAILLEUR registry
    typeFinancement: 'ETAT', // ETAT | EMPRUNT | DON
    natureEco: '', // code from NATURE_ECO registry
    baseCalc: 'HT', // HT | TTC | HT_TTC
    etatSupporteTVA: false, // true si l'État supporte la TVA (18%)
    montant: 0,
    montantTVAEtat: 0, // Si etatSupporteTVA=true, 18% du TTC
    pourcentage: 0 // % par rapport au montant total du marché
  },

  AVENANT: {
    id: null,
    operationId: null,
    numero: 1,
    type: 'FINAN', // FINAN | DELAI | TECH
    aIncidenceFinanciere: true, // true si impact sur le montant

    // Variations
    variationMontant: 0,
    variationDuree: 0, // en jours
    nouveauMontantTotal: 0,
    nouveauDelaiTotal: 0,

    // Calcul d'incidence
    incidencePourcent: 0, // % de variation par rapport au montant initial
    cumulPourcent: 0, // Cumul des avenants (ne doit pas dépasser seuils réglementaires)

    // Documents et validation
    dateSignature: null,
    motifRef: '', // code from MOTIF_AVENANT registry
    motifAutre: '', // Texte libre si AUTRE
    documentRef: null, // Document de l'avenant
    visaCFRef: null, // Référence décision CF
    anoRequired: false, // true si ANO DGMP/Bailleur requis
    anoDoc: null,

    createdAt: null,
    updatedAt: null
  },

  RESILIATION: {
    id: null,
    operationId: null,
    dateResiliation: null,
    motifRef: '', // code from MOTIF_RESILIATION registry
    motifAutre: '',
    documentRef: null,
    createdAt: null,
    updatedAt: null
  },

  GARANTIE: {
    id: null,
    operationId: null,
    type: 'BONNE_EXEC',
    montant: 0,
    taux: 0,
    dateEmission: null,
    dateEcheance: null,
    etat: 'ACTIVE',
    doc: null,
    mainleveeDate: null,
    mainleveeDoc: null,
    createdAt: null,
    updatedAt: null
  },

  CLOTURE: {
    id: null,
    operationId: null,

    // Réception provisoire
    receptionProv: {
      date: null,
      pv: null, // document PV
      reserves: null // Texte libre
    },

    // Réception définitive
    receptionDef: {
      date: null,
      pv: null // document PV
    },

    // Décomptes payés (lien avec module paiement)
    decomptes: [], // Liste des IDs de décomptes payés
    montantTotalPaye: 0, // Somme des paiements effectifs
    montantMarcheTotal: 0, // Montant total du marché (pour comparaison)
    ecartMontant: 0, // Différence entre payé et total marché

    // Mainlevées des garanties
    mainlevees: [], // IDs des garanties avec mainlevée

    // Synthèse
    syntheseFinale: '', // Texte libre
    closAt: null, // Date de clôture effective
    createdAt: null,
    updatedAt: null
  },

  ORDRE_SERVICE: {
    id: null,
    operationId: null,
    numero: '',
    dateEmission: null,
    objet: '',
    docRef: null,

    // Bureau de contrôle / Bureau d'études
    bureauControle: {
      type: 'UA', // UA | ENTREPRISE
      uaId: null, // si type=UA
      entrepriseId: null, // si type=ENTREPRISE
      nom: '' // Nom du bureau (renseigné automatiquement)
    },

    bureauEtudes: {
      type: 'UA', // UA | ENTREPRISE
      uaId: null,
      entrepriseId: null,
      nom: ''
    },

    createdAt: null,
    updatedAt: null
  },

  VISA_CF: {
    id: null,
    operationId: null,
    attributionId: null, // Lien avec l'attribution

    // Décision du CF
    decision: null, // VISA | VISA_RESERVE | REFUS (code from DECISION_CF registry)
    dateDecision: null,

    // Documents
    contratDoc: null, // Contrat numéroté, approuvé, enregistré
    lettreMarche: null,
    formulaireSelection: null,

    // Réserves (si VISA_RESERVE)
    typeReserve: null, // code from MOTIF_RESERVE
    motifReserve: '', // Texte libre

    // Refus (si REFUS)
    motifRefus: null, // code from MOTIF_REFUS
    commentaireRefus: '',

    createdAt: null,
    updatedAt: null
  },

  DOCUMENT: {
    id: null,
    operationId: null, // operation parente
    entityType: null, // OPERATION | ATTRIBUTION | AVENANT | etc
    entityId: null,
    phase: null, // INVITATION | OUVERTURE | ANALYSE | JUGEMENT | APPROBATION | EXECUTION | CLOTURE
    typeDocument: null, // code from pieces-matrice
    nom: '',
    fichier: null, // file name
    taille: 0,
    version: 1,
    obligatoire: false, // from matrice
    statut: 'DRAFT', // DRAFT | VALIDE | REJETE
    uploadedBy: null,
    uploadedAt: null,
    validatedBy: null,
    validatedAt: null,
    commentaire: '',
    createdAt: null,
    updatedAt: null
  },

  DECOMPTE: {
    id: null,
    operationId: null,
    numero: '',
    typeOP: 'CUMULS', // CUMULS | %CUMULS
    numeroOP: '',
    dateDecompte: null,

    // Montants
    acompteHTVA: 0,
    avance: 0,
    garantie: 0,
    penalite: 0,
    netHTVA: 0,
    netTTC: 0,

    // État et validation
    etat: 'DRAFT', // DRAFT | SOUMIS | VISE | REJETE | PAYE
    bailleur: '',
    decision: null, // APPROUVE | REJETE | EN_ATTENTE
    tauxExecution: 0, // % d'exécution cumulé

    // Liens
    ordreServiceId: null,
    documentRef: null,

    createdAt: null,
    updatedAt: null
  },

  DIFFICULTE: {
    id: null,
    operationId: null,

    // Classification
    statutTraitement: 'EN_COURS', // EN_COURS | RESOLU | ABANDONNE
    decision: null, // Type de décision prise
    probleme: '', // Description du problème

    // Traçabilité
    dateDecision: null,
    nomDecideur: '',
    fichier: null, // Document de résolution

    // Détails
    impact: 'FAIBLE', // FAIBLE | MOYEN | ELEVE | CRITIQUE
    categorieProbleme: '', // TECHNIQUE | FINANCIER | JURIDIQUE | AUTRE
    actionsCorrectives: '', // Mesures prises

    createdAt: null,
    updatedAt: null
  },

  // ============================================
  // MODULE INVESTISSEMENT - Schemas
  // ============================================

  INV_PROJECT: {
    id: null,
    code: '',                               // Code SIGOBE ou interne
    nom: '',                                // Nom du projet (Titre)
    description: '',

    // Classification (Annexe 1 - Section)
    section: '',                            // Section budgétaire
    sectionCode: '',
    typeProjet: 'SIGOBE',                   // SIGOBE | TRANSFERT | HORS_SIGOBE
    natureProjet: 'NOUVEAU',                // NOUVEAU | RECURRENT | NOUVELLE_PHASE
    isOpe: false,                           // Opération Prioritaire de l'État
    isPrioritaire: false,

    // OPE - Ordonnateur Principal des Crédits (Annexe 1)
    ope: '',                                // Nom de l'OPE
    opeCode: '',

    // Mode de gestion (Annexe 1)
    modeGestion: 'SIGOBE',                  // SIGOBE | TRANSFERT | DIRECT | DELEGUE

    // Entité exécutante
    typeEntite: 'ADMIN',                    // UCP | EPN | COLLECTIVITE | ADMIN
    entiteExecutante: '',
    entiteCode: '',

    // Cadre institutionnel
    ministere: '',
    ministereCode: '',
    secteur: '',                            // Éducation, Santé, Routes, etc.
    secteurCode: '',
    domaine: '',                            // Construction d'école, etc.

    // Localisation géographique complète (Annexe 1 - hiérarchie)
    district: '',
    districtCode: '',
    region: '',
    regionCode: '',
    departement: '',
    departementCode: '',
    sousPrefecture: '',
    sousPrefectureCode: '',
    commune: '',
    communeCode: '',
    village: '',
    localite: '',
    localisationDetail: '',
    latitude: null,
    longitude: null,
    coordsValidees: false,

    // Financier global (Annexe 1)
    coutTotal: 0,
    coutInitial: 0,                         // Coût initial avant révisions
    devise: 'XOF',
    dureePrevueMois: 12,
    dateDebutPrevue: null,
    dateFinPrevue: null,
    dateDebutReelle: null,
    dateFinReelle: null,

    // Sources de financement synthèse
    partEtat: 0,                            // Montant Trésor
    partBailleur: 0,                        // Montant total bailleurs
    partContrepartie: 0,                    // Contrepartie nationale
    bailleurs: [],                          // [{code, nom, montant, devise, type: 'DON'|'EMPRUNT'}]
    nbBailleurs: 0,

    // Acteurs clés (Annexe 4 - références)
    controleurFinancier: '',
    controleurFinancierId: null,
    coordonnateur: '',
    coordonnateurId: null,
    responsableFinancier: '',
    responsableFinancierId: null,
    specialisteMarche: '',
    specialisteMarcheId: null,

    // Composantes
    nbComposantes: 0,
    composantesIds: [],

    // Marchés associés (lien module Marché)
    nbMarches: 0,
    marchesIds: [],

    // Indicateurs GAR synthèse (Annexe 3)
    nbIndicateursImpact: 0,
    nbIndicateursEffet: 0,
    nbIndicateursExtrant: 0,

    // Exécution synthèse
    tauxExecutionPhysique: 0,
    tauxExecutionFinancier: 0,
    montantExecute: 0,
    derniereMiseAJour: null,

    // Statut
    statut: 'PLANIFIE',                     // PLANIFIE | EN_COURS | SUSPENDU | TERMINE | ABANDONNE
    phase: 'NOTIFIE',                       // NOTIFIE | TRANSFERE | ECLATE | EXECUTE

    // Import
    importSource: null,                     // MANUEL | IMPORT_CSV | IMPORT_EXCEL
    importLogId: null,

    createdAt: null,
    updatedAt: null
  },

  INV_BUDGET: {
    id: null,
    projectId: null,
    annee: new Date().getFullYear(),

    montantInitial: 0,
    montantActuel: 0,
    revisions: [],                          // [{date, ancien, nouveau, motif}]

    montantNotifie: 0,
    montantEclate: 0,
    ecartNotifieEclate: 0,

    createdAt: null,
    updatedAt: null
  },

  INV_BUDGET_BREAKDOWN: {
    id: null,
    budgetId: null,
    projectId: null,

    // Chaîne budgétaire
    uaCode: '',
    uaLib: '',
    activiteCode: '',
    activiteLib: '',
    ligneCode: '',
    ligneLib: '',

    // Composante
    composanteId: null,
    composanteNom: '',

    // Montants
    montantPrevu: 0,
    montantEngage: 0,
    observations: '',

    createdAt: null,
    updatedAt: null
  },

  INV_TRANSFER: {
    id: null,
    projectId: null,

    annee: new Date().getFullYear(),
    trimestre: 1,

    montantPrevu: 0,
    montantTransfere: 0,
    dateOp: null,
    numeroOp: '',

    ecart: 0,
    statut: 'PREVU',                        // PREVU | EN_ATTENTE | TRANSFERE | PARTIEL
    commentaire: '',

    createdAt: null,
    updatedAt: null
  },

  INV_ADVANCE_LETTER: {
    id: null,
    projectId: null,

    reference: '',
    montant: 0,
    dateEmission: null,
    dateEcheance: null,

    modalite: 'RESERVE',                    // RESERVE | RALLONGE | MIXTE
    uaReserve: '',
    uaRallonge: '',

    montantRegularise: 0,
    dateRegularisation: null,
    statut: 'EMISE',                        // EMISE | PARTIELLE | REGULARISEE | EXPIREE

    delaiRegularisationJours: 90,
    documentRef: null,
    commentaire: '',

    createdAt: null,
    updatedAt: null
  },

  INV_COMPONENT: {
    id: null,
    projectId: null,

    code: '',
    nom: '',
    description: '',

    coutPrevu: 0,
    coutActuel: 0,

    zoneIntervention: '',
    livrablesPrincipaux: [],                // [{type, description}]
    marchesAssocies: [],                    // [operationId, ...]
    indicateurs: [],                        // [{code, libelle, baseline, cible}]

    ordre: 1,

    createdAt: null,
    updatedAt: null
  },

  INV_ACTIVITY: {
    id: null,
    projectId: null,
    componentId: null,

    code: '',
    libelle: '',
    description: '',

    dateDebut: null,
    dateFin: null,
    annee: null,
    trimestre: null,

    budgetPrevu: 0,
    budgetExecute: 0,

    source: 'ETAT',                         // ETAT | BAILLEUR | MIXTE
    bailleurCode: '',

    livrableAttendu: '',
    indicateurCode: '',

    statut: 'PLANIFIE',                     // PLANIFIE | EN_COURS | TERMINE | REPORTE | ANNULE
    tauxRealisation: 0,

    createdAt: null,
    updatedAt: null
  },

  INV_PHYSICAL_TRACKING: {
    id: null,
    projectId: null,
    componentId: null,
    activityId: null,

    typeSuivi: 'RSF',                       // RSF | MISSION_TERRAIN | RAPPORT_TECHNIQUE
    classeRsf: null,                        // 2 | 6

    typeMission: null,                      // BASELINE | PONCTUELLE | PERIODIQUE
    periodiciteJours: 60,

    dateSuivi: null,
    dateProchaine: null,
    livrableConcerne: '',

    localisation: '',
    latitude: null,
    longitude: null,

    observations: '',
    resultat: 'CONFORME',                   // CONFORME | ECART_MINEUR | ECART_MAJEUR | NON_CONFORME
    actionsRequises: '',

    documentRef: null,
    photos: [],

    validePar: '',
    dateValidation: null,

    createdAt: null,
    updatedAt: null
  },

  INV_FINANCIAL_STATUS: {
    id: null,
    projectId: null,

    annee: new Date().getFullYear(),
    mois: null,

    montantNotifie: 0,
    montantEclate: 0,
    montantTransfere: 0,
    montantExecute: 0,

    rae: 0,                                 // Reste à Exécuter
    rab: 0,                                 // Reste à Budgétiser

    tauxExecution: 0,
    tauxAbsorption: 0,

    executionParBailleur: [],               // [{bailleur, montant, taux}]

    createdAt: null,
    updatedAt: null
  },

  INV_GLIDE: {
    id: null,
    projectId: null,

    anneeOrigine: null,
    anneeDestination: null,

    montantInitial: 0,
    montantRealise: 0,
    montantGlisse: 0,

    ecartAbsolu: 0,
    ecartPourcentage: 0,

    motif: '',
    categorieMotif: null,                   // TECHNIQUE | FINANCIER | ADMINISTRATIF | FORCE_MAJEURE | AUTRE

    isVariationCritique: false,             // > 30%

    createdAt: null,
    updatedAt: null
  },

  INV_GAR_INDICATOR: {
    id: null,
    projectId: null,
    componentId: null,

    code: '',
    libelle: '',
    description: '',

    niveau: 'OUTPUT',                       // OUTPUT | OUTCOME | IMPACT

    unite: '',
    baseline: null,
    baselineAnnee: null,

    cibles: [],                             // [{annee, valeur}]
    valeurActuelle: null,
    dateDerniereMesure: null,

    sourceVerification: '',
    frequenceMesure: 'ANNUELLE',            // MENSUELLE | TRIMESTRIELLE | SEMESTRIELLE | ANNUELLE

    objectifParent: '',

    createdAt: null,
    updatedAt: null
  },

  INV_EVALUATION: {
    id: null,
    projectId: null,
    indicatorId: null,

    typeEvaluation: 'ANNUELLE',             // INFRA_ANNUELLE | ANNUELLE | PLURIANNUELLE | FINALE
    annee: new Date().getFullYear(),
    trimestre: null,

    valeurCible: null,
    valeurRealisee: null,
    ecart: null,
    ecartPourcentage: null,

    statut: 'EN_BONNE_VOIE',                // EN_BONNE_VOIE | A_RISQUE | NON_ATTEINT | DEPASSE

    observations: '',
    actionsCorrectives: '',

    validePar: '',
    dateValidation: null,
    validateurType: null,                   // CF | ENTITE_TECHNIQUE | DCF | MINISTERE

    documentRef: null,

    createdAt: null,
    updatedAt: null
  },

  INV_ALERT: {
    id: null,
    projectId: null,

    typeAlerte: '',
    codeAlerte: '',

    priorite: 'MAJEURE',                    // CRITIQUE | MAJEURE | MINEURE | INFO

    titre: '',
    description: '',

    entiteType: null,
    entiteId: null,
    annee: null,

    valeurSeuil: null,
    valeurActuelle: null,

    statut: 'ACTIVE',                       // ACTIVE | ACQUITTEE | RESOLUE | EXPIREE

    dateDetection: null,
    dateAcquittement: null,
    acquittePar: '',
    dateResolution: null,
    resolutionCommentaire: '',

    lienAction: '',

    createdAt: null,
    updatedAt: null
  },

  INV_DOCUMENT: {
    id: null,
    projectId: null,

    categorie: '',                          // FICHE_VIE | DECISION_CF | DEROGATION | OP_PROVISOIRE | LETTRE_AVANCE | TDR | AUDIT | PTBA | RAPPORT | AUTRE
    typeDocument: '',

    titre: '',
    description: '',
    reference: '',
    dateDocument: null,

    fichierUrl: null,
    fichierNom: '',
    fichierTaille: 0,

    obligatoire: false,
    statut: 'DRAFT',                        // DRAFT | VALIDE | REJETE | ARCHIVE

    uploadedBy: '',
    uploadedAt: null,
    validePar: '',
    dateValidation: null,

    createdAt: null,
    updatedAt: null
  },

  // ============================================
  // MODULE INVESTISSEMENT - Nouvelles Entités (Enrichissement)
  // ============================================

  INV_PIP_HISTORY: {
    id: null,
    projectId: null,
    annee: new Date().getFullYear(),
    montantInscrit: 0,
    montantExecute: 0,
    tauxExecution: 0,
    statut: 'INSCRIT',                              // INSCRIT | SUSPENDU | RETIRE | TERMINE
    rangPriorite: null,
    observations: '',
    createdAt: null,
    updatedAt: null
  },

  INV_OPE_CRITERIA: {
    id: null,
    code: '',
    libelle: '',
    description: '',
    typeCritere: 'INCLUSION',                       // INCLUSION | EXCLUSION | PRIORITE
    conditions: [],                                 // [{field, operator, value}]
    poids: 1,
    isBloquant: false,
    actif: true,
    createdAt: null,
    updatedAt: null
  },

  INV_PROVISIONAL_OP: {
    id: null,
    projectId: null,
    reference: '',
    montant: 0,
    dateEmission: null,
    anneeExercice: new Date().getFullYear(),
    montantRegularise: 0,
    dateRegularisation: null,
    referenceRegularisation: '',
    statut: 'EMIS',                                 // EMIS | PARTIEL | REGULARISE | ANNULE | REPORTE
    dateAnnulation: null,
    motifAnnulation: '',
    isPrioritaireNPlus1: false,
    anneeReport: null,
    objet: '',
    beneficiaire: '',
    uaCode: '',
    commentaire: '',
    documentRef: null,
    createdAt: null,
    updatedAt: null
  },

  INV_IMPREST: {
    id: null,
    projectId: null,
    reference: '',
    typeRegie: 'AVANCES',                           // AVANCES | RECETTES | MIXTE
    plafond: 0,
    montantAlimente: 0,
    montantDepense: 0,
    montantJustifie: 0,
    soldeDisponible: 0,
    regisseurNom: '',
    regisseurFonction: '',
    dateNomination: null,
    statut: 'ACTIVE',                               // ACTIVE | SUSPENDUE | CLOTUREE
    dateCreation: null,
    dateDernierApprovisionnement: null,
    dateDerniereJustification: null,
    arreteCreationRef: null,
    documentCautionnement: null,
    commentaire: '',
    createdAt: null,
    updatedAt: null
  },

  INV_IMPREST_MOVEMENT: {
    id: null,
    imprestId: null,
    typeMouvement: 'DEPENSE',                       // ALIMENTATION | DEPENSE | JUSTIFICATION | REVERSEMENT
    montant: 0,
    dateMouvement: null,
    reference: '',
    objet: '',
    beneficiaire: '',
    pieceJustificative: null,
    numeroOp: '',
    commentaire: '',
    createdAt: null
  },

  INV_QUARTERLY_TRACKING: {
    id: null,
    projectId: null,
    annee: new Date().getFullYear(),
    trimestre: 1,
    niveauAttendu: 0,
    niveauReel: 0,
    ecart: 0,
    budgetPrevuCumule: 0,
    budgetExecuteCumule: 0,
    tauxExecution: 0,
    activitesPrevues: 0,
    activitesRealisees: 0,
    livrablesAttendus: 0,
    livrablesLivres: 0,
    appreciation: 'NORMAL',                         // EXCELLENT | BON | NORMAL | RETARD | CRITIQUE
    observations: '',
    actionsCorrectives: '',
    risquesIdentifies: '',
    dateRapport: null,
    validePar: '',
    dateValidation: null,
    createdAt: null,
    updatedAt: null
  },

  INV_GAR_VALUES: {
    id: null,
    indicatorId: null,
    projectId: null,
    annee: new Date().getFullYear(),
    periode: 'ANNUEL',                              // T1 | T2 | T3 | T4 | S1 | S2 | ANNUEL
    valeurCible: null,
    valeurRealisee: null,
    ecart: null,
    tauxAtteinte: null,
    sourceDonnee: '',
    methodeCollecte: '',
    dateCollecte: null,
    observations: '',
    facteursSucces: '',
    facteursEchec: '',
    validePar: '',
    dateValidation: null,
    validateurType: null,                           // CF | TECHNIQUE | MIXTE
    documentRef: null,
    createdAt: null,
    updatedAt: null
  },

  INV_DOC_MATRIX: {
    id: null,
    typeProjet: 'ALL',                              // SIGOBE | TRANSFERT | HORS_SIGOBE | ALL
    phaseProjet: 'ALL',                             // NOTIFIE | TRANSFERE | ECLATE | EXECUTE | ALL
    typeEntite: 'ALL',                              // UCP | EPN | COLLECTIVITE | ADMIN | ALL
    categorieDocument: '',
    typeDocument: '',
    libelle: '',
    description: '',
    obligatoire: false,
    bloquant: false,
    delaiProductionJours: null,
    recurrent: false,
    frequence: null,                                // MENSUEL | TRIMESTRIEL | SEMESTRIEL | ANNUEL
    validateur: null,                               // CF | DCF | UCP | MINISTERE | BAILLEUR
    ordre: 1,
    actif: true,
    createdAt: null,
    updatedAt: null
  },

  INV_DECISION: {
    id: null,
    projectId: null,
    reference: '',
    typeDecision: 'AVIS',                           // AVIS | VISA | DEROGATION | REJET | SUSPENSION | MAINLEVEE | AUTRE
    objet: '',
    motif: '',
    emetteur: 'CF',                                 // CF | DCF | DGBF | MINISTERE
    signataireNom: '',
    signataireFonction: '',
    dateDecision: null,
    dateEffet: null,
    dateExpiration: null,
    statut: 'VALIDE',                               // PROJET | VALIDE | ANNULE | EXPIRE
    entiteConcernee: null,                          // BUDGET | MARCHE | AVENANT | LETTRE_AVANCE | etc.
    entiteId: null,
    documentRef: null,
    fichierUrl: null,
    commentaire: '',
    createdAt: null,
    updatedAt: null
  },

  INV_SETTINGS: {
    id: null,
    code: '',
    categorie: 'SEUIL',                             // SEUIL | DELAI | REGLE | AFFICHAGE | WORKFLOW
    libelle: '',
    description: '',
    valeurType: 'NUMBER',                           // NUMBER | STRING | BOOLEAN | JSON | DATE
    valeurNumber: null,
    valeurString: null,
    valeurBoolean: null,
    valeurJson: null,
    unite: '',
    valeurMin: null,
    valeurMax: null,
    modifiable: true,
    actif: true,
    createdAt: null,
    updatedAt: null
  },

  // ============================================
  // MODULE INVESTISSEMENT - Entités Import Annexes
  // Conformes aux formulaires officiels (Groupe Syn@pse)
  // ============================================

  /**
   * INV_FINANCING_SOURCE - Sources de financement multiples (Annexe 1)
   * Structure Trésor + Bailleurs multiples (Emprunt/Don)
   */
  INV_FINANCING_SOURCE: {
    id: null,
    projectId: null,

    // Type de source
    sourceType: 'TRESOR',                           // TRESOR | BAILLEUR | CONTREPARTIE | AUTRE
    bailleurCode: '',                               // Code bailleur (BM, AFD, BADEA, UE, etc.)
    bailleurNom: '',                                // Nom complet du bailleur

    // Type de financement (pour bailleurs)
    typeFinancement: 'DON',                         // DON | EMPRUNT | MIXTE

    // Montants par année
    montantTotal: 0,
    montantAnneeN: 0,                               // Budget année en cours
    montantAnneeNPlus1: 0,
    montantAnneeNPlus2: 0,
    montantAnneeNPlus3: 0,

    // Décaissement
    montantDecaisse: 0,
    tauxDecaissement: 0,

    // Conditions spécifiques
    accordFinancementRef: '',                       // Référence convention/accord
    dateSignature: null,
    dateEffet: null,
    dateExpiration: null,

    // Devise et conversion
    devise: 'XOF',
    tauxChange: 1,
    montantDeviseOrigine: 0,

    pourcentageTotal: 0,                            // % du coût total projet
    ordre: 1,

    createdAt: null,
    updatedAt: null
  },

  /**
   * INV_LIVRABLE - Livrables attendus par composante (Annexe 1)
   * Avec localisation géographique complète
   */
  INV_LIVRABLE: {
    id: null,
    projectId: null,
    componentId: null,

    // Identification
    code: '',
    type: '',                                       // INFRASTRUCTURE | EQUIPEMENT | FORMATION | SERVICE | ETUDE | AUTRE
    libelle: '',
    description: '',

    // Quantification
    quantitePrevue: 0,
    quantiteRealisee: 0,
    unite: '',                                      // km, m², unité, personne, etc.

    // Localisation géographique (hiérarchie complète Annexe 1)
    district: '',
    districtCode: '',
    region: '',
    regionCode: '',
    departement: '',
    departementCode: '',
    sousPrefecture: '',
    sousPrefectureCode: '',
    commune: '',
    communeCode: '',
    village: '',
    localite: '',
    latitude: null,
    longitude: null,
    coordsValidees: false,

    // Planning
    dateDebutPrevue: null,
    dateFinPrevue: null,
    dateDebutReelle: null,
    dateFinReelle: null,

    // Lien avec marchés (module Marché)
    marcheId: null,                                 // ID opération dans module Marché
    marcheCode: '',

    // Suivi
    tauxAvancement: 0,
    statut: 'PLANIFIE',                             // PLANIFIE | EN_COURS | LIVRE | REPORTE | ANNULE
    observations: '',

    createdAt: null,
    updatedAt: null
  },

  /**
   * INV_STAKEHOLDER - Acteurs clés du projet (Annexe 4)
   * CF, Coordonnateur, RAF, SPM avec contacts
   */
  INV_STAKEHOLDER: {
    id: null,
    projectId: null,

    // Fonction
    fonction: '',                                   // CF | COORDONNATEUR | RAF | SPM | COMPTABLE | AUDITEUR | AUTRE
    fonctionAutre: '',                              // Si AUTRE

    // Identité
    civilite: '',                                   // M. | Mme | Dr | Pr
    nom: '',
    prenom: '',
    nomComplet: '',

    // Contacts
    telephone: '',
    telephoneSecondaire: '',
    email: '',
    emailSecondaire: '',

    // Affectation
    dateNomination: null,
    datePriseFonction: null,
    dateFinFonction: null,

    // Documents
    decisionRef: '',                                // Référence arrêté/décision de nomination
    decisionDoc: null,

    // Structure de rattachement
    structureRattachement: '',
    ministere: '',

    // État
    actif: true,
    isCurrentHolder: true,                          // Titulaire actuel du poste

    createdAt: null,
    updatedAt: null
  },

  /**
   * INV_SUSTAINABILITY - Analyse de soutenabilité (Annexe 2)
   * Comparaison PTBA vs Budget inscrit sur N+1, N+2, N+3
   */
  INV_SUSTAINABILITY: {
    id: null,
    projectId: null,
    anneeReference: new Date().getFullYear(),       // Année N de référence

    // Année N+1
    anneeNPlus1: {
      annee: null,
      montantPTBA: 0,                               // Montant prévu dans le PTBA
      montantBudgetInscrit: 0,                      // Montant inscrit au budget
      ecart: 0,
      ecartPourcentage: 0,
      couvert: false,                               // Budget >= PTBA
      observations: ''
    },

    // Année N+2
    anneeNPlus2: {
      annee: null,
      montantPTBA: 0,
      montantBudgetInscrit: 0,
      ecart: 0,
      ecartPourcentage: 0,
      couvert: false,
      observations: ''
    },

    // Année N+3
    anneeNPlus3: {
      annee: null,
      montantPTBA: 0,
      montantBudgetInscrit: 0,
      ecart: 0,
      ecartPourcentage: 0,
      couvert: false,
      observations: ''
    },

    // Synthèse
    soutenabiliteGlobale: 'A_EVALUER',              // SOUTENABLE | PARTIELLEMENT_SOUTENABLE | NON_SOUTENABLE | A_EVALUER
    ecartCumule: 0,
    ecartCumulePourcentage: 0,
    risqueFinancement: 'FAIBLE',                    // FAIBLE | MOYEN | ELEVE | CRITIQUE
    recommandations: '',

    // Validation
    validePar: '',
    dateValidation: null,
    validateurFonction: '',

    createdAt: null,
    updatedAt: null
  },

  /**
   * INV_IMPORT_LOG - Journal des imports de données
   * Traçabilité des chargements de fichiers
   */
  INV_IMPORT_LOG: {
    id: null,

    // Fichier source
    annexeType: '',                                 // ANNEXE1_IDENTIFICATION | ANNEXE1_LOCALISATION | etc.
    zoneId: '',
    fichierNom: '',
    fichierTaille: 0,
    fichierHash: '',                                // Hash MD5/SHA pour détecter doublons

    // Résultat import
    dateImport: null,
    importePar: '',
    nbLignesTotal: 0,
    nbLignesImportees: 0,
    nbLignesErreur: 0,
    nbLignesIgnorees: 0,

    // Détail des erreurs
    erreurs: [],                                    // [{ligne, colonne, message}]
    avertissements: [],

    // Statut
    statut: 'EN_COURS',                             // EN_COURS | TERMINE | ERREUR | ANNULE

    // Projets affectés
    projetsAffectes: [],                            // IDs des projets créés/modifiés

    createdAt: null,
    updatedAt: null
  }
};

/**
 * Create a new entity instance with defaults
 */
export function createEntity(entityType, data = {}) {
  const schema = SCHEMAS[entityType];
  if (!schema) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(schema)),
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

/**
 * Validate entity (basic validation)
 */
export function validateEntity(entityType, data) {
  const errors = [];

  switch (entityType) {
    case ENTITIES.OPERATION:
      if (!data.objet) errors.push('Objet du marché requis');
      if (!data.typeMarche) errors.push('Type de marché requis');
      if (!data.montantPrevisionnel || data.montantPrevisionnel <= 0) {
        errors.push('Montant prévisionnel invalide');
      }
      break;

    case ENTITIES.ATTRIBUTION:
      if (!data.attributaire?.entreprises?.length) {
        errors.push('Au moins une entreprise attributaire requise');
      }
      if (!data.montants?.ht || data.montants.ht <= 0) {
        errors.push('Montant HT invalide');
      }
      break;

    case ENTITIES.AVENANT:
      if (!data.type) errors.push('Type d\'avenant requis');
      if (data.type === 'FINAN' && !data.variationMontant) {
        errors.push('Variation de montant requise');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get display label for entity
 */
export function getEntityLabel(entityType, entity) {
  switch (entityType) {
    case ENTITIES.OPERATION:
      return entity.objet || 'Sans objet';
    case ENTITIES.ATTRIBUTION:
      return entity.attributaire?.entreprises?.[0]?.raisonSociale || 'Attributaire';
    case ENTITIES.AVENANT:
      return `Avenant n°${entity.numero}`;
    default:
      return entity.id || 'Sans identifiant';
  }
}
