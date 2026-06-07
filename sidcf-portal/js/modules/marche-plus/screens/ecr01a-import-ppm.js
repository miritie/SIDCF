/* ============================================
   ECR01A - Import PPM (Excel)

   Modif #146 — Refonte « simulation » (retour client, CHARGEMENT DES PPM) :
   1. Téléchargement d'un fichier modèle Excel. Depuis la Modif #148, c'est le
      modèle de référence officiel « MODEL DE PPM SIDCF » (23 colonnes,
      cellules codifiées « CODE LIBELLÉ » à séparateur espace), servi tel quel
      depuis assets/MODELE_PPM_SIDCF.xlsx.
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
/* Modèle type — Modif #148 : le modèle de référence officiel          */
/* « MODEL DE PPM SIDCF » fourni par le client remplace le modèle      */
/* généré (#146/#147). Il est servi tel quel depuis les assets         */
/* (assets/MODELE_PPM_SIDCF.xlsx). Convention du fichier : une seule   */
/* ligne d'entête (noms techniques ci-dessous) et, pour chaque colonne */
/* codifiée, la cellule porte « CODE LIBELLÉ » (séparateur espace) —   */
/* le code ramène au référentiel en base, le libellé sert de contrôle. */
/* Ex. : « 111 section xx », « 1 Trésor », « PSD procedure simplifié »,*/
/* « 23 Kabadougou ».                                                  */
/* ------------------------------------------------------------------ */

const TEMPLATE_URL = 'assets/MODELE_PPM_SIDCF.xlsx';
const TEMPLATE_FILENAME = 'MODELE_PPM_SIDCF.xlsx';

const TEMPLATE_COLUMNS = [
  'SECTION',
  'UNITE_OPERATIONNELLE',
  'OBJET_MARCHE',
  'TYPE_FINANCEMENT',
  'SOURCE_FINANCEMENT',
  'ACTIVITE',
  'LIGNE_BUDGETAIRE',
  'TYPE_MARCHE',
  'MODE_PASSATION',
  'REVUE',
  'NATURE_PRIX',
  'MONTANT_PREVISIONNEL',
  'LIVRABLE',
  'BENEFICIAIRE',
  'LONGITUDE',
  'LATITUDE',
  'DELAI_EXECUTION',
  'INFRASTRUCTURE',
  'DISTRICT',
  'REGION',
  'DEPARTEMENT',
  'SOUS_PREFECTURE',
  'LOCALITE'
];

/** Colonnes codifiées : cellule = « CODE LIBELLÉ » (séparateur espace). */
const TEMPLATE_CODED_COLUMNS = [
  'SECTION', 'UNITE_OPERATIONNELLE', 'TYPE_FINANCEMENT', 'SOURCE_FINANCEMENT',
  'ACTIVITE', 'LIGNE_BUDGETAIRE', 'TYPE_MARCHE', 'MODE_PASSATION', 'NATURE_PRIX',
  'INFRASTRUCTURE', 'DISTRICT', 'REGION', 'DEPARTEMENT', 'SOUS_PREFECTURE', 'LOCALITE'
];

/** Télécharge le modèle de référence (asset statique, fidèle à l'original). */
function downloadTemplateXlsx() {
  const a = document.createElement('a');
  a.href = TEMPLATE_URL;
  a.download = TEMPLATE_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  logger.info('[ImportPPM] Modèle de référence téléchargé');
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
              el('span', {}, `Le fichier doit suivre le modèle de référence « MODEL DE PPM SIDCF » : ${TEMPLATE_COLUMNS.length} colonnes alimentant l'écran « Créer ligne PPM » (${TEMPLATE_COLUMNS.slice(0, 6).join(', ')}…). Dans les ${TEMPLATE_CODED_COLUMNS.length} colonnes codifiées, la cellule porte le CODE suivi du LIBELLÉ, séparés par un espace (ex. « 1 Trésor », « 23 Kabadougou ») — le code ramène toujours au référentiel en base. `),
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
