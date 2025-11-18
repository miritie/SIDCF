#!/usr/bin/env node
/**
 * Script to complete seed-comprehensive.json with all missing entities
 * Execute with: node js/datastore/complete-seed-data.js
 */

const fs = require('fs');
const path = require('path');

// Load current seed
const seedPath = path.join(__dirname, 'seed-comprehensive.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

console.log('Completing seed data with all entities...\n');

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
// PROCEDURE - 11 operations with procedures
// ========================================
const procedures = [
  // OP-2023-001 (CLOS)
  {
    id: "PROC-2023-001",
    operationId: "OP-2023-001",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2023-02-15T00:00:00.000Z",
    dateLimiteDepot: "2023-03-20T17:00:00.000Z",
    dateOuverturePlis: "2023-03-21T09:00:00.000Z",
    lieuDepot: "Direction de la Construction Scolaire, Abidjan-Plateau",
    lieuOuverture: "Salle des marchés, Plateau",
    montantCautionnement: 7600000,
    criteres: [
      { libelle: "Prix", ponderation: 60 },
      { libelle: "Délai", ponderation: 20 },
      { libelle: "Qualifications", ponderation: 20 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-001", montant: 380000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-004", montant: 395000000, conforme: true, classement: 2 },
      { entrepriseId: "ENT-006", montant: 410000000, conforme: true, classement: 3 }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-03-21T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2023-03-21T10:30:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2023-03-28T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-04-05T11:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-001",
    dateAttributionProvisoire: "2023-04-05T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-02-15T09:00:00.000Z",
    updatedAt: "2023-04-05T16:00:00.000Z"
  },

  // OP-2023-002 (CLOS)
  {
    id: "PROC-2023-002",
    operationId: "OP-2023-002",
    modePassation: "AOO",
    type: "FOURNITURES",
    datePublication: "2023-01-25T00:00:00.000Z",
    dateLimiteDepot: "2023-03-01T17:00:00.000Z",
    dateOuverturePlis: "2023-03-02T09:00:00.000Z",
    lieuDepot: "Direction Générale de la Santé, Abidjan-Cocody",
    lieuOuverture: "Salle des marchés, DGS",
    montantCautionnement: 17000000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Qualité technique", ponderation: 30 },
      { libelle: "Garanties", ponderation: 20 }
    ],
    soumissionnaires: [
      { groupementId: "GRP-004", montant: 850000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-005", montant: 880000000, conforme: true, classement: 2 },
      { entrepriseId: "ENT-003", montant: 920000000, conforme: false, classement: null }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-03-02T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2023-03-02T11:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2023-03-15T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-03-22T10:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "GRP-004",
    dateAttributionProvisoire: "2023-03-22T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-01-25T09:00:00.000Z",
    updatedAt: "2023-03-22T15:00:00.000Z"
  },

  // OP-2023-003 (EXECUTION) - Major project
  {
    id: "PROC-2023-003",
    operationId: "OP-2023-003",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2023-03-20T00:00:00.000Z",
    dateLimiteDepot: "2023-05-10T17:00:00.000Z",
    dateOuverturePlis: "2023-05-11T09:00:00.000Z",
    lieuDepot: "Direction des Grands Travaux, Abidjan-Plateau",
    lieuOuverture: "Salle des marchés, DGT",
    montantCautionnement: 250000000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Délai d'exécution", ponderation: 25 },
      { libelle: "Expérience similaire", ponderation: 15 },
      { libelle: "Moyens techniques", ponderation: 10 }
    ],
    soumissionnaires: [
      { groupementId: "GRP-001", montant: 12500000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-002", montant: 13200000000, conforme: true, classement: 2 },
      { groupementId: "GRP-003", montant: 13800000000, conforme: true, classement: 3 }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-05-11T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2023-05-11T14:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2023-06-05T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-06-20T10:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "GRP-001",
    dateAttributionProvisoire: "2023-06-20T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-03-20T09:00:00.000Z",
    updatedAt: "2023-06-20T16:00:00.000Z"
  },

  // OP-2023-004 (CLOS)
  {
    id: "PROC-2023-004",
    operationId: "OP-2023-004",
    modePassation: "CI",
    type: "SERVICES_INTELLECTUELS",
    datePublication: "2023-03-01T00:00:00.000Z",
    dateLimiteDepot: "2023-03-31T17:00:00.000Z",
    dateOuverturePlis: "2023-04-03T09:00:00.000Z",
    lieuDepot: "Direction de l'Assainissement, Abidjan-Yopougon",
    lieuOuverture: "Bureau du directeur",
    montantCautionnement: 2500000,
    criteres: [
      { libelle: "Qualifications consultant", ponderation: 40 },
      { libelle: "Méthodologie", ponderation: 35 },
      { libelle: "Prix", ponderation: 25 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-008", montant: 125000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-008", montant: 138000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-04-03T09:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2023-04-12T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-04-18T10:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-008",
    dateAttributionProvisoire: "2023-04-18T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-03-01T09:00:00.000Z",
    updatedAt: "2023-04-18T14:00:00.000Z"
  },

  // OP-2023-005 (CLOS)
  {
    id: "PROC-2023-005",
    operationId: "OP-2023-005",
    modePassation: "PSD",
    type: "FOURNITURES",
    datePublication: "2023-04-15T00:00:00.000Z",
    dateLimiteDepot: "2023-05-10T17:00:00.000Z",
    dateOuverturePlis: "2023-05-11T09:00:00.000Z",
    lieuDepot: "Direction du Matériel, Abidjan-Plateau",
    lieuOuverture: "Salle des marchés",
    montantCautionnement: 900000,
    criteres: [
      { libelle: "Prix", ponderation: 70 },
      { libelle: "Délai livraison", ponderation: 30 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-010", montant: 45000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-003", montant: 47500000, conforme: true, classement: 2 },
      { entrepriseId: "ENT-010", montant: 49000000, conforme: true, classement: 3 }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-05-11T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2023-05-11T10:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2023-05-16T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-05-20T10:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-010",
    dateAttributionProvisoire: "2023-05-20T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-04-15T09:00:00.000Z",
    updatedAt: "2023-05-20T15:00:00.000Z"
  },

  // OP-2023-006 (CLOS)
  {
    id: "PROC-2023-006",
    operationId: "OP-2023-006",
    modePassation: "PSC",
    type: "SERVICES_COURANTS",
    datePublication: "2023-01-10T00:00:00.000Z",
    dateLimiteDepot: "2023-02-05T17:00:00.000Z",
    dateOuverturePlis: "2023-02-06T09:00:00.000Z",
    lieuDepot: "Direction de la Maintenance, Abidjan-Plateau",
    lieuOuverture: "Bureau direction",
    montantCautionnement: 360000,
    criteres: [
      { libelle: "Prix", ponderation: 60 },
      { libelle: "Expérience", ponderation: 40 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-011", montant: 18000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-011", montant: 19500000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-02-06T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2023-02-06T10:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-02-10T14:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-011",
    dateAttributionProvisoire: "2023-02-10T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-01-10T09:00:00.000Z",
    updatedAt: "2023-02-10T16:00:00.000Z"
  },

  // OP-2023-007 (RESILIE)
  {
    id: "PROC-2023-007",
    operationId: "OP-2023-007",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2023-02-05T00:00:00.000Z",
    dateLimiteDepot: "2023-03-20T17:00:00.000Z",
    dateOuverturePlis: "2023-03-21T09:00:00.000Z",
    lieuDepot: "Direction du Développement Rural, Abidjan-Plateau",
    lieuOuverture: "Salle des marchés",
    montantCautionnement: 56000000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Expérience ponts", ponderation: 30 },
      { libelle: "Moyens techniques", ponderation: 20 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-002", montant: 2800000000, conforme: true, classement: 1 },
      { groupementId: "GRP-001", montant: 2950000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2023-03-21T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2023-03-21T11:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2023-04-10T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2023-04-25T10:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-002",
    dateAttributionProvisoire: "2023-04-25T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2023-02-05T09:00:00.000Z",
    updatedAt: "2023-04-25T15:00:00.000Z"
  },

  // OP-2024-001 (EXECUTION)
  {
    id: "PROC-2024-001",
    operationId: "OP-2024-001",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2024-01-25T00:00:00.000Z",
    dateLimiteDepot: "2024-02-25T17:00:00.000Z",
    dateOuverturePlis: "2024-02-26T09:00:00.000Z",
    lieuDepot: "Direction Générale des Marchés Publics, Abidjan-Plateau",
    lieuOuverture: "Salle des marchés, DGMP",
    montantCautionnement: 5000000,
    criteres: [
      { libelle: "Prix", ponderation: 60 },
      { libelle: "Délai", ponderation: 25 },
      { libelle: "Qualifications", ponderation: 15 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-004", montant: 250000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-001", montant: 268000000, conforme: true, classement: 2 },
      { entrepriseId: "ENT-006", montant: 275000000, conforme: true, classement: 3 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-02-26T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-02-26T10:30:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-03-05T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2024-03-12T11:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-004",
    dateAttributionProvisoire: "2024-03-12T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2024-01-25T09:00:00.000Z",
    updatedAt: "2024-03-12T16:00:00.000Z"
  },

  // OP-2024-002 (ATTRIBUE)
  {
    id: "PROC-2024-002",
    operationId: "OP-2024-002",
    modePassation: "PSD",
    type: "FOURNITURES",
    datePublication: "2024-02-05T00:00:00.000Z",
    dateLimiteDepot: "2024-03-05T17:00:00.000Z",
    dateOuverturePlis: "2024-03-06T09:00:00.000Z",
    lieuDepot: "Direction du Matériel Roulant, Abidjan-Plateau",
    lieuOuverture: "Salle des marchés",
    montantCautionnement: 1500000,
    criteres: [
      { libelle: "Prix", ponderation: 50 },
      { libelle: "Qualité véhicules", ponderation: 30 },
      { libelle: "SAV et garanties", ponderation: 20 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-012", montant: 75000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-012", montant: 78000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-03-06T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-03-06T10:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-03-20T14:00:00.000Z", documentId: null },
      { type: "JUGEMENT", date: "2024-03-28T10:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: "ENT-012",
    dateAttributionProvisoire: "2024-03-28T00:00:00.000Z",
    etat: "ATTRIBUE",
    createdAt: "2024-02-05T09:00:00.000Z",
    updatedAt: "2024-03-28T15:00:00.000Z"
  },

  // OP-2024-004 (EN_PROC)
  {
    id: "PROC-2024-004",
    operationId: "OP-2024-004",
    modePassation: "AOO",
    type: "TRAVAUX",
    datePublication: "2024-01-20T00:00:00.000Z",
    dateLimiteDepot: "2024-03-05T17:00:00.000Z",
    dateOuverturePlis: "2024-03-06T09:00:00.000Z",
    lieuDepot: "Direction de l'Hydraulique Rurale, Man",
    lieuOuverture: "Salle des marchés, DHR",
    montantCautionnement: 6400000,
    criteres: [
      { libelle: "Prix", ponderation: 55 },
      { libelle: "Expérience forages", ponderation: 25 },
      { libelle: "Moyens techniques", ponderation: 20 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-009", montant: 320000000, conforme: true, classement: 1 },
      { entrepriseId: "ENT-009", montant: 335000000, conforme: true, classement: 2 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-03-06T09:00:00.000Z", documentId: null },
      { type: "OUVERTURE", date: "2024-03-06T10:30:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-03-18T14:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: null,
    dateAttributionProvisoire: null,
    etat: "EN_ANALYSE",
    createdAt: "2024-01-20T09:00:00.000Z",
    updatedAt: "2024-03-20T15:00:00.000Z"
  },

  // OP-2024-005 (EN_PROC)
  {
    id: "PROC-2024-005",
    operationId: "OP-2024-005",
    modePassation: "PSO",
    type: "SERVICES_INTELLECTUELS",
    datePublication: "2024-02-15T00:00:00.000Z",
    dateLimiteDepot: "2024-03-20T17:00:00.000Z",
    dateOuverturePlis: "2024-03-21T09:00:00.000Z",
    lieuDepot: "Direction de la Formation Professionnelle, Abidjan-Cocody",
    lieuOuverture: "Bureau direction",
    montantCautionnement: 700000,
    criteres: [
      { libelle: "Qualifications formateurs", ponderation: 40 },
      { libelle: "Méthodologie", ponderation: 35 },
      { libelle: "Prix", ponderation: 25 }
    ],
    soumissionnaires: [
      { entrepriseId: "ENT-008", montant: 35000000, conforme: true, classement: 1 }
    ],
    pvs: [
      { type: "DEPOT", date: "2024-03-21T09:00:00.000Z", documentId: null },
      { type: "ANALYSE", date: "2024-04-02T14:00:00.000Z", documentId: null }
    ],
    attributaireProvisoire: null,
    dateAttributionProvisoire: null,
    etat: "EN_ANALYSE",
    createdAt: "2024-02-15T09:00:00.000Z",
    updatedAt: "2024-04-05T12:00:00.000Z"
  }
];

seed.PROCEDURE = procedures;
console.log(`✅ PROCEDURE: ${procedures.length} entries`);

// Continue with other arrays in next section...
// Save intermediate progress
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
console.log(`\n💾 Progress saved to ${seedPath}`);
console.log('Run part 2 script to add ATTRIBUTION and remaining entities...');
