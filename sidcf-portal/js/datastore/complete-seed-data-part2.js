#!/usr/bin/env node
/**
 * Script Part 2: Add ATTRIBUTION, VISA_CF, ORDRE_SERVICE, AVENANT, RESILIATION, GARANTIE, CLOTURE, and other entities
 * Execute with: node js/datastore/complete-seed-data-part2.js
 */

const fs = require('fs');
const path = require('path');

// Load current seed
const seedPath = path.join(__dirname, 'seed-comprehensive.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

console.log('Adding remaining entities...\n');

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
// ATTRIBUTION - 10 operations (all ATTRIBUE and beyond)
// ========================================
const attributions = [
  // OP-2023-001
  {
    id: "ATTR-2023-001",
    operationId: "OP-2023-001",
    procedureId: "PROC-2023-001",
    titulaire: { type: "ENTREPRISE", id: "ENT-001" },
    montantAttribue: 380000000,
    montantMarche: 380000000,
    delaiExecution: 8,
    dateNotification: "2023-04-15T00:00:00.000Z",
    dateSignature: "2023-04-28T00:00:00.000Z",
    numeroMarche: "2023/DCS/AOO/001",
    anoEmis: true,
    anoNumero: "ANO-2023-001",
    anoDate: "2023-05-10T00:00:00.000Z",
    createdAt: "2023-04-15T10:00:00.000Z",
    updatedAt: "2023-05-10T14:00:00.000Z"
  },

  // OP-2023-002
  {
    id: "ATTR-2023-002",
    operationId: "OP-2023-002",
    procedureId: "PROC-2023-002",
    titulaire: { type: "GROUPEMENT", id: "GRP-004" },
    montantAttribue: 850000000,
    montantMarche: 850000000,
    delaiExecution: 6,
    dateNotification: "2023-03-28T00:00:00.000Z",
    dateSignature: "2023-04-10T00:00:00.000Z",
    numeroMarche: "2023/DGS/AOO/002",
    anoEmis: true,
    anoNumero: "ANO-2023-002",
    anoDate: "2023-04-25T00:00:00.000Z",
    createdAt: "2023-03-28T10:00:00.000Z",
    updatedAt: "2023-04-25T14:00:00.000Z"
  },

  // OP-2023-003 (with avenants later)
  {
    id: "ATTR-2023-003",
    operationId: "OP-2023-003",
    procedureId: "PROC-2023-003",
    titulaire: { type: "GROUPEMENT", id: "GRP-001" },
    montantAttribue: 12500000000,
    montantMarche: 14375000000,
    delaiExecution: 24,
    dateNotification: "2023-06-25T00:00:00.000Z",
    dateSignature: "2023-07-10T00:00:00.000Z",
    numeroMarche: "2023/DGT/AOO/003",
    anoEmis: true,
    anoNumero: "ANO-2023-003",
    anoDate: "2023-07-25T00:00:00.000Z",
    createdAt: "2023-06-25T10:00:00.000Z",
    updatedAt: "2024-09-15T16:00:00.000Z"
  },

  // OP-2023-004
  {
    id: "ATTR-2023-004",
    operationId: "OP-2023-004",
    procedureId: "PROC-2023-004",
    titulaire: { type: "ENTREPRISE", id: "ENT-008" },
    montantAttribue: 125000000,
    montantMarche: 125000000,
    delaiExecution: 4,
    dateNotification: "2023-04-22T00:00:00.000Z",
    dateSignature: "2023-05-05T00:00:00.000Z",
    numeroMarche: "2023/DA/CI/004",
    anoEmis: true,
    anoNumero: "ANO-2023-004",
    anoDate: "2023-05-18T00:00:00.000Z",
    createdAt: "2023-04-22T10:00:00.000Z",
    updatedAt: "2023-05-18T14:00:00.000Z"
  },

  // OP-2023-005
  {
    id: "ATTR-2023-005",
    operationId: "OP-2023-005",
    procedureId: "PROC-2023-005",
    titulaire: { type: "ENTREPRISE", id: "ENT-010" },
    montantAttribue: 45000000,
    montantMarche: 45000000,
    delaiExecution: 2,
    dateNotification: "2023-05-25T00:00:00.000Z",
    dateSignature: "2023-06-05T00:00:00.000Z",
    numeroMarche: "2023/DML/PSD/005",
    anoEmis: true,
    anoNumero: "ANO-2023-005",
    anoDate: "2023-06-15T00:00:00.000Z",
    createdAt: "2023-05-25T10:00:00.000Z",
    updatedAt: "2023-06-15T14:00:00.000Z"
  },

  // OP-2023-006
  {
    id: "ATTR-2023-006",
    operationId: "OP-2023-006",
    procedureId: "PROC-2023-006",
    titulaire: { type: "ENTREPRISE", id: "ENT-011" },
    montantAttribue: 18000000,
    montantMarche: 18000000,
    delaiExecution: 12,
    dateNotification: "2023-02-15T00:00:00.000Z",
    dateSignature: "2023-02-25T00:00:00.000Z",
    numeroMarche: "2023/DM/PSC/006",
    anoEmis: true,
    anoNumero: "ANO-2023-006",
    anoDate: "2023-03-10T00:00:00.000Z",
    createdAt: "2023-02-15T10:00:00.000Z",
    updatedAt: "2023-03-10T14:00:00.000Z"
  },

  // OP-2023-007 (RESILIE)
  {
    id: "ATTR-2023-007",
    operationId: "OP-2023-007",
    procedureId: "PROC-2023-007",
    titulaire: { type: "ENTREPRISE", id: "ENT-002" },
    montantAttribue: 2800000000,
    montantMarche: 2450000000,
    delaiExecution: 18,
    dateNotification: "2023-05-05T00:00:00.000Z",
    dateSignature: "2023-05-20T00:00:00.000Z",
    numeroMarche: "2023/DDR/AOO/007",
    anoEmis: true,
    anoNumero: "ANO-2023-007",
    anoDate: "2023-06-05T00:00:00.000Z",
    createdAt: "2023-05-05T10:00:00.000Z",
    updatedAt: "2024-06-15T16:30:00.000Z"
  },

  // OP-2024-001 (EXECUTION with avenant)
  {
    id: "ATTR-2024-001",
    operationId: "OP-2024-001",
    procedureId: "PROC-2024-001",
    titulaire: { type: "ENTREPRISE", id: "ENT-004" },
    montantAttribue: 250000000,
    montantMarche: 307500000,
    delaiExecution: 12,
    dateNotification: "2024-03-18T00:00:00.000Z",
    dateSignature: "2024-04-05T00:00:00.000Z",
    numeroMarche: "2024/DGMP/AOO/001",
    anoEmis: true,
    anoNumero: "ANO-2024-001",
    anoDate: "2024-04-20T00:00:00.000Z",
    createdAt: "2024-03-18T10:00:00.000Z",
    updatedAt: "2024-05-15T14:30:00.000Z"
  },

  // OP-2024-002 (ATTRIBUE)
  {
    id: "ATTR-2024-002",
    operationId: "OP-2024-002",
    procedureId: "PROC-2024-002",
    titulaire: { type: "ENTREPRISE", id: "ENT-012" },
    montantAttribue: 75000000,
    montantMarche: 75000000,
    delaiExecution: 3,
    dateNotification: "2024-04-05T00:00:00.000Z",
    dateSignature: null,
    numeroMarche: null,
    anoEmis: false,
    anoNumero: null,
    anoDate: null,
    createdAt: "2024-04-05T10:00:00.000Z",
    updatedAt: "2024-04-10T11:20:00.000Z"
  },

  // OP-2024-006 (VISE)
  {
    id: "ATTR-2024-006",
    operationId: "OP-2024-006",
    procedureId: "PROC-2024-006",
    titulaire: { type: "ENTREPRISE", id: "ENT-005" },
    montantAttribue: 650000000,
    montantMarche: 650000000,
    delaiExecution: 6,
    dateNotification: "2024-04-15T00:00:00.000Z",
    dateSignature: "2024-05-05T00:00:00.000Z",
    numeroMarche: "2024/DSC/AOO/006",
    anoEmis: true,
    anoNumero: "ANO-2024-006",
    anoDate: "2024-05-20T00:00:00.000Z",
    createdAt: "2024-04-15T10:00:00.000Z",
    updatedAt: "2024-05-30T16:00:00.000Z"
  },

  // OP-2024-007 (EXECUTION with avenant)
  {
    id: "ATTR-2024-007",
    operationId: "OP-2024-007",
    procedureId: "PROC-2024-007",
    titulaire: { type: "ENTREPRISE", id: "ENT-006" },
    montantAttribue: 480000000,
    montantMarche: 576000000,
    delaiExecution: 10,
    dateNotification: "2024-05-10T00:00:00.000Z",
    dateSignature: "2024-05-28T00:00:00.000Z",
    numeroMarche: "2024/DCP/AOO/007",
    anoEmis: true,
    anoNumero: "ANO-2024-007",
    anoDate: "2024-06-12T00:00:00.000Z",
    createdAt: "2024-05-10T10:00:00.000Z",
    updatedAt: "2024-08-15T14:00:00.000Z"
  },

  // OP-2024-008 (EN_PROC - added procedure)
  {
    id: "ATTR-2024-008",
    operationId: "OP-2024-008",
    procedureId: "PROC-2024-008",
    titulaire: { type: "GROUPEMENT", id: "GRP-005" },
    montantAttribue: 890000000,
    montantMarche: 890000000,
    delaiExecution: 8,
    dateNotification: "2024-05-05T00:00:00.000Z",
    dateSignature: null,
    numeroMarche: null,
    anoEmis: false,
    anoNumero: null,
    anoDate: null,
    createdAt: "2024-05-05T10:00:00.000Z",
    updatedAt: "2024-05-15T11:00:00.000Z"
  },

  // OP-2024-009 (VISE)
  {
    id: "ATTR-2024-009",
    operationId: "OP-2024-009",
    procedureId: "PROC-2024-009",
    titulaire: { type: "ENTREPRISE", id: "ENT-013" },
    montantAttribue: 720000000,
    montantMarche: 720000000,
    delaiExecution: 5,
    dateNotification: "2024-04-20T00:00:00.000Z",
    dateSignature: "2024-05-08T00:00:00.000Z",
    numeroMarche: "2024/DLP/AOO/009",
    anoEmis: true,
    anoNumero: "ANO-2024-009",
    anoDate: "2024-05-25T00:00:00.000Z",
    createdAt: "2024-04-20T10:00:00.000Z",
    updatedAt: "2024-06-10T15:30:00.000Z"
  },

  // OP-2024-010 (RESILIE)
  {
    id: "ATTR-2024-010",
    operationId: "OP-2024-010",
    procedureId: "PROC-2024-010",
    titulaire: { type: "GROUPEMENT", id: "GRP-002" },
    montantAttribue: 1200000000,
    montantMarche: 1020000000,
    delaiExecution: 12,
    dateNotification: "2024-03-20T00:00:00.000Z",
    dateSignature: "2024-04-10T00:00:00.000Z",
    numeroMarche: "2024/DAV/AOO/010",
    anoEmis: true,
    anoNumero: "ANO-2024-010",
    anoDate: "2024-04-28T00:00:00.000Z",
    createdAt: "2024-03-20T10:00:00.000Z",
    updatedAt: "2024-09-05T16:45:00.000Z"
  }
];

// Add missing PROCEDURE entries for OP-2024-006 through OP-2024-010
const additionalProcedures = [
  {
    id: "PROC-2024-006",
    operationId: "OP-2024-006",
    modePassation: "AOO",
    type: "FOURNITURES",
    datePublication: "2024-02-01T00:00:00.000Z",
    dateLimiteDepot: "2024-03-10T17:00:00.000Z",
    dateOuverturePlis: "2024-03-11T09:00:00.000Z",
    lieuDepot: "Direction de la Sécurité Civile, Abidjan-Marcory",
    lieuOuverture: "Salle des marchés, DSC",
    montantCautionnement: 13000000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Qualité équipements", ponderation: 30 },
      { libelle: "Garanties et SAV", ponderation: 20 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-005", montant: 650000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-003", montant: 685000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-03-11T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-03-11T10:30:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-03-25T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2024-04-05T11:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-005",
    dateAttributionProvisoire: "2024-04-05T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2024-02-01T09:00:00.000Z",
    updatedAt: "2024-04-05T16:00:00.000Z"
  },
  {
    id: "PROC-2024-007",
    operationId: "OP-2024-007",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2024-02-25T00:00:00.000Z",
    dateLimiteDepot: "2024-04-05T17:00:00.000Z",
    dateOuverturePlis: "2024-04-08T09:00:00.000Z",
    lieuDepot: "Direction de la Construction Pénitentiaire, Abidjan-Yopougon",
    lieuOuverture: "Salle des marchés, DCP",
    montantCautionnement: 9600000,
    criteres: [
      { libelle: "Prix", ponderation: 55 },
      { libelle: "Délai", ponderation: 25 },
      { libelle: "Expérience", ponderation: 20 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-006", montant: 480000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-004", montant: 495000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-04-08T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-04-08T10:30:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-04-22T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2024-04-30T11:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-006",
    dateAttributionProvisoire: "2024-04-30T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2024-02-25T09:00:00.000Z",
    updatedAt: "2024-04-30T16:00:00.000Z"
  },
  {
    id: "PROC-2024-008",
    operationId: "OP-2024-008",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2024-03-15T00:00:00.000Z",
    dateLimiteDepot: "2024-04-20T17:00:00.000Z",
    dateOuverturePlis: "2024-04-22T09:00:00.000Z",
    lieuDepot: "Direction des Énergies Renouvelables, Grand-Bassam",
    lieuOuverture: "Salle des marchés, DER",
    montantCautionnement: 17800000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Qualité panneaux", ponderation: 30 },
      { libelle: "Expérience solaire", ponderation: 20 }
    ],
    soumissionnaires: [
      { groupementId: "GRP-005", montant: 890000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-014", montant: 925000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-04-22T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-04-22T11:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-05-03T14:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "GRP-005",
    dateAttributionProvisoire: "2024-05-03T00:00:00.000Z",
    etat: "EN_ATTRIBUTION",
    createdAt: "2024-03-15T09:00:00.000Z",
    updatedAt: "2024-05-15T11:00:00.000Z"
  },
  {
    id: "PROC-2024-009",
    operationId: "OP-2024-009",
    modePassation: "AOO",
    type: "FOURNITURES",
    datePublication: "2024-02-05T00:00:00.000Z",
    dateLimiteDepot: "2024-03-15T17:00:00.000Z",
    dateOuverturePlis: "2024-03-18T09:00:00.000Z",
    lieuDepot: "Direction de la Lutte contre le Paludisme, Soubré",
    lieuOuverture: "Salle des marchés, DLP",
    montantCautionnement: 14400000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Qualité moustiquaires", ponderation: 35 },
      { libelle: "Délai livraison", ponderation: 15 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-013", montant: 720000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-005", montant: 755000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-03-18T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-03-18T10:30:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-04-02T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2024-04-12T11:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-013",
    dateAttributionProvisoire: "2024-04-12T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2024-02-05T09:00:00.000Z",
    updatedAt: "2024-04-12T16:00:00.000Z"
  },
  {
    id: "PROC-2024-010",
    operationId: "OP-2024-010",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2024-01-15T00:00:00.000Z",
    dateLimiteDepot: "2024-02-25T17:00:00.000Z",
    dateOuverturePlis: "2024-02-26T09:00:00.000Z",
    lieuDepot: "Direction de l'Agriculture Vivrière, Bondoukou",
    lieuOuverture: "Salle des marchés, DAV",
    montantCautionnement: 24000000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Expérience aménagements", ponderation: 30 },
      { libelle: "Moyens techniques", ponderation: 20 }
    ],
    soumissionnaires: [
      { groupementId: "GRP-002", montant: 1200000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-015", montant: 1280000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-02-26T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-02-26T11:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-03-08T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2024-03-15T11:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "GRP-002",
    dateAttributionProvisoire: "2024-03-15T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2024-03-15T16:00:00.000Z"
  },
  {
    id: "PROC-2025-003",
    operationId: "OP-2025-003",
    modePassation: "PSO",
    type: "SERVICES_INTELLECTUELS",
    datePublication: "2025-02-05T00:00:00.000Z",
    dateLimiteDepot: "2025-03-05T17:00:00.000Z",
    dateOuverturePlis: "2025-03-06T09:00:00.000Z",
    lieuDepot: "Direction de la Protection Civile, Abidjan-Port-Bouët",
    lieuOuverture: "Bureau direction",
    montantCautionnement: 840000,
    criteres: [
      { libelle: "Qualifications formateurs", ponderation: 40 },
      { libelle: "Méthodologie", ponderation: 35 },
      { libelle: "Prix", ponderation: 25 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-008", montant: 42000000, conforme: true, classement: 1 }
    ],
    pvs: [
      { type: "DEPOT", date: "2025-03-06T09:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2025-03-12T14:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: null,
    dateAttributionProvisoire: null,
    etat: "EN_ANALYSE",
    createdAt: "2025-02-05T09:00:00.000Z",
    updatedAt: "2025-03-15T11:00:00.000Z"
  }
];

seed.PROCEDURE.push(...additionalProcedures);
seed.ATTRIBUTION = attributions;

console.log(`✅ PROCEDURE: ${seed.PROCEDURE.length} entries (added ${additionalProcedures.length} more)`);
console.log(`✅ ATTRIBUTION: ${attributions.length} entries`);

// ========================================
// VISA_CF - 9 operations (all VISE and beyond: OP-2023-001 through OP-2023-007, OP-2024-001, OP-2024-006, OP-2024-007, OP-2024-009)
// ========================================
const visas = [
  {
    id: "VISA-2023-001",
    operationId: "OP-2023-001",
    attributionId: "ATTR-2023-001",
    dateDepot: "2023-05-15T00:00:00.000Z",
    dateVisa: "2023-05-25T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/001",
    observations: "Visa accordé sans réserve",
    montantVise: 380000000,
    delaiVise: 8,
    viseur: "Jean-Baptiste KOFFI",
    fonction: "Contrôleur Financier",
    createdAt: "2023-05-15T09:00:00.000Z",
    updatedAt: "2023-05-25T14:00:00.000Z"
  },
  {
    id: "VISA-2023-002",
    operationId: "OP-2023-002",
    attributionId: "ATTR-2023-002",
    dateDepot: "2023-04-28T00:00:00.000Z",
    dateVisa: "2023-05-08T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/002",
    observations: "Visa accordé avec réserve sur le délai de livraison",
    montantVise: 850000000,
    delaiVise: 6,
    viseur: "Marie-Thérèse BROU",
    fonction: "Contrôleuse Financière",
    createdAt: "2023-04-28T09:00:00.000Z",
    updatedAt: "2023-05-08T14:00:00.000Z"
  },
  {
    id: "VISA-2023-003",
    operationId: "OP-2023-003",
    attributionId: "ATTR-2023-003",
    dateDepot: "2023-07-28T00:00:00.000Z",
    dateVisa: "2023-08-15T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/003",
    observations: "Visa accordé - Montant supérieur à 10 milliards, avis CNCMP requis",
    montantVise: 12500000000,
    delaiVise: 24,
    viseur: "Amadou TOURE",
    fonction: "Contrôleur Financier Chef",
    createdAt: "2023-07-28T09:00:00.000Z",
    updatedAt: "2023-08-15T16:00:00.000Z"
  },
  {
    id: "VISA-2023-004",
    operationId: "OP-2023-004",
    attributionId: "ATTR-2023-004",
    dateDepot: "2023-05-22T00:00:00.000Z",
    dateVisa: "2023-06-02T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/004",
    observations: "Visa accordé sans réserve",
    montantVise: 125000000,
    delaiVise: 4,
    viseur: "Jean-Baptiste KOFFI",
    fonction: "Contrôleur Financier",
    createdAt: "2023-05-22T09:00:00.000Z",
    updatedAt: "2023-06-02T14:00:00.000Z"
  },
  {
    id: "VISA-2023-005",
    operationId: "OP-2023-005",
    attributionId: "ATTR-2023-005",
    dateDepot: "2023-06-18T00:00:00.000Z",
    dateVisa: "2023-06-25T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/005",
    observations: "Visa accordé sans réserve",
    montantVise: 45000000,
    delaiVise: 2,
    viseur: "Marie-Thérèse BROU",
    fonction: "Contrôleuse Financière",
    createdAt: "2023-06-18T09:00:00.000Z",
    updatedAt: "2023-06-25T14:00:00.000Z"
  },
  {
    id: "VISA-2023-006",
    operationId: "OP-2023-006",
    attributionId: "ATTR-2023-006",
    dateDepot: "2023-03-15T00:00:00.000Z",
    dateVisa: "2023-03-25T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/006",
    observations: "Visa accordé sans réserve",
    montantVise: 18000000,
    delaiVise: 12,
    viseur: "Jean-Baptiste KOFFI",
    fonction: "Contrôleur Financier",
    createdAt: "2023-03-15T09:00:00.000Z",
    updatedAt: "2023-03-25T14:00:00.000Z"
  },
  {
    id: "VISA-2023-007",
    operationId: "OP-2023-007",
    attributionId: "ATTR-2023-007",
    dateDepot: "2023-06-08T00:00:00.000Z",
    dateVisa: "2023-06-20T00:00:00.000Z",
    numeroVisa: "VISA/CF/2023/007",
    observations: "Visa accordé sans réserve",
    montantVise: 2800000000,
    delaiVise: 18,
    viseur: "Amadou TOURE",
    fonction: "Contrôleur Financier Chef",
    createdAt: "2023-06-08T09:00:00.000Z",
    updatedAt: "2023-06-20T14:00:00.000Z"
  },
  {
    id: "VISA-2024-001",
    operationId: "OP-2024-001",
    attributionId: "ATTR-2024-001",
    dateDepot: "2024-04-25T00:00:00.000Z",
    dateVisa: "2024-05-08T00:00:00.000Z",
    numeroVisa: "VISA/CF/2024/001",
    observations: "Visa accordé sans réserve",
    montantVise: 250000000,
    delaiVise: 12,
    viseur: "Marie-Thérèse BROU",
    fonction: "Contrôleuse Financière",
    createdAt: "2024-04-25T09:00:00.000Z",
    updatedAt: "2024-05-08T14:00:00.000Z"
  },
  {
    id: "VISA-2024-006",
    operationId: "OP-2024-006",
    attributionId: "ATTR-2024-006",
    dateDepot: "2024-05-22T00:00:00.000Z",
    dateVisa: null,
    numeroVisa: null,
    observations: "Dossier en cours d'instruction",
    montantVise: null,
    delaiVise: null,
    viseur: "Amadou TOURE",
    fonction: "Contrôleur Financier Chef",
    createdAt: "2024-05-22T09:00:00.000Z",
    updatedAt: "2024-05-30T16:00:00.000Z"
  },
  {
    id: "VISA-2024-007",
    operationId: "OP-2024-007",
    attributionId: "ATTR-2024-007",
    dateDepot: "2024-06-15T00:00:00.000Z",
    dateVisa: "2024-06-28T00:00:00.000Z",
    numeroVisa: "VISA/CF/2024/007",
    observations: "Visa accordé sans réserve",
    montantVise: 480000000,
    delaiVise: 10,
    viseur: "Jean-Baptiste KOFFI",
    fonction: "Contrôleur Financier",
    createdAt: "2024-06-15T09:00:00.000Z",
    updatedAt: "2024-06-28T14:00:00.000Z"
  },
  {
    id: "VISA-2024-009",
    operationId: "OP-2024-009",
    attributionId: "ATTR-2024-009",
    dateDepot: "2024-05-28T00:00:00.000Z",
    dateVisa: null,
    numeroVisa: null,
    observations: "Dossier en cours d'instruction",
    montantVise: null,
    delaiVise: null,
    viseur: "Marie-Thérèse BROU",
    fonction: "Contrôleuse Financière",
    createdAt: "2024-05-28T09:00:00.000Z",
    updatedAt: "2024-06-10T15:30:00.000Z"
  }
];

seed.VISA_CF = visas;
console.log(`✅ VISA_CF: ${visas.length} entries`);

// Save progress
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
console.log(`\n💾 Progress saved. Run part 3 for ORDRE_SERVICE, AVENANT, RESILIATION, GARANTIE, CLOTURE...\n`);
