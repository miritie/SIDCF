/* ============================================
   ECR01A - Import PPM (Excel)

   Modif #146 — Refonte « simulation » (retour client, CHARGEMENT DES PPM) :
   1. Téléchargement d'un fichier modèle Excel (.xlsx généré sans dépendance,
      zip « stored » + feuille inlineStr), aligné sur les colonnes du tableau
      PPM de la liste (ECR01B). Le modèle réel évoluera ; celui-ci sert de
      référence de conformité pour la simulation.
   2. Import SIMULÉ : si le fichier chargé est conforme au document type
      (.xlsx/.xls par signature binaire, .csv par entêtes), on génère un
      contenu cohérent à l'image du tableau des PPM — AUCUNE donnée n'est
      enregistrée en base.
   3. Récap des éléments chargés (cartes + répartitions).
   4. Mise en évidence des écarts de soutenabilité budgétaire
      (montant prévisionnel > dotation disponible de la ligne budgétaire).
   5. Rapport d'erreurs NON BLOQUANT, téléchargeable (CSV).
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { formField, formActions } from '../../../ui/widgets/form.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { money } from '../../../lib/format.js';

/* ------------------------------------------------------------------ */
/* Modèle type — Modif #147 : colonnes alignées sur l'écran « Créer    */
/* ligne PPM » (ECR01D), que l'import doit pouvoir alimenter champ à   */
/* champ. Pour chaque information référentielle, DEUX colonnes : le    */
/* CODE (clé qui ramène au référentiel en base : registries,           */
/* chaîne budgétaire, régions CI…) et le LIBELLÉ (lecture humaine,     */
/* contrôle de cohérence). Les champs multiples (financements,         */
/* bailleurs, livrables) sont séparés par « ; ». L'imputation          */
/* budgétaire n'apparaît pas : elle est calculée par l'écran à partir  */
/* de la chaîne (section / programme / UA / nature).                   */
/* ------------------------------------------------------------------ */

const TEMPLATE_COLUMNS = [
  // — Chaîne programmatique / imputation budgétaire (ECR01D, bloc 1)
  'Exercice',
  'Code section (ministère)',
  'Libellé section',
  'Code programme',
  'Libellé programme',
  'Code unité administrative (UA)',
  'Libellé unité administrative',
  'Code activité',
  'Libellé activité',
  'Code nature économique',
  'Libellé nature économique',
  // — Identification du marché (bloc 2)
  'Objet du marché',
  'Code type de marché',
  'Libellé type de marché',
  'Code mode de passation',
  'Libellé mode de passation',
  'Code revue',
  'Libellé revue',
  'Code nature des prix',
  'Libellé nature des prix',
  // — Informations financières (bloc 3)
  'Montant prévisionnel (F CFA)',
  'Code(s) type de financement (séparés par ;)',
  'Libellé(s) type de financement',
  'Code(s) bailleur (séparés par ;)',
  'Libellé(s) bailleur',
  // — Information technique prévisionnelle (bloc 4)
  'Délai d\'exécution (jours)',
  'Code catégorie de prestation',
  'Libellé catégorie de prestation',
  'Bénéficiaire',
  // — Localisation (bloc 5)
  'Code région',
  'Libellé région',
  'Département',
  'Sous-préfecture',
  'Localité',
  'Longitude',
  'Latitude',
  // — Livrables (bloc 6)
  'Livrables (séparés par ;)'
];

// Deux lignes d'exemple : chaque code provient des référentiels réellement
// en base (registries.json : CHAINE_BUDGETAIRE, TYPE_MARCHE, MODE_PASSATION,
// TYPE_REVUE, NATURE_PRIX, TYPE_FINANCEMENT, BAILLEUR, CATEGORIE_PRESTATION,
// NATURE_ECO ; ua-activites.json ; mp-regions-ci.json).
const TEMPLATE_EXAMPLE_ROWS = [
  [
    2026,
    '13030016', 'Sénat',
    '110101', 'Sous-préfecture 1303001',
    '13030', 'Assemblée N 3 Biens et services',
    'ACT_13030_005', 'Fournitures de bureau',
    '232', '232 - Équipements et matériels',
    'Acquisition de fournitures de bureau pour les services centraux',
    'MARCHE_FOURN_EQUIP', 'Marchés de fournitures et équipements',
    'PSC', 'Procédure Simplifiée de demande de Cotation (PSC)',
    'A_POSTERIORI', 'A posteriori (Contrôle après signature)',
    'UNITAIRE', 'Prix Unitaire',
    18500000,
    'ETAT', 'Budget de l\'État',
    'TRESOR', 'Trésor Public (CI)',
    90,
    'FOURNITURE', 'Fourniture',
    'Services centraux DCF',
    'ABIDJAN', 'District Autonome d\'Abidjan',
    'Abidjan', 'Abidjan', 'Plateau',
    '-4.0167', '5.3364',
    'Lot de fournitures de bureau'
  ],
  [
    2026,
    '13030016', 'Sénat',
    '110101', 'Sous-préfecture 1303001',
    '13030', 'Assemblée N 3 Biens et services',
    'ACT_13030_001', 'Construction de bâtiments administratifs',
    '231', '231 - Constructions',
    'Construction d\'un bâtiment administratif annexe à Bouaké',
    'MARCHE_TRAVAUX', 'Marchés de travaux',
    'AOO', 'Appel d\'Offres Ouvert (AOO)',
    'A_PRIORI', 'A priori (Visa CF obligatoire avant signature)',
    'FORFAITAIRE', 'Prix Forfaitaire',
    240000000,
    'ETAT;EMPRUNT', 'Budget de l\'État;Emprunt',
    'TRESOR;BAD', 'Trésor Public (CI);Banque Africaine de Développement (BAD)',
    240,
    'INFRASTRUCTURE', 'Infrastructure',
    'Population de la région de Gbêkê',
    'GBEKE', 'Gbêkê',
    'Bouaké', 'Bouaké', 'Bouaké centre',
    '-5.0301', '7.6939',
    'Bâtiment R+1;Parking;Voirie et réseaux divers'
  ]
];

/* ------------------------------------------------------------------ */
/* Générateur .xlsx minimal (zip « stored », cellules inlineStr)       */
/* Aucune dépendance : CRC-32 + structure ZIP écrites à la main.       */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** Construit un ZIP sans compression (méthode 0 « stored »). */
function buildStoredZip(entries) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  const u16 = (v) => new Uint8Array([v & 0xFF, (v >> 8) & 0xFF]);
  const u32 = (v) => new Uint8Array([v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF]);

  for (const { name, content } of entries) {
    const nameB = enc.encode(name);
    const data = typeof content === 'string' ? enc.encode(content) : content;
    const crc = crc32(data);
    // Local file header
    const header = [u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameB.length), u16(0)];
    chunks.push(...header, nameB, data);
    central.push({ nameB, crc, size: data.length, offset });
    offset += header.reduce((s, a) => s + a.length, 0) + nameB.length + data.length;
  }

  const centralStart = offset;
  for (const e of central) {
    const rec = [u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(e.crc), u32(e.size), u32(e.size), u16(e.nameB.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(e.offset)];
    chunks.push(...rec, e.nameB);
    offset += rec.reduce((s, a) => s + a.length, 0) + e.nameB.length;
  }
  chunks.push(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length),
    u32(offset - centralStart), u32(centralStart), u16(0));

  return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colLetter = (i) => { let s = ''; i++; while (i > 0) { s = String.fromCharCode(65 + ((i - 1) % 26)) + s; i = Math.floor((i - 1) / 26); } return s; };

function buildSheetXml(rows) {
  const rowsXml = rows.map((cells, r) => {
    const cellsXml = cells.map((v, c) => {
      const ref = `${colLetter(c)}${r + 1}`;
      if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(v)}</t></is></c>`;
    }).join('');
    return `<row r="${r + 1}">${cellsXml}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
}

function downloadTemplateXlsx() {
  const blob = buildStoredZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `</Types>`
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="PPM" sheetId="1" r:id="rId1"/></sheets></workbook>`
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `</Relationships>`
    },
    { name: 'xl/worksheets/sheet1.xml', content: buildSheetXml([TEMPLATE_COLUMNS, ...TEMPLATE_EXAMPLE_ROWS]) }
  ]);

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'modele_import_PPM.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  logger.info('[ImportPPM] Modèle Excel téléchargé');
}

/* ------------------------------------------------------------------ */
/* Contrôle de conformité du fichier chargé (simulation)               */
/* ------------------------------------------------------------------ */

/**
 * Conformité « document type » :
 *  - .xlsx : signature ZIP (PK\x03\x04) ;
 *  - .xls  : signature OLE2 (D0 CF 11 E0) ;
 *  - .csv  : la 1re ligne doit contenir au moins 3 entêtes du modèle.
 */
async function checkConformity(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  if (ext === 'xlsx') {
    const ok = head[0] === 0x50 && head[1] === 0x4B && head[2] === 0x03 && head[3] === 0x04;
    return { ok, reason: ok ? null : 'Le fichier .xlsx est corrompu ou n\'est pas un vrai classeur Excel.' };
  }
  if (ext === 'xls') {
    const ok = head[0] === 0xD0 && head[1] === 0xCF && head[2] === 0x11 && head[3] === 0xE0;
    return { ok, reason: ok ? null : 'Le fichier .xls est corrompu ou n\'est pas un vrai classeur Excel.' };
  }
  if (ext === 'csv') {
    const text = await file.slice(0, 2048).text();
    const firstLine = (text.split(/\r?\n/)[0] || '').toLowerCase();
    const hits = ['objet', 'mode', 'montant', 'activité', 'activite', 'type'].filter(k => firstLine.includes(k)).length;
    const ok = hits >= 3;
    return { ok, reason: ok ? null : 'Les entêtes du CSV ne correspondent pas au modèle (téléchargez le fichier type).' };
  }
  return { ok: false, reason: `Format « .${ext} » non pris en charge (formats acceptés : .xlsx, .xls, .csv).` };
}

/* ------------------------------------------------------------------ */
/* Données simulées — à l'image du tableau PPM de la liste (ECR01B)    */
/* ------------------------------------------------------------------ */

// alerte.type : SOUTENABILITE (écart budget) | HORS_BAREME | CHAMP_MANQUANT
const SIM_ROWS = [
  { activite: 'ACT_13001_005 - Études et audits', objet: 'Étude de faisabilité pour la réhabilitation de pistes rurales', typeMarche: 'Études', natureEco: '233 - Études et prestations intellectuelles', mode: 'PI — Prestation Intellectuelle', montant: 45000000, ligne: 'LB-2026-233-008', dotation: 60000000 },
  { activite: 'ACT_13030_005 - Fournitures de bureau', objet: 'Acquisition de fournitures de bureau pour les services centraux', typeMarche: 'Marchés de fournitures et équipements', natureEco: '232 - Équipements et matériels', mode: 'PSC — Procédure Simplifiée de demande de Cotation', montant: 18500000, ligne: 'LB-2026-232-013', dotation: 20000000 },
  { activite: 'ACT_21015_002 - Infrastructures scolaires', objet: 'Construction de 3 salles de classe à Bouaké', typeMarche: 'Marchés de travaux', natureEco: '231 - Bâtiments et infrastructures', mode: 'AOO — Appel d\'Offres Ouvert', montant: 240000000, ligne: 'LB-2026-231-021', dotation: 200000000 },
  { activite: 'ACT_13020_001 - Informatique', objet: 'Acquisition de matériel informatique pour les directions régionales', typeMarche: 'Marchés de fournitures et équipements', natureEco: '232 - Équipements et matériels', mode: 'PSO — Procédure Simplifiée d\'appel d\'Offres', montant: 85000000, ligne: 'LB-2026-232-017', dotation: 90000000 },
  { activite: 'ACT_31008_003 - Santé communautaire', objet: 'Réhabilitation du centre de santé de Korhogo', typeMarche: 'Marchés de travaux', natureEco: '231 - Bâtiments et infrastructures', mode: 'PSL — Procédure Simplifiée à compétition Limitée', montant: 48000000, ligne: 'LB-2026-231-034', dotation: 50000000 },
  { activite: 'ACT_13001_005 - Études et audits', objet: 'Audit organisationnel des services déconcentrés', typeMarche: 'Études', natureEco: '233 - Études et prestations intellectuelles', mode: 'PSD — Procédure Simplifiée d\'entente Directe', montant: 12000000, ligne: 'LB-2026-233-011', dotation: 15000000 },
  { activite: 'ACT_42011_004 - Hydraulique villageoise', objet: 'Forage de 10 puits équipés de pompes à motricité humaine', typeMarche: 'Marchés de travaux', natureEco: '231 - Bâtiments et infrastructures', mode: 'AOO — Appel d\'Offres Ouvert', montant: 150000000, ligne: 'LB-2026-231-029', dotation: 150000000 },
  { activite: 'ACT_21015_002 - Infrastructures scolaires', objet: 'Équipement en mobilier scolaire de 3 salles de classe', typeMarche: 'Marchés de fournitures et équipements', natureEco: '232 - Équipements et matériels', mode: 'PSC — Procédure Simplifiée de demande de Cotation', montant: 25000000, ligne: 'LB-2026-232-022', dotation: 18000000 },
  { activite: 'ACT_13030_005 - Fournitures de bureau', objet: 'Acquisition de consommables informatiques', typeMarche: 'Marchés de fournitures et équipements', natureEco: '', mode: 'PSD — Procédure Simplifiée d\'entente Directe', montant: 8000000, ligne: 'LB-2026-232-013', dotation: 12000000 },
  { activite: 'ACT_55002_001 - Communication', objet: 'Campagne de sensibilisation sur le budget citoyen', typeMarche: 'Marchés de prestations', natureEco: '221 - Biens et services', mode: 'PSC — Procédure Simplifiée de demande de Cotation', montant: 22000000, ligne: 'LB-2026-221-005', dotation: 30000000 }
];

/** Construit le résultat simulé : lignes + alertes (récap, soutenabilité, rapport). */
function buildSimulation(file, unite, exercice) {
  const rows = SIM_ROWS.map((r, i) => ({ ...r, num: i + 1, alertes: [] }));
  const alertes = [];

  for (const r of rows) {
    // Écart de soutenabilité budgétaire : montant > dotation de la ligne
    if (r.montant > r.dotation) {
      const ecart = r.montant - r.dotation;
      r.alertes.push({ type: 'SOUTENABILITE', gravite: 'MAJEURE', detail: `Dépassement de la dotation de ${money(ecart, 'F CFA')} (ligne ${r.ligne})` });
    }
    // Mode hors barème pour le montant (PSD plafonné à 10 M — barème ADMIN_CENTRALE)
    if (r.mode.startsWith('PSD') && r.montant > 10000000) {
      r.alertes.push({ type: 'HORS_BAREME', gravite: 'MINEURE', detail: `Montant ${money(r.montant, 'F CFA')} au-dessus du plafond PSD (10 000 000 F CFA) — dérogation à justifier` });
    }
    // Champ requis manquant
    if (!r.natureEco) {
      r.alertes.push({ type: 'CHAMP_MANQUANT', gravite: 'MINEURE', detail: 'Nature économique absente — à compléter avant contractualisation' });
    }
    for (const a of r.alertes) alertes.push({ num: r.num, objet: r.objet, ...a });
  }

  const parMode = {};
  const parType = {};
  for (const r of rows) {
    const modeCode = r.mode.split(' ')[0];
    parMode[modeCode] = (parMode[modeCode] || 0) + 1;
    parType[r.typeMarche] = (parType[r.typeMarche] || 0) + 1;
  }

  return {
    fichier: { nom: file.name, taille: file.size },
    unite, exercice,
    rows, alertes, parMode, parType,
    montantTotal: rows.reduce((s, r) => s + r.montant, 0),
    ecarts: rows.filter(r => r.alertes.some(a => a.type === 'SOUTENABILITE'))
  };
}

/* ------------------------------------------------------------------ */
/* Rapport d'erreurs (non bloquant) — export CSV                       */
/* ------------------------------------------------------------------ */

function downloadErrorReport(sim) {
  const headers = ['Ligne', 'Objet du marché', 'Type d\'alerte', 'Gravité', 'Détail'];
  const labels = { SOUTENABILITE: 'Écart de soutenabilité budgétaire', HORS_BAREME: 'Mode de passation hors barème', CHAMP_MANQUANT: 'Champ requis manquant' };
  const rows = sim.alertes.map(a => [a.num, a.objet, labels[a.type] || a.type, a.gravite, a.detail]);
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rapport-erreurs-import-PPM-${sim.exercice}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/* ------------------------------------------------------------------ */
/* Écran                                                               */
/* ------------------------------------------------------------------ */

export async function renderImportPPM() {
  let simulation = null; // résultat de la simulation en cours (null = étape 1)

  function render() {
    const page = el('div', { className: 'page' }, [
      el('div', { className: 'page-header' }, [
        el('h1', { className: 'page-title' }, 'Import PPM depuis Excel'),
        el('p', { className: 'page-subtitle' }, 'Importer un Plan de Passation des Marchés depuis un fichier Excel')
      ]),
      simulation ? renderResults() : renderSelection()
    ]);
    mount('#app', page);
  }

  /* ---------------- Étape 1 — sélection du fichier ---------------- */

  function renderSelection() {
    return el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Sélection du fichier')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-warning', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, '🧪'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Mode simulation'),
            el('div', { className: 'alert-message' }, 'Le dispositif d\'import est présenté en simulation : aucune donnée ne sera enregistrée. Si le fichier chargé est conforme au document type, un contenu cohérent est généré pour illustrer le fonctionnement (récap, écarts de soutenabilité, rapport d\'erreurs).')
          ])
        ]),

        el('div', { className: 'alert alert-info' }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Format attendu'),
            el('div', { className: 'alert-message' }, [
              el('span', {}, `Le fichier doit suivre le modèle type : ${TEMPLATE_COLUMNS.length} colonnes couvrant tous les champs de l'écran « Créer ligne PPM » (chaîne programmatique, identification du marché, financements, technique, localisation, livrables). Chaque information référentielle occupe deux colonnes — le code (qui ramène au référentiel en base) et le libellé. `),
              el('button', {
                type: 'button',
                className: 'btn btn-sm btn-accent',
                style: { marginLeft: '8px' },
                onclick: downloadTemplateXlsx
              }, '📥 Télécharger le modèle (Excel)')
            ])
          ])
        ]),

        formField({
          type: 'file',
          name: 'ppmFile',
          label: 'Fichier Excel PPM',
          required: true,
          help: 'Formats acceptés : .xlsx, .xls, .csv'
        }),

        formField({
          type: 'text',
          name: 'unite',
          label: 'Unité administrative',
          required: true,
          placeholder: 'Ex: Direction Générale des Marchés Publics'
        }),

        formField({
          type: 'number',
          name: 'exercice',
          label: 'Exercice budgétaire',
          required: true,
          value: new Date().getFullYear()
        }),

        formActions([
          {
            label: 'Annuler',
            className: 'btn-secondary',
            onClick: () => router.navigate('/mp/ppm-list')
          },
          {
            label: '🧪 Lancer la simulation d\'import',
            className: 'btn-primary',
            onClick: handleImport
          }
        ])
      ])
    ]);
  }

  async function handleImport() {
    const uniteInput = document.querySelector('[name="unite"]');
    const exerciceInput = document.querySelector('[name="exercice"]');
    const fileInput = document.querySelector('[name="ppmFile"]');

    if (!uniteInput?.value || !exerciceInput?.value || !fileInput?.files?.[0]) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const file = fileInput.files[0];
    logger.info('[ImportPPM] Simulation d\'import :', file.name);

    try {
      const conf = await checkConformity(file);
      if (!conf.ok) {
        alert(`❌ Fichier non conforme au document type.\n\n${conf.reason}\n\nTéléchargez le modèle depuis l'encart « Format attendu » puis réessayez.`);
        return;
      }
      simulation = buildSimulation(file, uniteInput.value, parseInt(exerciceInput.value, 10));
      render();
      window.scrollTo(0, 0);
    } catch (error) {
      // Modif #67 — Erreur silencieuse : détail en console, message générique en UI
      logger.error('[ImportPPM] Simulation impossible — détail technique :', error);
      alert('⚠️ Impossible d\'analyser le fichier pour le moment. Vérifiez le format puis réessayez.');
    }
  }

  /* ------------- Étape 2 — résultats de la simulation -------------- */

  function renderResults() {
    const sim = simulation;
    const moneyM = (v) => (v / 1000000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const nbAlertes = sim.alertes.length;
    const totalDepassement = sim.ecarts.reduce((s, r) => s + (r.montant - r.dotation), 0);

    const kpi = (icon, value, label, color) => el('div', { className: 'card' }, [
      el('div', { className: 'card-body', style: { textAlign: 'center', padding: '16px' } }, [
        el('div', { style: { fontSize: '24px', marginBottom: '6px' } }, icon),
        el('div', { style: { fontSize: '18px', fontWeight: '700', color, marginBottom: '2px' } }, String(value)),
        el('div', { className: 'text-small text-muted' }, label)
      ])
    ]);

    const badgeList = (obj) => el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
      Object.entries(obj).map(([k, n]) =>
        el('span', { className: 'badge badge-gray', style: { fontSize: '12px' } }, `${k} : ${n}`))
    );

    return el('div', {}, [
      // Bandeau simulation réussie
      el('div', { className: 'alert alert-success', style: { marginBottom: '16px' } }, [
        el('div', { className: 'alert-icon' }, '✅'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Fichier conforme — simulation du chargement'),
          el('div', { className: 'alert-message' },
            `« ${sim.fichier.nom} » (${Math.max(1, Math.round(sim.fichier.taille / 1024))} Ko) — ${sim.unite} · exercice ${sim.exercice}. ` +
            'Aucune donnée n\'a été enregistrée : le contenu ci-dessous illustre le résultat d\'un import réel.')
        ])
      ]),

      // 1. Récap des éléments chargés
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' } }, [
        kpi('📄', sim.rows.length, 'Lignes chargées', 'var(--color-primary)'),
        kpi('💰', money(sim.montantTotal, 'F CFA'), 'Montant total prévisionnel', 'var(--color-success)'),
        kpi('🧮', Object.keys(sim.parMode).length, 'Modes de passation distincts', '#0d6efd'),
        kpi('⚠️', nbAlertes, `Alerte(s) — non bloquant`, nbAlertes ? '#dc3545' : 'var(--color-gray-500)')
      ]),

      el('div', { className: 'card', style: { marginBottom: '16px' } }, [
        el('div', { className: 'card-header' }, el('h3', { className: 'card-title' }, '📊 Récapitulatif des éléments chargés')),
        el('div', { className: 'card-body', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' } }, [
          el('div', {}, [
            el('div', { style: { fontWeight: 600, marginBottom: '6px', fontSize: '13px' } }, 'Par mode de passation'),
            badgeList(sim.parMode)
          ]),
          el('div', {}, [
            el('div', { style: { fontWeight: 600, marginBottom: '6px', fontSize: '13px' } }, 'Par type de marché'),
            badgeList(sim.parType)
          ])
        ])
      ]),

      // 2. Écarts de soutenabilité budgétaire
      el('div', { className: 'card', style: { marginBottom: '16px', borderColor: sim.ecarts.length ? '#dc3545' : undefined } }, [
        el('div', { className: 'card-header', style: sim.ecarts.length ? { background: '#f8d7da' } : {} }, [
          el('h3', { className: 'card-title', style: sim.ecarts.length ? { color: '#842029' } : {} },
            `🚨 Écarts de soutenabilité budgétaire (${sim.ecarts.length})`)
        ]),
        el('div', { className: 'card-body' }, sim.ecarts.length ? [
          el('p', { style: { margin: '0 0 10px', fontSize: '13px' } }, [
            el('strong', {}, `${sim.ecarts.length} ligne(s)`),
            el('span', {}, ` dont le montant prévisionnel dépasse la dotation disponible de la ligne budgétaire — dépassement cumulé : `),
            el('strong', { style: { color: '#dc3545' } }, money(totalDepassement, 'F CFA'))
          ]),
          el('table', { className: 'data-table', style: { width: '100%', fontSize: '13px' } }, [
            el('thead', {}, el('tr', {}, [
              el('th', {}, 'Ligne budgétaire'),
              el('th', {}, 'Objet'),
              el('th', { style: { textAlign: 'right' } }, 'Dotation disponible'),
              el('th', { style: { textAlign: 'right' } }, 'Montant prévisionnel'),
              el('th', { style: { textAlign: 'right' } }, 'Écart')
            ])),
            el('tbody', {}, sim.ecarts.map(r => el('tr', {}, [
              el('td', {}, r.ligne),
              el('td', { title: r.objet }, r.objet.length > 50 ? r.objet.slice(0, 50) + '…' : r.objet),
              el('td', { style: { textAlign: 'right' } }, money(r.dotation, 'F CFA')),
              el('td', { style: { textAlign: 'right', fontWeight: 600 } }, money(r.montant, 'F CFA')),
              el('td', { style: { textAlign: 'right', color: '#dc3545', fontWeight: 700 } }, `− ${money(r.montant - r.dotation, 'F CFA')}`)
            ])))
          ])
        ] : [
          el('p', { style: { margin: 0, fontSize: '13px', color: '#6b7280' } }, 'Aucun écart : toutes les lignes sont couvertes par leur dotation budgétaire.')
        ])
      ]),

      // 3. Aperçu des lignes chargées — à l'image du tableau PPM (ECR01B)
      el('div', { className: 'card', style: { marginBottom: '16px' } }, [
        el('div', { className: 'card-header' }, el('h3', { className: 'card-title' }, `📋 Aperçu des lignes chargées (${sim.rows.length})`)),
        el('div', { className: 'card-body' }, [
          el('table', { className: 'data-table', style: { width: '100%', tableLayout: 'fixed', fontSize: '13px' } }, [
            el('thead', {}, el('tr', {}, [
              el('th', { style: { width: '15%' } }, 'Activité'),
              el('th', { style: { width: '24%' } }, 'Objet / Libellé'),
              el('th', { style: { width: '13%' } }, 'Type de marché'),
              el('th', { style: { width: '14%' } }, 'Nature économique'),
              el('th', { style: { width: '14%' } }, 'Mode de passation'),
              el('th', { style: { width: '10%', textAlign: 'right' } }, 'Montant prévisionnel (M F CFA)'),
              el('th', { style: { width: '10%' } }, 'Alertes')
            ])),
            el('tbody', {}, sim.rows.map(r => {
              const enEcart = r.alertes.some(a => a.type === 'SOUTENABILITE');
              const enAlerte = r.alertes.length > 0;
              return el('tr', { style: enEcart ? { background: '#fdf2f2', borderLeft: '3px solid #dc3545' } : {} }, [
                el('td', { className: 'text-small', title: r.activite }, r.activite),
                el('td', { title: r.objet }, r.objet.length > 55 ? r.objet.slice(0, 55) + '…' : r.objet),
                el('td', { className: 'text-small' }, r.typeMarche),
                el('td', { className: 'text-small' }, r.natureEco || el('span', { style: { color: '#b45309', fontStyle: 'italic' } }, 'manquante')),
                el('td', { className: 'text-small', title: r.mode }, r.mode.split(' — ')[0]),
                el('td', { style: { textAlign: 'right', fontWeight: 600 } }, moneyM(r.montant)),
                el('td', {}, enAlerte
                  ? el('span', {
                      className: `badge badge-${enEcart ? 'red' : 'orange'}`,
                      title: r.alertes.map(a => a.detail).join(' · '),
                      style: { fontSize: '11px' }
                    }, `⚠️ ${r.alertes.length}`)
                  : el('span', { className: 'badge badge-green', style: { fontSize: '11px' } }, '✓'))
              ]);
            }))
          ])
        ])
      ]),

      // 4. Rapport d'erreurs non bloquant
      el('div', { className: 'card', style: { marginBottom: '16px' } }, [
        el('div', { className: 'card-header' }, el('h3', { className: 'card-title' }, `📑 Rapport d'erreurs — non bloquant (${nbAlertes})`)),
        el('div', { className: 'card-body' }, [
          el('p', { style: { margin: '0 0 10px', fontSize: '13px', color: '#6b7280' } },
            'Les alertes ci-dessous n\'empêchent pas l\'import : elles signalent les points à régulariser. Le rapport peut être téléchargé et transmis à l\'unité concernée.'),
          nbAlertes ? el('ul', { style: { margin: '0 0 12px', paddingLeft: '20px', fontSize: '13px' } },
            sim.alertes.map(a => el('li', { style: { marginBottom: '4px' } }, [
              el('strong', {}, `Ligne ${a.num} — `),
              el('span', { className: `badge badge-${a.gravite === 'MAJEURE' ? 'red' : 'orange'}`, style: { fontSize: '10px', marginRight: '6px' } }, a.gravite),
              el('span', {}, a.detail)
            ]))) : el('p', { style: { margin: '0 0 12px', fontSize: '13px' } }, 'Aucune anomalie détectée.'),
          el('button', {
            type: 'button',
            className: 'btn btn-accent',
            onclick: () => downloadErrorReport(sim)
          }, '📥 Télécharger le rapport d\'erreurs (CSV)')
        ])
      ]),

      // Actions de fin de simulation
      el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
        el('button', {
          type: 'button',
          className: 'btn btn-secondary',
          onclick: () => { simulation = null; render(); }
        }, '↺ Recommencer'),
        el('button', {
          type: 'button',
          className: 'btn btn-primary',
          onclick: () => {
            alert('🧪 Simulation terminée — aucune donnée n\'a été enregistrée.');
            router.navigate('/mp/ppm-list');
          }
        }, 'Terminer la simulation')
      ])
    ]);
  }

  render();
}

export default renderImportPPM;
