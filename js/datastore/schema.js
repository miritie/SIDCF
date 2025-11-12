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
  PROCEDURE: 'PROCEDURE',
  RECOURS: 'RECOURS',
  ATTRIBUTION: 'ATTRIBUTION',
  ECHEANCIER: 'ECHEANCIER',
  CLE_REPARTITION: 'CLE_REPARTITION',
  AVENANT: 'AVENANT',
  GARANTIE: 'GARANTIE',
  CLOTURE: 'CLOTURE',
  ORDRE_SERVICE: 'ORDRE_SERVICE',
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
    type: '',
    objet: '',
    localite: {
      region: '',
      departement: '',
      commune: '',
      localite: '',
      lat: null,
      long: null
    }
  },

  PROCEDURE: {
    id: null,
    operationId: null,
    commission: 'COJO',
    modePassation: null,
    categorie: 'NATIONALE',
    dates: {
      ouverture: null,
      analyse: null,
      jugement: null
    },
    nbOffresRecues: 0,
    nbOffresClassees: 0,
    pv: {
      ouverture: null,
      analyse: null,
      jugement: null
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
    attributaire: {
      singleOrGroup: 'SIMPLE',
      groupType: null,
      entreprises: []
    },
    montants: {
      ht: 0,
      ttc: 0,
      confidentiel: false
    },
    dates: {
      signatureTitulaire: null,
      signatureAC: null,
      approbation: null,
      decisionCF: null
    },
    decisionCF: {
      etat: null,
      motifRef: null,
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
    periodicite: 'LIBRE',
    items: [],
    total: 0,
    createdAt: null,
    updatedAt: null
  },

  ECHEANCE_ITEM: {
    num: 1,
    date: null,
    montant: 0,
    typeEcheance: 'ACOMPTE',
    livrablesCibles: []
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
    bailleur: '',
    typeFinancement: 'ETAT',
    natureEco: '',
    baseCalc: 'HT',
    montant: 0,
    pourcentage: 0
  },

  AVENANT: {
    id: null,
    operationId: null,
    numero: 1,
    type: 'FINAN',
    variationMontant: 0,
    variationDuree: 0,
    dateSignature: null,
    motifRef: '',
    motifAutre: '',
    cumulPourcent: 0,
    visaCFRef: null,
    autorisation: null,
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
    receptionProv: {
      date: null,
      pv: null,
      reserves: null
    },
    receptionDef: {
      date: null,
      pv: null
    },
    mainlevees: [],
    syntheseFinale: '',
    closAt: null,
    createdAt: null
  },

  ORDRE_SERVICE: {
    id: null,
    operationId: null,
    numero: '',
    dateEmission: null,
    objet: '',
    docRef: null,
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
