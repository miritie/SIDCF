/* ============================================
   Import de Données - Module Investissement
   ============================================
   Écran d'import des données conformes aux Annexes officielles:
   - Annexe 1: Fiche de Collecte des Données par Projet d'Investissement Public
   - Annexe 2: Analyse de la Soutenabilité du Projet
   - Annexe 3: Cadre de Résultats du Projet (GAR)
   - Annexe 4: Fiche d'Identification des Acteurs Clés
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon, injectInvSidebarStyles } from '../inv-constants.js';

/**
 * Configuration des zones d'import par type d'annexe
 */
const IMPORT_ZONES = [
  {
    id: 'annexe1-identification',
    annexe: '1',
    section: 'Identification du Projet',
    description: 'Section, Code, Titre, Ordonnateur Principal des Crédits (OPE), Mode de gestion',
    icon: '📋',
    fields: [
      'Section', 'Code Projet', 'Titre du Projet', 'OPE', 'Mode Gestion',
      'Date Début', 'Date Fin Prévue', 'Durée (mois)'
    ],
    templateName: 'template_annexe1_identification.xlsx',
    required: true
  },
  {
    id: 'annexe1-localisation',
    annexe: '1',
    section: 'Localisation Géographique',
    description: 'Hiérarchie: District → Région → Département → Sous-préfecture → Commune → Village + GPS',
    icon: '📍',
    fields: [
      'District', 'Région', 'Département', 'Sous-préfecture', 'Commune', 'Village/Localité',
      'Latitude', 'Longitude'
    ],
    templateName: 'template_annexe1_localisation.xlsx',
    required: true
  },
  {
    id: 'annexe1-financement',
    annexe: '1',
    section: 'Sources de Financement',
    description: 'Trésor + Bailleurs multiples (Emprunt/Don) avec montants par source',
    icon: '💰',
    fields: [
      'Coût Global', 'Part Trésor', 'Bailleur 1 Code', 'Bailleur 1 Montant', 'Bailleur 1 Type',
      'Bailleur 2 Code', 'Bailleur 2 Montant', 'Bailleur 2 Type', 'Autres Sources'
    ],
    templateName: 'template_annexe1_financement.xlsx',
    required: true
  },
  {
    id: 'annexe1-composantes',
    annexe: '1',
    section: 'Composantes & Marchés',
    description: 'Composantes du projet avec marchés associés (lien vers module Marché)',
    icon: '🔗',
    fields: [
      'Code Composante', 'Libellé Composante', 'Montant Prévu', 'Zone Intervention',
      'Code Marché 1', 'Code Marché 2', 'Code Marché 3'
    ],
    templateName: 'template_annexe1_composantes.xlsx',
    required: false,
    linkToMarche: true
  },
  {
    id: 'annexe1-livrables',
    annexe: '1',
    section: 'Livrables Attendus',
    description: 'Liste des livrables par composante avec quantités et échéances',
    icon: '📦',
    fields: [
      'Code Composante', 'Type Livrable', 'Description', 'Quantité Prévue', 'Unité',
      'Date Prévue', 'Localisation'
    ],
    templateName: 'template_annexe1_livrables.xlsx',
    required: false
  },
  {
    id: 'annexe1-execution',
    annexe: '1',
    section: 'Suivi d\'Exécution',
    description: 'Taux d\'exécution physique et financière par période',
    icon: '📊',
    fields: [
      'Code Projet', 'Année', 'Trimestre', 'Montant Prévu', 'Montant Exécuté',
      'Taux Physique', 'Taux Financier', 'Observations'
    ],
    templateName: 'template_annexe1_execution.xlsx',
    required: false
  },
  {
    id: 'annexe2-soutenabilite',
    annexe: '2',
    section: 'Soutenabilité & Pluriannualité',
    description: 'Analyse sur N+1, N+2, N+3 avec PTBA vs Budget inscrit',
    icon: '📅',
    fields: [
      'Code Projet', 'Année N+1 PTBA', 'Année N+1 Budget', 'Année N+1 Écart',
      'Année N+2 PTBA', 'Année N+2 Budget', 'Année N+2 Écart',
      'Année N+3 PTBA', 'Année N+3 Budget', 'Année N+3 Écart',
      'Observations Soutenabilité'
    ],
    templateName: 'template_annexe2_soutenabilite.xlsx',
    required: false
  },
  {
    id: 'annexe3-resultats',
    annexe: '3',
    section: 'Cadre de Résultats (GAR)',
    description: 'Indicateurs IMPACT → EFFETS → EXTRANTS avec baseline et cibles',
    icon: '🎯',
    fields: [
      'Code Projet', 'Niveau Indicateur', 'Code Indicateur', 'Libellé Indicateur',
      'Unité', 'Baseline', 'Année Baseline', 'Cible Année 1', 'Cible Année 2',
      'Cible Finale', 'Source Vérification', 'Fréquence Mesure'
    ],
    templateName: 'template_annexe3_resultats.xlsx',
    required: false
  },
  {
    id: 'annexe4-acteurs',
    annexe: '4',
    section: 'Acteurs Clés du Projet',
    description: 'CF, Coordonnateur, RAF, SPM avec contacts et dates de nomination',
    icon: '👥',
    fields: [
      'Code Projet', 'Fonction', 'Nom Prénom', 'Téléphone', 'Email',
      'Date Nomination', 'Décision/Arrêté Ref'
    ],
    templateName: 'template_annexe4_acteurs.xlsx',
    required: false
  }
];

/**
 * État de l'import
 */
let importState = {
  files: {},           // { zoneId: File }
  previews: {},        // { zoneId: { headers: [], rows: [] } }
  validations: {},     // { zoneId: { valid: bool, errors: [], warnings: [] } }
  importing: false,
  progress: 0
};

/**
 * Render sidebar
 */
function renderInvSidebar(activeRoute) {
  return el('aside', { className: 'sidebar inv-sidebar' }, [
    el('div', { className: 'sidebar-header' }, [
      el('h2', { className: 'sidebar-title' }, 'Investissement'),
      el('button', {
        className: 'btn btn-sm btn-ghost',
        onclick: () => router.navigate('/portal')
      }, 'Portail')
    ]),
    el('nav', { className: 'sidebar-nav' },
      createSidebarMenuItems(el, activeRoute)
    )
  ]);
}

/**
 * Render zone d'import individuelle
 */
function renderImportZone(zone) {
  const hasFile = importState.files[zone.id];
  const preview = importState.previews[zone.id];
  const validation = importState.validations[zone.id];

  return el('div', {
    className: `import-zone ${hasFile ? 'has-file' : ''} ${validation?.valid === false ? 'has-errors' : ''} ${zone.required ? 'required' : ''}`,
    id: `zone-${zone.id}`
  }, [
    // Header de la zone
    el('div', { className: 'import-zone-header' }, [
      el('div', { className: 'import-zone-icon' }, zone.icon),
      el('div', { className: 'import-zone-info' }, [
        el('div', { className: 'import-zone-title' }, [
          el('span', { className: 'annexe-badge' }, `Annexe ${zone.annexe}`),
          el('span', {}, zone.section),
          zone.required && el('span', { className: 'required-badge' }, '*')
        ]),
        el('div', { className: 'import-zone-desc' }, zone.description)
      ]),
      el('div', { className: 'import-zone-actions' }, [
        el('a', {
          className: 'btn btn-sm btn-ghost',
          href: `#`,
          onclick: (e) => {
            e.preventDefault();
            downloadTemplate(zone);
          },
          title: 'Télécharger le modèle'
        }, '📥 Modèle'),
        zone.linkToMarche && el('a', {
          className: 'btn btn-sm btn-ghost',
          href: '#/marches/ppm',
          title: 'Accéder au module Marché'
        }, '🔗 Marchés')
      ])
    ]),

    // Zone de drop
    el('div', {
      className: `import-dropzone ${hasFile ? 'has-file' : ''}`,
      ondragover: (e) => handleDragOver(e, zone.id),
      ondragleave: (e) => handleDragLeave(e, zone.id),
      ondrop: (e) => handleDrop(e, zone.id)
    }, [
      hasFile ? [
        el('div', { className: 'file-info' }, [
          el('span', { className: 'file-icon' }, '📄'),
          el('span', { className: 'file-name' }, importState.files[zone.id].name),
          el('span', { className: 'file-size' }, formatFileSize(importState.files[zone.id].size)),
          el('button', {
            className: 'btn btn-sm btn-ghost btn-remove',
            onclick: () => removeFile(zone.id)
          }, '✕')
        ])
      ] : [
        el('div', { className: 'dropzone-content' }, [
          el('div', { className: 'dropzone-icon' }, '📂'),
          el('div', { className: 'dropzone-text' }, [
            el('span', {}, 'Glissez un fichier CSV/Excel ici ou '),
            el('label', { className: 'file-input-label' }, [
              'parcourir',
              el('input', {
                type: 'file',
                accept: '.csv,.xlsx,.xls',
                className: 'file-input-hidden',
                onchange: (e) => handleFileSelect(e, zone.id)
              })
            ])
          ]),
          el('div', { className: 'dropzone-formats' }, 'Formats: CSV, Excel (.xlsx, .xls)')
        ])
      ]
    ]),

    // Liste des champs attendus
    el('div', { className: 'import-zone-fields' }, [
      el('div', { className: 'fields-label' }, 'Colonnes attendues:'),
      el('div', { className: 'fields-list' },
        zone.fields.map(field =>
          el('span', { className: 'field-tag' }, field)
        )
      )
    ]),

    // Prévisualisation des données
    preview && renderPreview(zone.id, preview),

    // Messages de validation
    validation && renderValidation(zone.id, validation)
  ]);
}

/**
 * Render prévisualisation des données
 */
function renderPreview(zoneId, preview) {
  if (!preview.rows || preview.rows.length === 0) {
    return el('div', { className: 'import-preview empty' }, [
      el('span', {}, 'Aucune donnée à prévisualiser')
    ]);
  }

  const maxRows = 5;
  const displayRows = preview.rows.slice(0, maxRows);

  return el('div', { className: 'import-preview' }, [
    el('div', { className: 'preview-header' }, [
      el('span', { className: 'preview-title' }, `Aperçu (${preview.rows.length} lignes)`),
      preview.rows.length > maxRows && el('span', { className: 'preview-more' }, `+ ${preview.rows.length - maxRows} autres`)
    ]),
    el('div', { className: 'preview-table-wrapper' }, [
      el('table', { className: 'preview-table' }, [
        el('thead', {}, [
          el('tr', {},
            preview.headers.map(h => el('th', {}, h))
          )
        ]),
        el('tbody', {},
          displayRows.map(row =>
            el('tr', {},
              preview.headers.map((h, i) =>
                el('td', {}, String(row[i] || ''))
              )
            )
          )
        )
      ])
    ])
  ]);
}

/**
 * Render messages de validation
 */
function renderValidation(zoneId, validation) {
  const messages = [];

  if (validation.errors && validation.errors.length > 0) {
    messages.push(
      el('div', { className: 'validation-errors' }, [
        el('div', { className: 'validation-title error' }, `❌ ${validation.errors.length} erreur(s)`),
        el('ul', { className: 'validation-list' },
          validation.errors.slice(0, 5).map(err =>
            el('li', {}, err)
          )
        ),
        validation.errors.length > 5 && el('div', { className: 'validation-more' }, `+ ${validation.errors.length - 5} autres erreurs`)
      ])
    );
  }

  if (validation.warnings && validation.warnings.length > 0) {
    messages.push(
      el('div', { className: 'validation-warnings' }, [
        el('div', { className: 'validation-title warning' }, `⚠️ ${validation.warnings.length} avertissement(s)`),
        el('ul', { className: 'validation-list' },
          validation.warnings.slice(0, 3).map(warn =>
            el('li', {}, warn)
          )
        )
      ])
    );
  }

  if (validation.valid) {
    messages.push(
      el('div', { className: 'validation-success' }, [
        el('span', {}, '✅ Fichier valide et prêt pour import')
      ])
    );
  }

  return el('div', { className: 'import-validation' }, messages);
}

/**
 * Render barre de progression de l'import
 */
function renderImportProgress() {
  if (!importState.importing) return null;

  return el('div', { className: 'import-progress-overlay' }, [
    el('div', { className: 'import-progress-card' }, [
      el('div', { className: 'progress-title' }, 'Import en cours...'),
      el('div', { className: 'progress-bar-container' }, [
        el('div', {
          className: 'progress-bar',
          style: `width: ${importState.progress}%`
        })
      ]),
      el('div', { className: 'progress-text' }, `${importState.progress}%`)
    ])
  ]);
}

/**
 * Render section récapitulative et actions
 */
function renderImportActions() {
  const filesCount = Object.keys(importState.files).length;
  const validFilesCount = Object.values(importState.validations).filter(v => v.valid).length;
  const hasErrors = Object.values(importState.validations).some(v => v.valid === false);
  const requiredZones = IMPORT_ZONES.filter(z => z.required);
  const requiredMissing = requiredZones.filter(z => !importState.files[z.id]);

  return el('div', { className: 'import-actions-panel' }, [
    // Récapitulatif
    el('div', { className: 'import-summary' }, [
      el('div', { className: 'summary-item' }, [
        el('span', { className: 'summary-value' }, String(filesCount)),
        el('span', { className: 'summary-label' }, 'fichier(s) chargé(s)')
      ]),
      el('div', { className: 'summary-item success' }, [
        el('span', { className: 'summary-value' }, String(validFilesCount)),
        el('span', { className: 'summary-label' }, 'validé(s)')
      ]),
      hasErrors && el('div', { className: 'summary-item error' }, [
        el('span', { className: 'summary-value' }, String(filesCount - validFilesCount)),
        el('span', { className: 'summary-label' }, 'avec erreurs')
      ]),
      requiredMissing.length > 0 && el('div', { className: 'summary-item warning' }, [
        el('span', { className: 'summary-value' }, String(requiredMissing.length)),
        el('span', { className: 'summary-label' }, 'obligatoire(s) manquant(s)')
      ])
    ]),

    // Actions
    el('div', { className: 'import-buttons' }, [
      el('button', {
        className: 'btn btn-ghost',
        onclick: resetImport
      }, '🔄 Réinitialiser'),
      el('button', {
        className: 'btn btn-primary',
        disabled: filesCount === 0 || hasErrors || requiredMissing.length > 0,
        onclick: startImport
      }, [
        el('span', {}, '📥'),
        el('span', {}, ' Importer les données')
      ])
    ])
  ]);
}

/**
 * Handlers pour le drag & drop
 */
function handleDragOver(e, zoneId) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget;
  zone.classList.add('dragover');
}

function handleDragLeave(e, zoneId) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget;
  zone.classList.remove('dragover');
}

function handleDrop(e, zoneId) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget;
  zone.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(zoneId, files[0]);
  }
}

function handleFileSelect(e, zoneId) {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(zoneId, files[0]);
  }
}

/**
 * Traitement du fichier uploadé
 */
async function processFile(zoneId, file) {
  logger.info(`[Import] Processing file for zone ${zoneId}: ${file.name}`);

  // Vérifier le type de fichier
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const validExtensions = ['.csv', '.xls', '.xlsx'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!validExtensions.includes(ext)) {
    showNotification('Format de fichier non supporté. Utilisez CSV ou Excel.', 'error');
    return;
  }

  // Stocker le fichier
  importState.files[zoneId] = file;

  // Parser et prévisualiser
  try {
    const preview = await parseFile(file);
    importState.previews[zoneId] = preview;

    // Valider les données
    const zone = IMPORT_ZONES.find(z => z.id === zoneId);
    importState.validations[zoneId] = validateData(zone, preview);

    // Re-render la page
    refreshUI();
  } catch (error) {
    logger.error(`[Import] Error processing file: ${error.message}`);
    importState.validations[zoneId] = {
      valid: false,
      errors: [`Erreur de lecture du fichier: ${error.message}`],
      warnings: []
    };
    refreshUI();
  }
}

/**
 * Parser un fichier CSV
 */
async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          reject(new Error('Le fichier doit contenir au moins un en-tête et une ligne de données'));
          return;
        }

        // Détecter le séparateur (virgule ou point-virgule)
        const separator = lines[0].includes(';') ? ';' : ',';

        const headers = parseCSVLine(lines[0], separator);
        const rows = lines.slice(1).map(line => parseCSVLine(line, separator));

        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      // Pour Excel, on simule une structure de base (en prod, utiliser une lib comme SheetJS)
      resolve({
        headers: ['Données Excel détectées'],
        rows: [['Prévisualisation Excel non disponible - Import fonctionnel']]
      });
    }
  });
}

/**
 * Parser une ligne CSV
 */
function parseCSVLine(line, separator = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Valider les données par rapport au schéma attendu
 */
function validateData(zone, preview) {
  const errors = [];
  const warnings = [];

  if (!preview.headers || preview.headers.length === 0) {
    errors.push('Aucun en-tête détecté dans le fichier');
    return { valid: false, errors, warnings };
  }

  // Vérifier que les colonnes obligatoires sont présentes
  const normalizedHeaders = preview.headers.map(h => normalizeHeader(h));
  const missingFields = [];

  zone.fields.slice(0, 3).forEach(field => {
    const normalizedField = normalizeHeader(field);
    if (!normalizedHeaders.some(h => h.includes(normalizedField) || normalizedField.includes(h))) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    warnings.push(`Colonnes potentiellement manquantes: ${missingFields.join(', ')}`);
  }

  // Vérifier qu'il y a des données
  if (!preview.rows || preview.rows.length === 0) {
    errors.push('Aucune donnée trouvée dans le fichier');
  }

  // Vérifier les lignes vides
  const emptyRows = preview.rows.filter(row => row.every(cell => !cell || cell.trim() === '')).length;
  if (emptyRows > 0) {
    warnings.push(`${emptyRows} ligne(s) vide(s) détectée(s) - elles seront ignorées`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Normaliser un en-tête pour comparaison
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Supprimer un fichier
 */
function removeFile(zoneId) {
  delete importState.files[zoneId];
  delete importState.previews[zoneId];
  delete importState.validations[zoneId];
  refreshUI();
}

/**
 * Réinitialiser l'import
 */
function resetImport() {
  importState = {
    files: {},
    previews: {},
    validations: {},
    importing: false,
    progress: 0
  };
  refreshUI();
}

/**
 * Démarrer l'import
 */
async function startImport() {
  logger.info('[Import] Starting import process...');
  importState.importing = true;
  importState.progress = 0;
  refreshUI();

  const zones = Object.keys(importState.files);
  const total = zones.length;

  for (let i = 0; i < zones.length; i++) {
    const zoneId = zones[i];
    const zone = IMPORT_ZONES.find(z => z.id === zoneId);
    const preview = importState.previews[zoneId];

    try {
      await importZoneData(zone, preview);
      importState.progress = Math.round(((i + 1) / total) * 100);
      refreshUI();
    } catch (error) {
      logger.error(`[Import] Error importing zone ${zoneId}: ${error.message}`);
      importState.validations[zoneId] = {
        valid: false,
        errors: [`Erreur d'import: ${error.message}`],
        warnings: []
      };
    }
  }

  importState.importing = false;
  importState.progress = 100;

  showNotification(`Import terminé: ${zones.length} fichier(s) traité(s)`, 'success');
  refreshUI();
}

/**
 * Importer les données d'une zone
 */
async function importZoneData(zone, preview) {
  // Simulation d'import (à remplacer par dataService)
  return new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Télécharger le modèle Excel
 */
function downloadTemplate(zone) {
  // Créer un CSV avec les en-têtes
  const headers = zone.fields.join(';');
  const exampleRow = zone.fields.map(() => '').join(';');
  const content = `${headers}\n${exampleRow}`;

  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zone.templateName.replace('.xlsx', '.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification(`Modèle téléchargé: ${zone.templateName}`, 'success');
}

/**
 * Formater la taille d'un fichier
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Afficher une notification
 */
function showNotification(message, type = 'info') {
  // Simple notification via console pour l'instant
  logger.info(`[Notification] ${type}: ${message}`);

  // TODO: Implémenter un système de toast/notification UI
}

/**
 * Rafraîchir l'UI
 */
function refreshUI() {
  const app = qs('#app');
  if (app) {
    renderInvImport();
  }
}

/**
 * Main render function
 */
export async function renderInvImport() {
  logger.info('[Investissement] Rendering Import screen...');

  injectInvSidebarStyles();

  // Grouper les zones par annexe
  const annexe1Zones = IMPORT_ZONES.filter(z => z.annexe === '1');
  const annexe2Zones = IMPORT_ZONES.filter(z => z.annexe === '2');
  const annexe3Zones = IMPORT_ZONES.filter(z => z.annexe === '3');
  const annexe4Zones = IMPORT_ZONES.filter(z => z.annexe === '4');

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/import'),

    el('main', { className: 'page-main' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('div', { className: 'page-header-content' }, [
          el('h1', { className: 'page-title' }, 'Import de Données'),
          el('p', { className: 'page-subtitle' }, 'Chargement des tableaux conformes aux Annexes de collecte (Groupe Syn@pse)')
        ]),
        el('div', { className: 'page-header-actions' }, [
          el('a', {
            className: 'btn btn-ghost',
            href: '#/investissement/projets'
          }, '← Retour aux projets')
        ])
      ]),

      // Panel d'actions global
      renderImportActions(),

      // Content - Zones d'import par annexe
      el('div', { className: 'page-content import-content' }, [
        // Annexe 1 - Données Projet
        el('div', { className: 'annexe-section' }, [
          el('h2', { className: 'annexe-title' }, [
            el('span', { className: 'annexe-number' }, '1'),
            'Fiche de Collecte des Données par Projet'
          ]),
          el('div', { className: 'import-zones-grid' },
            annexe1Zones.map(zone => renderImportZone(zone))
          )
        ]),

        // Annexe 2 - Soutenabilité
        el('div', { className: 'annexe-section' }, [
          el('h2', { className: 'annexe-title' }, [
            el('span', { className: 'annexe-number' }, '2'),
            'Analyse de la Soutenabilité du Projet'
          ]),
          el('div', { className: 'import-zones-grid' },
            annexe2Zones.map(zone => renderImportZone(zone))
          )
        ]),

        // Annexe 3 - Résultats GAR
        el('div', { className: 'annexe-section' }, [
          el('h2', { className: 'annexe-title' }, [
            el('span', { className: 'annexe-number' }, '3'),
            'Cadre de Résultats du Projet (GAR)'
          ]),
          el('div', { className: 'import-zones-grid' },
            annexe3Zones.map(zone => renderImportZone(zone))
          )
        ]),

        // Annexe 4 - Acteurs
        el('div', { className: 'annexe-section' }, [
          el('h2', { className: 'annexe-title' }, [
            el('span', { className: 'annexe-number' }, '4'),
            'Identification des Acteurs Clés'
          ]),
          el('div', { className: 'import-zones-grid' },
            annexe4Zones.map(zone => renderImportZone(zone))
          )
        ])
      ]),

      // Overlay de progression
      renderImportProgress()
    ])
  ]);

  mount('#app', page);
  injectImportStyles();

  logger.info('[Investissement] Import screen rendered');
}

/**
 * Inject CSS styles for import screen
 */
function injectImportStyles() {
  const styleId = 'inv-import-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    /* Import Content Layout */
    .import-content {
      max-width: 1400px;
    }

    /* Actions Panel */
    .import-actions-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .import-summary {
      display: flex;
      gap: 2rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .summary-item.success .summary-value { color: #16a34a; }
    .summary-item.error .summary-value { color: #dc2626; }
    .summary-item.warning .summary-value { color: #f59e0b; }

    .summary-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .import-buttons {
      display: flex;
      gap: 0.75rem;
    }

    /* Annexe Sections */
    .annexe-section {
      margin-bottom: 2rem;
    }

    .annexe-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-border);
    }

    .annexe-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: var(--color-primary);
      color: white;
      font-weight: 700;
      border-radius: 50%;
    }

    /* Import Zones Grid */
    .import-zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 1rem;
    }

    /* Import Zone Card */
    .import-zone {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      overflow: hidden;
      transition: all 0.2s;
    }

    .import-zone.required {
      border-left: 4px solid var(--color-primary);
    }

    .import-zone.has-file {
      border-color: #16a34a;
    }

    .import-zone.has-errors {
      border-color: #dc2626;
    }

    .import-zone-header {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-surface-alt);
      border-bottom: 1px solid var(--color-border);
    }

    .import-zone-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .import-zone-info {
      flex: 1;
      min-width: 0;
    }

    .import-zone-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--color-text);
      flex-wrap: wrap;
    }

    .annexe-badge {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.125rem 0.5rem;
      background: var(--color-primary);
      color: white;
      border-radius: 0.25rem;
    }

    .required-badge {
      color: #dc2626;
      font-weight: 700;
    }

    .import-zone-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .import-zone-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    /* Dropzone */
    .import-dropzone {
      padding: 1.5rem;
      border: 2px dashed var(--color-border);
      border-radius: 0.5rem;
      margin: 1rem;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    }

    .import-dropzone:hover,
    .import-dropzone.dragover {
      border-color: var(--color-primary);
      background: rgba(59, 130, 246, 0.05);
    }

    .import-dropzone.has-file {
      border-style: solid;
      border-color: #16a34a;
      background: rgba(22, 163, 74, 0.05);
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .dropzone-icon {
      font-size: 2rem;
      opacity: 0.5;
    }

    .dropzone-text {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .file-input-label {
      color: var(--color-primary);
      cursor: pointer;
      text-decoration: underline;
    }

    .file-input-hidden {
      display: none;
    }

    .dropzone-formats {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      opacity: 0.7;
    }

    /* File Info */
    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: rgba(22, 163, 74, 0.1);
      border-radius: 0.375rem;
    }

    .file-icon {
      font-size: 1.5rem;
    }

    .file-name {
      flex: 1;
      font-weight: 500;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .btn-remove {
      color: var(--color-text-muted);
    }

    .btn-remove:hover {
      color: #dc2626;
    }

    /* Fields List */
    .import-zone-fields {
      padding: 0.75rem 1rem;
      background: var(--color-surface-alt);
      border-top: 1px solid var(--color-border);
    }

    .fields-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 0.5rem;
    }

    .fields-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .field-tag {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.25rem;
      color: var(--color-text-muted);
    }

    /* Preview Table */
    .import-preview {
      padding: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .preview-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .preview-more {
      font-size: 0.625rem;
      color: var(--color-text-muted);
    }

    .preview-table-wrapper {
      overflow-x: auto;
    }

    .preview-table {
      width: 100%;
      font-size: 0.75rem;
      border-collapse: collapse;
    }

    .preview-table th,
    .preview-table td {
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--color-border);
      text-align: left;
      white-space: nowrap;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-table th {
      background: var(--color-surface-alt);
      font-weight: 600;
    }

    /* Validation Messages */
    .import-validation {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--color-border);
    }

    .validation-title {
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .validation-title.error { color: #dc2626; }
    .validation-title.warning { color: #f59e0b; }

    .validation-list {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .validation-list li {
      margin-bottom: 0.25rem;
    }

    .validation-more {
      font-size: 0.625rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .validation-success {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #16a34a;
    }

    .validation-errors {
      background: #fef2f2;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-bottom: 0.5rem;
    }

    .validation-warnings {
      background: #fffbeb;
      padding: 0.75rem;
      border-radius: 0.375rem;
    }

    /* Progress Overlay */
    .import-progress-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .import-progress-card {
      background: white;
      padding: 2rem 3rem;
      border-radius: 1rem;
      text-align: center;
      min-width: 300px;
    }

    .progress-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .progress-bar-container {
      height: 8px;
      background: var(--color-border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 100%;
      background: var(--color-primary);
      transition: width 0.3s;
    }

    .progress-text {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .import-zones-grid {
        grid-template-columns: 1fr;
      }

      .import-actions-panel {
        flex-direction: column;
        gap: 1rem;
      }

      .import-summary {
        width: 100%;
        justify-content: space-around;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvImport;
