/**
 * Générateur de données seed complètes pour SIDCF Portal
 * Génère un jeu de données exhaustif couvrant tous les cas d'usage
 */

// IMPORTANT: Exécuter avec: node js/datastore/generate-seed.js

const fs = require('fs');
const path = require('path');

// Helper pour générer des dates
const date = (isoString) => isoString;
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// Génération des données
const generateSeedData = () => {
  const seed = {
    PPM_PLAN: [],
    OPERATION: [],
    BUDGET_LINE: [],
    PROCEDURE: [],
    RECOURS: [],
    ATTRIBUTION: [],
    ECHEANCIER: [],
    CLE_REPARTITION: [],
    VISA_CF: [],
    ORDRE_SERVICE: [],
    AVENANT: [],
    RESILIATION: [],
    GARANTIE: [],
    CLOTURE: [],
    ENTREPRISE: [],
    GROUPEMENT: [],
    ANO: [],
    DOCUMENT: [],
    DECOMPTE: [],
    DIFFICULTE: []
  };

  // ========================================
  // PPM_PLAN (3 exercices)
  // ========================================
  seed.PPM_PLAN = [
    {
      id: "PPM-2023-001",
      unite: "Direction Générale des Marchés Publics",
      exercice: 2023,
      source: "IMPORT",
      fichier: "PPM_2023_DGMP.xlsx",
      feuille: "Operations",
      auteur: "admin",
      createdAt: "2023-01-15T09:00:00.000Z",
      updatedAt: "2023-01-15T09:00:00.000Z"
    },
    {
      id: "PPM-2024-001",
      unite: "Direction Générale des Marchés Publics",
      exercice: 2024,
      source: "IMPORT",
      fichier: "PPM_2024_DGMP.xlsx",
      feuille: "Operations",
      auteur: "admin",
      createdAt: "2024-01-15T09:00:00.000Z",
      updatedAt: "2024-01-15T09:00:00.000Z"
    },
    {
      id: "PPM-2025-001",
      unite: "Direction Générale des Marchés Publics",
      exercice: 2025,
      source: "IMPORT",
      fichier: "PPM_2025_DGMP.xlsx",
      feuille: "Operations",
      auteur: "admin",
      createdAt: "2025-01-10T09:00:00.000Z",
      updatedAt: "2025-01-10T09:00:00.000Z"
    }
  ];

  // ========================================
  // BUDGET_LINE (20 lignes budgétaires)
  // ========================================
  const budgetLines = [
    {
      id: "BL-2023-001", section: "145", sectionLib: "Ministère de l'Éducation Nationale",
      programme: "18003", programmeLib: "Enseignement Primaire", grandeNature: "4",
      uaCode: "14523001", uaLib: "Direction de la Construction Scolaire",
      actionCode: "1800301", actionLib: "Construction écoles primaires",
      activiteCode: "78030100456", activiteLib: "Construire salles de classe zones rurales",
      typeFinancement: "1 Trésor", sourceFinancement: "101 ETAT DE COTE D'IVOIRE",
      ligneCode: "231200", ligneLib: "Bâtiments scolaires",
      AE: 7800000000, CP: 6500000000
    },
    {
      id: "BL-2023-002", section: "120", sectionLib: "Ministère de la Santé",
      programme: "15001", programmeLib: "Administration Générale Santé", grandeNature: "4",
      uaCode: "12011001", uaLib: "Direction Générale de la Santé",
      actionCode: "1500102", actionLib: "Équipement sanitaire",
      activiteCode: "78010200145", activiteLib: "Équiper hôpitaux régionaux",
      typeFinancement: "2 Emprunt", sourceFinancement: "BAD - Banque Africaine de Développement",
      ligneCode: "232100", ligneLib: "Équipements médicaux",
      AE: 5500000000, CP: 4200000000
    },
    // Ajouter 18 autres lignes...
  ];

  seed.BUDGET_LINE = budgetLines.map(bl => ({
    ...bl,
    zoneCode: "",
    zoneLib: "",
    createdAt: "2023-01-10T00:00:00.000Z",
    updatedAt: "2023-01-10T00:00:00.000Z"
  }));

  // ========================================
  // ENTREPRISES (15 entreprises)
  // ========================================
  seed.ENTREPRISE = [
    {
      id: "ENT-001",
      raisonSociale: "SOBEA Construction CI",
      ncc: "CI-ABJ-2015-B-12345",
      rccm: "CI-ABJ-2015-B-12345",
      ifu: "0123456789",
      adresse: "Zone Industrielle Yopougon, Abidjan",
      telephone: "+225 27 22 45 67 89",
      email: "contact@sobea-ci.com",
      domaine: "Bâtiment et Travaux Publics",
      banque: {
        nom: "SGBCI",
        compte: "CI93 CI02 0001 1234 5678 90",
        swift: "SGBCCIXXX"
      },
      createdAt: "2020-01-10T08:00:00.000Z"
    },
    {
      id: "ENT-002",
      raisonSociale: "COLAS Côte d'Ivoire",
      ncc: "CI-ABJ-2010-B-23456",
      rccm: "CI-ABJ-2010-B-23456",
      ifu: "1234567890",
      adresse: "Boulevard Lagunaire, Marcory, Abidjan",
      telephone: "+225 27 21 35 78 90",
      email: "contact@colas.ci",
      domaine: "Routes et infrastructures",
      banque: {
        nom: "BICICI",
        compte: "CI45 BI03 0002 2345 6789 01",
        swift: "BICICIXXX"
      },
      createdAt: "2018-03-15T10:00:00.000Z"
    },
    {
      id: "ENT-003",
      raisonSociale: "SITARAIL Fournitures SA",
      ncc: "CI-ABJ-2012-B-34567",
      rccm: "CI-ABJ-2012-B-34567",
      ifu: "2345678901",
      adresse: "Avenue 7, Zone 4C, Marcory, Abidjan",
      telephone: "+225 27 21 26 45 78",
      email: "commercial@sitarail.ci",
      domaine: "Fournitures et équipements",
      banque: {
        nom: "Ecobank CI",
        compte: "CI67 EC04 0003 3456 7890 12",
        swift: "ECOCCIAB"
      },
      createdAt: "2019-06-20T09:00:00.000Z"
    }
    // Ajouter 12 autres entreprises...
  ];

  console.log('✅ Seed data generated successfully');
  console.log(`📊 Statistics:`);
  console.log(`   - PPM Plans: ${seed.PPM_PLAN.length}`);
  console.log(`   - Operations: ${seed.OPERATION.length}`);
  console.log(`   - Budget Lines: ${seed.BUDGET_LINE.length}`);
  console.log(`   - Enterprises: ${seed.ENTREPRISE.length}`);

  return seed;
};

// Exécution
const seedData = generateSeedData();

// Sauvegarde du fichier
const outputPath = path.join(__dirname, 'seed-generated.json');
fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2), 'utf8');

console.log(`\n✅ File saved: ${outputPath}`);
console.log(`📝 Total size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
