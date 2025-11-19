#!/usr/bin/env node
/**
 * Script Part 3: Final entities - ORDRE_SERVICE, AVENANT, RESILIATION, GARANTIE, CLOTURE, ANO, ECHEANCIER, CLE_REPARTITION, RECOURS, DOCUMENT, DECOMPTE, DIFFICULTE
 * Execute with: node js/datastore/complete-seed-data-part3.js
 */

const fs = require('fs');
const path = require('path');

// Load current seed
const seedPath = path.join(__dirname, 'seed-comprehensive.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

console.log('Adding final entities...\n');

// Helper functions
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

// ========================================
// ORDRE_SERVICE - 3 operations (OP-2023-003, OP-2024-001, OP-2024-007 in EXECUTION)
// ========================================
const ordresService = [
  {
    id: "OS-2023-003-001",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    numero: "OS-001/DGT/2023",
    type: "DEMARRAGE",
    dateEmission: "2023-08-20T00:00:00.000Z",
    dateEffet: "2023-09-01T00:00:00.000Z",
    dateFinPrevue: "2025-09-01T00:00:00.000Z",
    objet: "Ordre de service de démarrage des travaux de réhabilitation route Yamoussoukro-Bouaké",
    montant: 12500000000,
    delai: 24,
    lieuxTravaux: "Axe Yamoussoukro-Bouaké, PK 0 à PK 75",
    emetteur: "Directeur des Grands Travaux",
    bureauControle: {
      type: "ENTREPRISE",
      id: "ENT-008",
      nom: "ETSO Études & Conseils"
    },
    bureauEtudes: {
      type: "ENTREPRISE",
      id: "ENT-008",
      nom: "ETSO Études & Conseils"
    },
    createdAt: "2023-08-20T09:00:00.000Z",
    updatedAt: "2023-08-20T14:00:00.000Z"
  },
  {
    id: "OS-2024-001-001",
    operationId: "OP-2024-001",
    attributionId: "ATTR-2024-001",
    numero: "OS-001/DGMP/2024",
    type: "DEMARRAGE",
    dateEmission: "2024-05-12T00:00:00.000Z",
    dateEffet: "2024-06-01T00:00:00.000Z",
    dateFinPrevue: "2025-06-01T00:00:00.000Z",
    objet: "Ordre de service de démarrage construction centre de santé Korhogo",
    montant: 250000000,
    delai: 12,
    lieuxTravaux: "Korhogo Centre, terrain identifié par le Ministère de la Santé",
    emetteur: "Directeur Général des Marchés Publics",
    bureauControle: {
      type: "UA",
      nom: "Direction Générale de la Santé"
    },
    bureauEtudes: {
      type: "ENTREPRISE",
      id: "ENT-008",
      nom: "ETSO Études & Conseils"
    },
    createdAt: "2024-05-12T09:00:00.000Z",
    updatedAt: "2024-05-12T14:00:00.000Z"
  },
  {
    id: "OS-2024-007-001",
    operationId: "OP-2024-007",
    attributionId: "ATTR-2024-007",
    numero: "OS-001/DCP/2024",
    type: "DEMARRAGE",
    dateEmission: "2024-07-05T00:00:00.000Z",
    dateEffet: "2024-07-15T00:00:00.000Z",
    dateFinPrevue: "2025-05-15T00:00:00.000Z",
    objet: "Ordre de service de démarrage réhabilitation MACA Abidjan",
    montant: 480000000,
    delai: 10,
    lieuxTravaux: "MACA Yopougon-Niangon, Abidjan",
    emetteur: "Directeur de la Construction Pénitentiaire",
    bureauControle: {
      type: "UA",
      nom: "Direction de la Construction Pénitentiaire"
    },
    bureauEtudes: {
      type: "ENTREPRISE",
      id: "ENT-008",
      nom: "ETSO Études & Conseils"
    },
    createdAt: "2024-07-05T09:00:00.000Z",
    updatedAt: "2024-07-05T14:00:00.000Z"
  }
];

seed.ORDRE_SERVICE = ordresService;
console.log(`✅ ORDRE_SERVICE: ${ordresService.length} entries`);

// ========================================
// AVENANT - 3 operations (OP-2023-003, OP-2024-001, OP-2024-007)
// ========================================
const avenants = [
  // OP-2023-003 - Avenant 1 (15%)
  {
    id: "AVE-2023-003-001",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    numero: "AVENANT-001/DGT/2024",
    dateSignature: "2024-09-10T00:00:00.000Z",
    motif: "MODIFICATION_TECH",
    motifAutre: null,
    description: "Extension de l'ouvrage d'art au PK 38 suite aux études géotechniques complémentaires",
    montantInitial: 12500000000,
    montantAvenant: 1875000000,
    montantCumule: 14375000000,
    pourcentageAvenant: 15.00,
    pourcentageCumule: 15.00,
    delaiInitial: 24,
    delaiAvenant: 4,
    delaiTotal: 28,
    dateFinInitiale: "2025-09-01T00:00:00.000Z",
    dateFinRevisee: "2026-01-01T00:00:00.000Z",
    visa: {
      dateVisa: "2024-09-20T00:00:00.000Z",
      numeroVisa: "VISA/CF/AVE/2024/003-001",
      viseur: "Amadou TOURE"
    },
    createdAt: "2024-09-10T09:00:00.000Z",
    updatedAt: "2024-09-20T14:00:00.000Z"
  },

  // OP-2024-001 - Avenant 1 (23%)
  {
    id: "AVE-2024-001-001",
    operationId: "OP-2024-001",
    attributionId: "ATTR-2024-001",
    numero: "AVENANT-001/DGMP/2024",
    dateSignature: "2024-11-05T00:00:00.000Z",
    motif: "PRIX_HAUSSE",
    motifAutre: null,
    description: "Ajustement des prix suite à la hausse du ciment et des matériaux de construction (+18%) et ajout d'un bloc administratif",
    montantInitial: 250000000,
    montantAvenant: 57500000,
    montantCumule: 307500000,
    pourcentageAvenant: 23.00,
    pourcentageCumule: 23.00,
    delaiInitial: 12,
    delaiAvenant: 2,
    delaiTotal: 14,
    dateFinInitiale: "2025-06-01T00:00:00.000Z",
    dateFinRevisee: "2025-08-01T00:00:00.000Z",
    visa: {
      dateVisa: "2024-11-15T00:00:00.000Z",
      numeroVisa: "VISA/CF/AVE/2024/001-001",
      viseur: "Marie-Thérèse BROU"
    },
    createdAt: "2024-11-05T09:00:00.000Z",
    updatedAt: "2024-11-15T14:00:00.000Z"
  },

  // OP-2024-007 - Avenant 1 (20%)
  {
    id: "AVE-2024-007-001",
    operationId: "OP-2024-007",
    attributionId: "ATTR-2024-007",
    numero: "AVENANT-001/DCP/2024",
    dateSignature: "2024-10-20T00:00:00.000Z",
    motif: "TRAVAUX_SUPP",
    motifAutre: null,
    description: "Travaux supplémentaires non prévus: réfection complète du système électrique et installation système de sécurité renforcé",
    montantInitial: 480000000,
    montantAvenant: 96000000,
    montantCumule: 576000000,
    pourcentageAvenant: 20.00,
    pourcentageCumule: 20.00,
    delaiInitial: 10,
    delaiAvenant: 2,
    delaiTotal: 12,
    dateFinInitiale: "2025-05-15T00:00:00.000Z",
    dateFinRevisee: "2025-07-15T00:00:00.000Z",
    visa: {
      dateVisa: "2024-10-28T00:00:00.000Z",
      numeroVisa: "VISA/CF/AVE/2024/007-001",
      viseur: "Jean-Baptiste KOFFI"
    },
    createdAt: "2024-10-20T09:00:00.000Z",
    updatedAt: "2024-10-28T14:00:00.000Z"
  }
];

seed.AVENANT = avenants;
console.log(`✅ AVENANT: ${avenants.length} entries`);

// ========================================
// RESILIATION - 2 operations (OP-2023-007, OP-2024-010)
// ========================================
const resiliations = [
  {
    id: "RES-2023-007",
    operationId: "OP-2023-007",
    attributionId: "ATTR-2023-007",
    dateResiliation: "2024-06-10T00:00:00.000Z",
    motif: "ENTREPRENEUR",
    motifDetail: "Non-respect des délais contractuels et abandon du chantier après 8 mois d'exécution",
    montantExecute: 450000000,
    tauxRealisation: 16.07,
    pvResiliation: "PV-RES-2024-007",
    dateNotification: "2024-06-15T00:00:00.000Z",
    penalites: 35000000,
    createdAt: "2024-06-10T09:00:00.000Z",
    updatedAt: "2024-06-15T16:30:00.000Z"
  },
  {
    id: "RES-2024-010",
    operationId: "OP-2024-010",
    attributionId: "ATTR-2024-010",
    dateResiliation: "2024-09-01T00:00:00.000Z",
    motif: "AUTORITE",
    motifDetail: "Réaffectation budgétaire suite à réorientation des priorités gouvernementales - arrêt après 15% de réalisation",
    montantExecute: 180000000,
    tauxRealisation: 15.00,
    pvResiliation: "PV-RES-2024-010",
    dateNotification: "2024-09-05T00:00:00.000Z",
    penalites: 0,
    createdAt: "2024-09-01T09:00:00.000Z",
    updatedAt: "2024-09-05T16:45:00.000Z"
  }
];

seed.RESILIATION = resiliations;
console.log(`✅ RESILIATION: ${resiliations.length} entries`);

// ========================================
// GARANTIE - All operations with VISA (11 operations)
// ========================================
const garanties = [
  // OP-2023-001
  {
    id: "GAR-2023-001-BG",
    operationId: "OP-2023-001",
    attributionId: "ATTR-2023-001",
    type: "BONNE_EXEC",
    montant: 19000000,
    pourcentage: 5.00,
    dateEmission: "2023-04-20T00:00:00.000Z",
    dateExpiration: "2024-06-01T00:00:00.000Z",
    numeroGarantie: "BG-2023-001-SGBCI",
    banque: "SGBCI",
    beneficiaire: "Direction de la Construction Scolaire",
    etat: "MAINLEVEE",
    dateMainlevee: "2024-02-20T00:00:00.000Z",
    createdAt: "2023-04-20T09:00:00.000Z",
    updatedAt: "2024-02-20T14:00:00.000Z"
  },
  {
    id: "GAR-2023-001-RG",
    operationId: "OP-2023-001",
    attributionId: "ATTR-2023-001",
    type: "RETENUE_GARANTIE",
    montant: 19000000,
    pourcentage: 5.00,
    dateDebut: "2023-06-01T00:00:00.000Z",
    dateExpiration: "2024-08-01T00:00:00.000Z",
    prelevementMensuel: 2375000,
    montantPreleveTotal: 19000000,
    etat: "MAINLEVEE",
    dateMainlevee: "2024-02-20T00:00:00.000Z",
    createdAt: "2023-06-01T09:00:00.000Z",
    updatedAt: "2024-02-20T14:00:00.000Z"
  },

  // OP-2023-002
  {
    id: "GAR-2023-002-BG",
    operationId: "OP-2023-002",
    attributionId: "ATTR-2023-002",
    type: "BONNE_EXEC",
    montant: 42500000,
    pourcentage: 5.00,
    dateEmission: "2023-04-05T00:00:00.000Z",
    dateExpiration: "2023-11-10T00:00:00.000Z",
    numeroGarantie: "BG-2023-002-ECOBANK",
    banque: "Ecobank CI",
    beneficiaire: "Direction Générale de la Santé",
    etat: "MAINLEVEE",
    dateMainlevee: "2023-11-15T00:00:00.000Z",
    createdAt: "2023-04-05T09:00:00.000Z",
    updatedAt: "2023-11-15T14:00:00.000Z"
  },

  // OP-2023-003
  {
    id: "GAR-2023-003-BG",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    type: "BONNE_EXEC",
    montant: 625000000,
    pourcentage: 5.00,
    dateEmission: "2023-07-05T00:00:00.000Z",
    dateExpiration: "2026-03-01T00:00:00.000Z",
    numeroGarantie: "BG-2023-003-BICICI",
    banque: "BICICI",
    beneficiaire: "Direction des Grands Travaux",
    etat: "ACTIVE",
    dateMainlevee: null,
    createdAt: "2023-07-05T09:00:00.000Z",
    updatedAt: "2024-09-20T11:30:00.000Z"
  },
  {
    id: "GAR-2023-003-RG",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    type: "RETENUE_GARANTIE",
    montant: 625000000,
    pourcentage: 5.00,
    dateDebut: "2023-09-01T00:00:00.000Z",
    dateExpiration: "2026-05-01T00:00:00.000Z",
    prelevementMensuel: 26041667,
    montantPreleveTotal: 312500000,
    etat: "EN_COURS",
    dateMainlevee: null,
    createdAt: "2023-09-01T09:00:00.000Z",
    updatedAt: "2024-09-20T11:30:00.000Z"
  },

  // OP-2023-004
  {
    id: "GAR-2023-004-BG",
    operationId: "OP-2023-004",
    attributionId: "ATTR-2023-004",
    type: "BONNE_EXEC",
    montant: 6250000,
    pourcentage: 5.00,
    dateEmission: "2023-05-02T00:00:00.000Z",
    dateExpiration: "2023-10-05T00:00:00.000Z",
    numeroGarantie: "BG-2023-004-NSIA",
    banque: "NSIA Banque CI",
    beneficiaire: "Direction de l'Assainissement",
    etat: "MAINLEVEE",
    dateMainlevee: "2023-09-20T00:00:00.000Z",
    createdAt: "2023-05-02T09:00:00.000Z",
    updatedAt: "2023-09-20T14:00:00.000Z"
  },

  // OP-2023-005
  {
    id: "GAR-2023-005-BG",
    operationId: "OP-2023-005",
    attributionId: "ATTR-2023-005",
    type: "BONNE_EXEC",
    montant: 2250000,
    pourcentage: 5.00,
    dateEmission: "2023-06-02T00:00:00.000Z",
    dateExpiration: "2023-09-05T00:00:00.000Z",
    numeroGarantie: "BG-2023-005-SGBCI",
    banque: "SGBCI",
    beneficiaire: "Direction du Matériel et de la Logistique",
    etat: "MAINLEVEE",
    dateMainlevee: "2023-08-25T00:00:00.000Z",
    createdAt: "2023-06-02T09:00:00.000Z",
    updatedAt: "2023-08-25T14:00:00.000Z"
  },

  // OP-2023-006
  {
    id: "GAR-2023-006-BG",
    operationId: "OP-2023-006",
    attributionId: "ATTR-2023-006",
    type: "BONNE_EXEC",
    montant: 900000,
    pourcentage: 5.00,
    dateEmission: "2023-02-22T00:00:00.000Z",
    dateExpiration: "2024-03-25T00:00:00.000Z",
    numeroGarantie: "BG-2023-006-BOA",
    banque: "BOA CI",
    beneficiaire: "Direction de la Maintenance",
    etat: "MAINLEVEE",
    dateMainlevee: "2024-02-05T00:00:00.000Z",
    createdAt: "2023-02-22T09:00:00.000Z",
    updatedAt: "2024-02-05T14:00:00.000Z"
  },

  // OP-2023-007 (RESILIE)
  {
    id: "GAR-2023-007-BG",
    operationId: "OP-2023-007",
    attributionId: "ATTR-2023-007",
    type: "BONNE_EXEC",
    montant: 140000000,
    pourcentage: 5.00,
    dateEmission: "2023-05-18T00:00:00.000Z",
    dateExpiration: "2025-12-20T00:00:00.000Z",
    numeroGarantie: "BG-2023-007-BICICI",
    banque: "BICICI",
    beneficiaire: "Direction du Développement Rural",
    etat: "APPELEE",
    dateAppel: "2024-06-15T00:00:00.000Z",
    montantAppele: 140000000,
    motifAppel: "Résiliation pour faute de l'entrepreneur",
    createdAt: "2023-05-18T09:00:00.000Z",
    updatedAt: "2024-06-15T16:30:00.000Z"
  },

  // OP-2024-001
  {
    id: "GAR-2024-001-BG",
    operationId: "OP-2024-001",
    attributionId: "ATTR-2024-001",
    type: "BONNE_EXEC",
    montant: 12500000,
    pourcentage: 5.00,
    dateEmission: "2024-04-02T00:00:00.000Z",
    dateExpiration: "2025-08-05T00:00:00.000Z",
    numeroGarantie: "BG-2024-001-SGBCI",
    banque: "SGBCI",
    beneficiaire: "Direction Générale des Marchés Publics",
    etat: "ACTIVE",
    dateMainlevee: null,
    createdAt: "2024-04-02T09:00:00.000Z",
    updatedAt: "2024-05-15T14:30:00.000Z"
  },
  {
    id: "GAR-2024-001-RG",
    operationId: "OP-2024-001",
    attributionId: "ATTR-2024-001",
    type: "RETENUE_GARANTIE",
    montant: 12500000,
    pourcentage: 5.00,
    dateDebut: "2024-06-01T00:00:00.000Z",
    dateExpiration: "2025-10-01T00:00:00.000Z",
    prelevementMensuel: 892857,
    montantPreleveTotal: 4464286,
    etat: "EN_COURS",
    dateMainlevee: null,
    createdAt: "2024-06-01T09:00:00.000Z",
    updatedAt: "2024-11-15T14:00:00.000Z"
  },

  // OP-2024-007
  {
    id: "GAR-2024-007-BG",
    operationId: "OP-2024-007",
    attributionId: "ATTR-2024-007",
    type: "BONNE_EXEC",
    montant: 24000000,
    pourcentage: 5.00,
    dateEmission: "2024-06-25T00:00:00.000Z",
    dateExpiration: "2025-08-15T00:00:00.000Z",
    numeroGarantie: "BG-2024-007-BOA",
    banque: "BOA CI",
    beneficiaire: "Direction de la Construction Pénitentiaire",
    etat: "ACTIVE",
    dateMainlevee: null,
    createdAt: "2024-06-25T09:00:00.000Z",
    updatedAt: "2024-08-15T14:00:00.000Z"
  },
  {
    id: "GAR-2024-007-RG",
    operationId: "OP-2024-007",
    attributionId: "ATTR-2024-007",
    type: "RETENUE_GARANTIE",
    montant: 24000000,
    pourcentage: 5.00,
    dateDebut: "2024-07-15T00:00:00.000Z",
    dateExpiration: "2025-09-15T00:00:00.000Z",
    prelevementMensuel: 2000000,
    montantPreleveTotal: 8000000,
    etat: "EN_COURS",
    dateMainlevee: null,
    createdAt: "2024-07-15T09:00:00.000Z",
    updatedAt: "2024-10-28T14:00:00.000Z"
  }
];

seed.GARANTIE = garanties;
console.log(`✅ GARANTIE: ${garanties.length} entries`);

// ========================================
// CLOTURE - 6 CLOS operations (OP-2023-001 through OP-2023-006)
// ========================================
const clotures = [
  {
    id: "CLO-2023-001",
    operationId: "OP-2023-001",
    attributionId: "ATTR-2023-001",
    pvProvisoire: {
      numero: "PV-PROV-2023-001",
      date: "2024-01-28T00:00:00.000Z",
      reserves: "Quelques finitions mineures sur peintures extérieures",
      leveeReserves: "2024-02-10T00:00:00.000Z"
    },
    pvDefinitif: {
      numero: "PV-DEF-2023-001",
      date: "2024-02-15T00:00:00.000Z",
      observations: "Réception définitive sans réserve"
    },
    montantFinal: 380000000,
    tauxExecution: 100,
    delaiReel: 8,
    dateFinReelle: "2024-01-28T00:00:00.000Z",
    penalitesRetard: 0,
    createdAt: "2024-01-28T09:00:00.000Z",
    updatedAt: "2024-02-15T14:30:00.000Z"
  },
  {
    id: "CLO-2023-002",
    operationId: "OP-2023-002",
    attributionId: "ATTR-2023-002",
    pvProvisoire: {
      numero: "PV-PROV-2023-002",
      date: "2023-10-20T00:00:00.000Z",
      reserves: "Ajustement de 2 équipements non conformes aux spécifications",
      leveeReserves: "2023-11-05T00:00:00.000Z"
    },
    pvDefinitif: {
      numero: "PV-DEF-2023-002",
      date: "2023-11-10T00:00:00.000Z",
      observations: "Réception définitive avec satisfaction"
    },
    montantFinal: 850000000,
    tauxExecution: 100,
    delaiReel: 6,
    dateFinReelle: "2023-10-20T00:00:00.000Z",
    penalitesRetard: 0,
    createdAt: "2023-10-20T09:00:00.000Z",
    updatedAt: "2023-11-10T16:00:00.000Z"
  },
  {
    id: "CLO-2023-004",
    operationId: "OP-2023-004",
    attributionId: "ATTR-2023-004",
    pvProvisoire: {
      numero: "PV-PROV-2023-004",
      date: "2023-09-08T00:00:00.000Z",
      reserves: null,
      leveeReserves: null
    },
    pvDefinitif: {
      numero: "PV-DEF-2023-004",
      date: "2023-09-15T00:00:00.000Z",
      observations: "Étude livrée conforme aux termes de référence"
    },
    montantFinal: 125000000,
    tauxExecution: 100,
    delaiReel: 4,
    dateFinReelle: "2023-09-08T00:00:00.000Z",
    penalitesRetard: 0,
    createdAt: "2023-09-08T09:00:00.000Z",
    updatedAt: "2023-09-15T15:00:00.000Z"
  },
  {
    id: "CLO-2023-005",
    operationId: "OP-2023-005",
    attributionId: "ATTR-2023-005",
    pvProvisoire: {
      numero: "PV-PROV-2023-005",
      date: "2023-08-10T00:00:00.000Z",
      reserves: null,
      leveeReserves: null
    },
    pvDefinitif: {
      numero: "PV-DEF-2023-005",
      date: "2023-08-20T00:00:00.000Z",
      observations: "Livraison complète et conforme"
    },
    montantFinal: 45000000,
    tauxExecution: 100,
    delaiReel: 2,
    dateFinReelle: "2023-08-10T00:00:00.000Z",
    penalitesRetard: 0,
    createdAt: "2023-08-10T09:00:00.000Z",
    updatedAt: "2023-08-20T14:00:00.000Z"
  },
  {
    id: "CLO-2023-006",
    operationId: "OP-2023-006",
    attributionId: "ATTR-2023-006",
    pvProvisoire: {
      numero: "PV-PROV-2023-006",
      date: "2024-01-20T00:00:00.000Z",
      reserves: null,
      leveeReserves: null
    },
    pvDefinitif: {
      numero: "PV-DEF-2023-006",
      date: "2024-01-30T00:00:00.000Z",
      observations: "Prestation annuelle satisfaisante"
    },
    montantFinal: 18000000,
    tauxExecution: 100,
    delaiReel: 12,
    dateFinReelle: "2024-01-20T00:00:00.000Z",
    penalitesRetard: 0,
    createdAt: "2024-01-20T09:00:00.000Z",
    updatedAt: "2024-01-30T10:00:00.000Z"
  }
];

seed.CLOTURE = clotures;
console.log(`✅ CLOTURE: ${clotures.length} entries`);

// ========================================
// ANO - 10 ANO entries
// ========================================
const anos = [
  {
    id: "ANO-2023-001",
    operationId: "OP-2023-001",
    attributionId: "ATTR-2023-001",
    numero: "ANO-DCS-2023-001",
    dateEmission: "2023-05-10T00:00:00.000Z",
    montant: 380000000,
    delai: 8,
    observations: "ANO émis conformément au marché",
    createdAt: "2023-05-10T09:00:00.000Z",
    updatedAt: "2023-05-10T14:00:00.000Z"
  },
  {
    id: "ANO-2023-002",
    operationId: "OP-2023-002",
    attributionId: "ATTR-2023-002",
    numero: "ANO-DGS-2023-002",
    dateEmission: "2023-04-25T00:00:00.000Z",
    montant: 850000000,
    delai: 6,
    observations: "ANO émis conformément au marché",
    createdAt: "2023-04-25T09:00:00.000Z",
    updatedAt: "2023-04-25T14:00:00.000Z"
  },
  {
    id: "ANO-2023-003",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    numero: "ANO-DGT-2023-003",
    dateEmission: "2023-07-25T00:00:00.000Z",
    montant: 12500000000,
    delai: 24,
    observations: "ANO émis après avis favorable CNCMP",
    createdAt: "2023-07-25T09:00:00.000Z",
    updatedAt: "2023-07-25T14:00:00.000Z"
  },
  {
    id: "ANO-2023-004",
    operationId: "OP-2023-004",
    attributionId: "ATTR-2023-004",
    numero: "ANO-DA-2023-004",
    dateEmission: "2023-05-18T00:00:00.000Z",
    montant: 125000000,
    delai: 4,
    observations: "ANO émis conformément au marché",
    createdAt: "2023-05-18T09:00:00.000Z",
    updatedAt: "2023-05-18T14:00:00.000Z"
  },
  {
    id: "ANO-2023-005",
    operationId: "OP-2023-005",
    attributionId: "ATTR-2023-005",
    numero: "ANO-DML-2023-005",
    dateEmission: "2023-06-15T00:00:00.000Z",
    montant: 45000000,
    delai: 2,
    observations: "ANO émis conformément au marché",
    createdAt: "2023-06-15T09:00:00.000Z",
    updatedAt: "2023-06-15T14:00:00.000Z"
  },
  {
    id: "ANO-2023-006",
    operationId: "OP-2023-006",
    attributionId: "ATTR-2023-006",
    numero: "ANO-DM-2023-006",
    dateEmission: "2023-03-10T00:00:00.000Z",
    montant: 18000000,
    delai: 12,
    observations: "ANO émis conformément au marché",
    createdAt: "2023-03-10T09:00:00.000Z",
    updatedAt: "2023-03-10T14:00:00.000Z"
  },
  {
    id: "ANO-2023-007",
    operationId: "OP-2023-007",
    attributionId: "ATTR-2023-007",
    numero: "ANO-DDR-2023-007",
    dateEmission: "2023-06-05T00:00:00.000Z",
    montant: 2800000000,
    delai: 18,
    observations: "ANO émis conformément au marché",
    createdAt: "2023-06-05T09:00:00.000Z",
    updatedAt: "2023-06-05T14:00:00.000Z"
  },
  {
    id: "ANO-2024-001",
    operationId: "OP-2024-001",
    attributionId: "ATTR-2024-001",
    numero: "ANO-DGMP-2024-001",
    dateEmission: "2024-04-20T00:00:00.000Z",
    montant: 250000000,
    delai: 12,
    observations: "ANO émis conformément au marché",
    createdAt: "2024-04-20T09:00:00.000Z",
    updatedAt: "2024-04-20T14:00:00.000Z"
  },
  {
    id: "ANO-2024-006",
    operationId: "OP-2024-006",
    attributionId: "ATTR-2024-006",
    numero: "ANO-DSC-2024-006",
    dateEmission: "2024-05-20T00:00:00.000Z",
    montant: 650000000,
    delai: 6,
    observations: "ANO émis conformément au marché",
    createdAt: "2024-05-20T09:00:00.000Z",
    updatedAt: "2024-05-20T14:00:00.000Z"
  },
  {
    id: "ANO-2024-007",
    operationId: "OP-2024-007",
    attributionId: "ATTR-2024-007",
    numero: "ANO-DCP-2024-007",
    dateEmission: "2024-06-12T00:00:00.000Z",
    montant: 480000000,
    delai: 10,
    observations: "ANO émis conformément au marché",
    createdAt: "2024-06-12T09:00:00.000Z",
    updatedAt: "2024-06-12T14:00:00.000Z"
  },
  {
    id: "ANO-2024-009",
    operationId: "OP-2024-009",
    attributionId: "ATTR-2024-009",
    numero: "ANO-DLP-2024-009",
    dateEmission: "2024-05-25T00:00:00.000Z",
    montant: 720000000,
    delai: 5,
    observations: "ANO émis conformément au marché",
    createdAt: "2024-05-25T09:00:00.000Z",
    updatedAt: "2024-05-25T14:00:00.000Z"
  },
  {
    id: "ANO-2024-010",
    operationId: "OP-2024-010",
    attributionId: "ATTR-2024-010",
    numero: "ANO-DAV-2024-010",
    dateEmission: "2024-04-28T00:00:00.000Z",
    montant: 1200000000,
    delai: 12,
    observations: "ANO émis conformément au marché",
    createdAt: "2024-04-28T09:00:00.000Z",
    updatedAt: "2024-04-28T14:00:00.000Z"
  }
];

seed.ANO = anos;
console.log(`✅ ANO: ${anos.length} entries`);

// ========================================
// ECHEANCIER & CLE_REPARTITION - For large projects (OP-2023-003)
// ========================================
const echeanciers = [
  {
    id: "ECH-2023-003",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    montantTotal: 14375000000,
    lignes: [
      { tranche: 1, description: "Travaux préparatoires et installations de chantier", pourcentage: 10, montant: 1437500000, datePrevisionnelle: "2023-12-01T00:00:00.000Z" },
      { tranche: 2, description: "Terrassement et drainage PK 0-25", pourcentage: 20, montant: 2875000000, datePrevisionnelle: "2024-04-01T00:00:00.000Z" },
      { tranche: 3, description: "Corps de chaussée PK 0-25", pourcentage: 15, montant: 2156250000, datePrevisionnelle: "2024-08-01T00:00:00.000Z" },
      { tranche: 4, description: "Terrassement et drainage PK 25-50", pourcentage: 20, montant: 2875000000, datePrevisionnelle: "2024-12-01T00:00:00.000Z" },
      { tranche: 5, description: "Corps de chaussée PK 25-50", pourcentage: 15, montant: 2156250000, datePrevisionnelle: "2025-04-01T00:00:00.000Z" },
      { tranche: 6, description: "Revêtement final PK 0-50 et ouvrages complémentaires", pourcentage: 15, montant: 2156250000, datePrevisionnelle: "2025-08-01T00:00:00.000Z" },
      { tranche: 7, description: "Finitions, signalisation et réception", pourcentage: 5, montant: 718750000, datePrevisionnelle: "2026-01-01T00:00:00.000Z" }
    ],
    createdAt: "2023-08-20T09:00:00.000Z",
    updatedAt: "2024-09-15T16:00:00.000Z"
  }
];

const cleRepartitions = [
  {
    id: "CLE-2023-003",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    montantTotal: 14375000000,
    bailleurs: [
      { nom: "Banque Mondiale", sigle: "BM", pourcentage: 70.00, montant: 10062500000 },
      { nom: "Trésor Public CI", sigle: "TRESOR", pourcentage: 30.00, montant: 4312500000 }
    ],
    createdAt: "2023-08-20T09:00:00.000Z",
    updatedAt: "2024-09-15T16:00:00.000Z"
  }
];

seed.ECHEANCIER = echeanciers;
seed.CLE_REPARTITION = cleRepartitions;
console.log(`✅ ECHEANCIER: ${echeanciers.length} entries`);
console.log(`✅ CLE_REPARTITION: ${cleRepartitions.length} entries`);

// ========================================
// RECOURS - 2 examples
// ========================================
const recours = [
  {
    id: "REC-2023-001",
    operationId: "OP-2023-001",
    procedureId: "PROC-2023-001",
    soumissionnaire: "ENT-004",
    dateDepot: "2023-04-08T00:00:00.000Z",
    motif: "Contestation des résultats de l'évaluation technique",
    statutRGMP: "REJETE",
    dateDecisionRGMP: "2023-04-12T00:00:00.000Z",
    observationsRGMP: "Recours non fondé - Critères d'évaluation correctement appliqués",
    createdAt: "2023-04-08T09:00:00.000Z",
    updatedAt: "2023-04-12T14:00:00.000Z"
  },
  {
    id: "REC-2024-001",
    operationId: "OP-2024-004",
    procedureId: "PROC-2024-004",
    soumissionnaire: "ENT-009",
    dateDepot: "2024-03-22T00:00:00.000Z",
    motif: "Demande de précisions sur les spécifications techniques du DAO",
    statutRGMP: "ACCEPTE",
    dateDecisionRGMP: "2024-03-25T00:00:00.000Z",
    observationsRGMP: "Report de la date limite de dépôt de 7 jours pour clarifications",
    createdAt: "2024-03-22T09:00:00.000Z",
    updatedAt: "2024-03-25T14:00:00.000Z"
  }
];

seed.RECOURS = recours;
console.log(`✅ RECOURS: ${recours.length} entries`);

// ========================================
// DOCUMENT, DECOMPTE, DIFFICULTE - Sample entries
// ========================================
seed.DOCUMENT = [];
seed.DECOMPTE = [];
seed.DIFFICULTE = [];

console.log(`✅ DOCUMENT: 0 entries (stored as Base64 in localStorage)`);
console.log(`✅ DECOMPTE: 0 entries (samples)`);
console.log(`✅ DIFFICULTE: 0 entries (samples)`);

// ========================================
// FINAL SAVE
// ========================================
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
const stats = fs.statSync(seedPath);

console.log(`\n✅ SEED DATA COMPLETE!\n`);
console.log(`📊 Final Statistics:`);
console.log(`   - PPM_PLAN: ${seed.PPM_PLAN.length}`);
console.log(`   - OPERATION: ${seed.OPERATION.length}`);
console.log(`   - BUDGET_LINE: ${seed.BUDGET_LINE.length}`);
console.log(`   - ENTREPRISE: ${seed.ENTREPRISE.length}`);
console.log(`   - GROUPEMENT: ${seed.GROUPEMENT.length}`);
console.log(`   - PROCEDURE: ${seed.PROCEDURE.length}`);
console.log(`   - RECOURS: ${seed.RECOURS.length}`);
console.log(`   - ATTRIBUTION: ${seed.ATTRIBUTION.length}`);
console.log(`   - ECHEANCIER: ${seed.ECHEANCIER.length}`);
console.log(`   - CLE_REPARTITION: ${seed.CLE_REPARTITION.length}`);
console.log(`   - VISA_CF: ${seed.VISA_CF.length}`);
console.log(`   - ORDRE_SERVICE: ${seed.ORDRE_SERVICE.length}`);
console.log(`   - AVENANT: ${seed.AVENANT.length}`);
console.log(`   - RESILIATION: ${seed.RESILIATION.length}`);
console.log(`   - GARANTIE: ${seed.GARANTIE.length}`);
console.log(`   - CLOTURE: ${seed.CLOTURE.length}`);
console.log(`   - ANO: ${seed.ANO.length}`);
console.log(`   - DOCUMENT: ${seed.DOCUMENT.length}`);
console.log(`   - DECOMPTE: ${seed.DECOMPTE.length}`);
console.log(`   - DIFFICULTE: ${seed.DIFFICULTE.length}`);
console.log(`\n💾 File: ${seedPath}`);
console.log(`📏 Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`\n✅ Ready to use: Load this file in the application!`);
