/* ============================================
   Data Schemas - Entity Definitions
   ============================================ */

/**
 * Entity names (used as keys in storage)
 */
export const ENTITIES = {
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
  DOCUMENT: 'DOCUMENT'
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
