/* ============================================
   Import de Données - Module Investissement
   ============================================
   Interface simplifiée pour import CSV/Excel
   Workflow en 3 étapes: Sélection → Aperçu → Import
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { createSidebarMenuItems, injectInvSidebarStyles } from '../inv-constants.js';

/**
 * Types d'import disponibles
 */
const IMPORT_TYPES = [
  {
    id: 'projets',
    label: 'Projets d\'Investissement',
    icon: '📁',
    description: 'Import des fiches projets avec identification, localisation et financement',
    color: '#3b82f6',
    templateFields: [
      'Code Projet', 'Titre', 'Section', 'OPE', 'Mode Gestion',
      'District', 'Région', 'Département', 'Commune',
      'Coût Total', 'Part Trésor', 'Bailleur', 'Type Financement',
      'Date Début', 'Date Fin', 'Statut'
    ]
  },
  {
    id: 'composantes',
    label: 'Composantes & Marchés',
    icon: '🔗',
    description: 'Composantes des projets avec liens vers les marchés',
    color: '#8b5cf6',
    templateFields: [
      'Code Projet', 'Code Composante', 'Libellé', 'Montant Prévu',
      'Zone Intervention', 'Code Marché 1', 'Code Marché 2'
    ]
  },
  {
    id: 'execution',
    label: 'Suivi d\'Exécution',
    icon: '📊',
    description: 'Données d\'exécution physique et financière par période',
    color: '#10b981',
    templateFields: [
      'Code Projet', 'Année', 'Trimestre',
      'Montant Prévu', 'Montant Exécuté',
      'Taux Physique (%)', 'Taux Financier (%)', 'Observations'
    ]
  },
  {
    id: 'soutenabilite',
    label: 'Soutenabilité',
    icon: '📅',
    description: 'Analyse pluriannuelle PTBA vs Budget (N+1, N+2, N+3)',
    color: '#f59e0b',
    templateFields: [
      'Code Projet',
      'N+1 PTBA', 'N+1 Budget',
      'N+2 PTBA', 'N+2 Budget',
      'N+3 PTBA', 'N+3 Budget',
      'Observations'
    ]
  },
  {
    id: 'indicateurs',
    label: 'Indicateurs GAR',
    icon: '🎯',
    description: 'Cadre de résultats: Impact, Effets, Extrants',
    color: '#ef4444',
    templateFields: [
      'Code Projet', 'Niveau', 'Code Indicateur', 'Libellé',
      'Unité', 'Baseline', 'Cible Année 1', 'Cible Année 2', 'Cible Finale',
      'Source Vérification'
    ]
  },
  {
    id: 'acteurs',
    label: 'Acteurs Clés',
    icon: '👥',
    description: 'CF, Coordonnateur, RAF, SPM avec contacts',
    color: '#06b6d4',
    templateFields: [
      'Code Projet', 'Fonction', 'Nom', 'Prénom',
      'Téléphone', 'Email', 'Date Nomination'
    ]
  }
];

/**
 * État de l'application
 */
let state = {
  step: 1,                    // 1: Sélection, 2: Aperçu, 3: Résultat
  selectedType: null,
  file: null,
  preview: null,
  validation: null,
  importing: false,
  result: null
};

/**
 * Render sidebar
 */
function renderSidebar(activeRoute) {
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
 * Render Step 1: Sélection du type d'import
 */
function renderStep1() {
  return el('div', { className: 'import-step step-1' }, [
    el('div', { className: 'step-header' }, [
      el('div', { className: 'step-number active' }, '1'),
      el('div', { className: 'step-info' }, [
        el('h2', {}, 'Que souhaitez-vous importer ?'),
        el('p', {}, 'Sélectionnez le type de données à charger')
      ])
    ]),

    el('div', { className: 'import-types-grid' },
      IMPORT_TYPES.map(type =>
        el('button', {
          className: `import-type-card ${state.selectedType === type.id ? 'selected' : ''}`,
          style: `--card-color: ${type.color}`,
          onclick: () => selectType(type.id)
        }, [
          el('div', { className: 'type-icon' }, type.icon),
          el('div', { className: 'type-content' }, [
            el('div', { className: 'type-label' }, type.label),
            el('div', { className: 'type-desc' }, type.description)
          ]),
          state.selectedType === type.id && el('div', { className: 'type-check' }, '✓')
        ])
      )
    ),

    state.selectedType && el('div', { className: 'step-actions' }, [
      el('button', {
        className: 'btn btn-ghost',
        onclick: () => downloadTemplate(state.selectedType)
      }, [
        el('span', {}, '📥'),
        ' Télécharger le modèle CSV'
      ]),
      el('label', { className: 'btn btn-primary file-label' }, [
        el('span', {}, '📂'),
        ' Sélectionner un fichier',
        el('input', {
          type: 'file',
          accept: '.csv,.xlsx,.xls',
          className: 'file-input-hidden',
          onchange: handleFileSelect
        })
      ])
    ])
  ]);
}

/**
 * Render Step 2: Aperçu et validation
 */
function renderStep2() {
  const type = IMPORT_TYPES.find(t => t.id === state.selectedType);

  return el('div', { className: 'import-step step-2' }, [
    el('div', { className: 'step-header' }, [
      el('button', {
        className: 'btn btn-ghost btn-back',
        onclick: goBack
      }, '← Retour'),
      el('div', { className: 'step-number active' }, '2'),
      el('div', { className: 'step-info' }, [
        el('h2', {}, 'Vérifiez vos données'),
        el('p', {}, [
          el('span', { className: 'file-badge' }, [
            el('span', {}, '📄'),
            state.file.name
          ]),
          ` • ${state.preview.rows.length} lignes détectées`
        ])
      ])
    ]),

    // Résumé de validation
    renderValidationSummary(),

    // Tableau de prévisualisation
    el('div', { className: 'preview-card' }, [
      el('div', { className: 'preview-header' }, [
        el('h3', {}, 'Aperçu des données'),
        el('span', { className: 'preview-info' },
          `${Math.min(10, state.preview.rows.length)} premières lignes sur ${state.preview.rows.length}`
        )
      ]),
      el('div', { className: 'preview-table-wrapper' }, [
        el('table', { className: 'preview-table' }, [
          el('thead', {}, [
            el('tr', {},
              state.preview.headers.map((h, i) =>
                el('th', {
                  className: state.validation?.columnStatus?.[i] === 'error' ? 'col-error' : ''
                }, h)
              )
            )
          ]),
          el('tbody', {},
            state.preview.rows.slice(0, 10).map((row, rowIdx) =>
              el('tr', { className: state.validation?.rowErrors?.[rowIdx] ? 'row-error' : '' },
                state.preview.headers.map((_, colIdx) =>
                  el('td', {}, String(row[colIdx] || ''))
                )
              )
            )
          )
        ])
      ])
    ]),

    // Actions
    el('div', { className: 'step-actions' }, [
      el('button', {
        className: 'btn btn-ghost',
        onclick: goBack
      }, 'Annuler'),
      el('button', {
        className: 'btn btn-primary btn-lg',
        disabled: state.validation && !state.validation.canImport,
        onclick: startImport
      }, [
        el('span', {}, '📥'),
        ` Importer ${state.preview.rows.length} lignes`
      ])
    ])
  ]);
}

/**
 * Render validation summary
 */
function renderValidationSummary() {
  if (!state.validation) return null;

  const { errors, warnings, canImport } = state.validation;

  return el('div', { className: 'validation-summary' }, [
    // Statut global
    el('div', { className: `validation-status ${canImport ? 'status-ok' : 'status-error'}` }, [
      el('span', { className: 'status-icon' }, canImport ? '✅' : '❌'),
      el('span', { className: 'status-text' },
        canImport
          ? 'Fichier valide, prêt pour l\'import'
          : 'Erreurs détectées, veuillez corriger le fichier'
      )
    ]),

    // Erreurs
    errors.length > 0 && el('div', { className: 'validation-errors' }, [
      el('div', { className: 'validation-title' }, `${errors.length} erreur(s)`),
      el('ul', {},
        errors.slice(0, 5).map(err => el('li', {}, err))
      ),
      errors.length > 5 && el('div', { className: 'more-items' }, `+ ${errors.length - 5} autres erreurs`)
    ]),

    // Avertissements
    warnings.length > 0 && el('div', { className: 'validation-warnings' }, [
      el('div', { className: 'validation-title' }, `${warnings.length} avertissement(s)`),
      el('ul', {},
        warnings.slice(0, 3).map(warn => el('li', {}, warn))
      )
    ])
  ]);
}

/**
 * Render Step 3: Résultat de l'import
 */
function renderStep3() {
  const success = state.result?.success;

  return el('div', { className: 'import-step step-3' }, [
    el('div', { className: `result-card ${success ? 'result-success' : 'result-error'}` }, [
      el('div', { className: 'result-icon' }, success ? '✅' : '❌'),
      el('h2', {}, success ? 'Import réussi !' : 'Échec de l\'import'),
      el('p', { className: 'result-message' }, state.result?.message),

      success && el('div', { className: 'result-stats' }, [
        el('div', { className: 'stat' }, [
          el('div', { className: 'stat-value' }, String(state.result.imported || 0)),
          el('div', { className: 'stat-label' }, 'lignes importées')
        ]),
        state.result.updated > 0 && el('div', { className: 'stat' }, [
          el('div', { className: 'stat-value' }, String(state.result.updated)),
          el('div', { className: 'stat-label' }, 'mises à jour')
        ]),
        state.result.skipped > 0 && el('div', { className: 'stat' }, [
          el('div', { className: 'stat-value' }, String(state.result.skipped)),
          el('div', { className: 'stat-label' }, 'ignorées')
        ])
      ]),

      el('div', { className: 'result-actions' }, [
        el('button', {
          className: 'btn btn-ghost',
          onclick: resetImport
        }, 'Nouvel import'),
        el('a', {
          className: 'btn btn-primary',
          href: '#/investissement/projets'
        }, 'Voir les projets →')
      ])
    ])
  ]);
}

/**
 * Render loading state
 */
function renderLoading() {
  return el('div', { className: 'import-loading' }, [
    el('div', { className: 'loader' }),
    el('p', {}, 'Import en cours...'),
    el('p', { className: 'loader-hint' }, 'Veuillez patienter')
  ]);
}

/**
 * Sélectionner un type d'import
 */
function selectType(typeId) {
  state.selectedType = typeId;
  refresh();
}

/**
 * Gérer la sélection de fichier
 */
async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.file = file;

  try {
    state.preview = await parseFile(file);
    state.validation = validateData(state.selectedType, state.preview);
    state.step = 2;
  } catch (error) {
    logger.error('[Import] Parse error:', error);
    alert(`Erreur de lecture du fichier: ${error.message}`);
  }

  refresh();
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

        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = parseCSVLine(lines[0], separator);
        const rows = lines.slice(1).map(line => parseCSVLine(line, separator));

        resolve({ headers, rows, separator });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file, 'UTF-8');
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
 * Valider les données
 */
function validateData(typeId, preview) {
  const type = IMPORT_TYPES.find(t => t.id === typeId);
  const errors = [];
  const warnings = [];
  const columnStatus = [];
  const rowErrors = {};

  // Vérifier les colonnes attendues
  const expectedFields = type.templateFields.map(f => normalizeHeader(f));
  const actualFields = preview.headers.map(h => normalizeHeader(h));

  // Marquer les colonnes manquantes
  type.templateFields.forEach((field, idx) => {
    const found = actualFields.some(h => h.includes(expectedFields[idx]) || expectedFields[idx].includes(h));
    if (!found && idx < 3) { // Les 3 premières colonnes sont critiques
      errors.push(`Colonne manquante: "${field}"`);
    }
  });

  // Vérifier les lignes vides
  const emptyRows = preview.rows.filter(row => row.every(cell => !cell)).length;
  if (emptyRows > 0) {
    warnings.push(`${emptyRows} ligne(s) vide(s) seront ignorées`);
  }

  // Vérifier la première colonne (généralement le code projet)
  const firstColEmpty = preview.rows.filter(row => !row[0] || !row[0].trim()).length;
  if (firstColEmpty > 0 && firstColEmpty < preview.rows.length) {
    warnings.push(`${firstColEmpty} ligne(s) sans code dans la première colonne`);
  }

  return {
    errors,
    warnings,
    columnStatus,
    rowErrors,
    canImport: errors.length === 0
  };
}

/**
 * Normaliser un en-tête
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Télécharger le modèle CSV
 */
function downloadTemplate(typeId) {
  const type = IMPORT_TYPES.find(t => t.id === typeId);
  if (!type) return;

  const headers = type.templateFields.join(';');
  const exampleRow = type.templateFields.map(() => '').join(';');
  const content = `${headers}\n${exampleRow}`;

  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `modele_${type.id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Retour à l'étape précédente
 */
function goBack() {
  if (state.step === 2) {
    state.step = 1;
    state.file = null;
    state.preview = null;
    state.validation = null;
  }
  refresh();
}

/**
 * Réinitialiser l'import
 */
function resetImport() {
  state = {
    step: 1,
    selectedType: null,
    file: null,
    preview: null,
    validation: null,
    importing: false,
    result: null
  };
  refresh();
}

/**
 * Lancer l'import
 */
async function startImport() {
  state.importing = true;
  refresh();

  try {
    // Simulation d'import (remplacer par appel dataService)
    await new Promise(resolve => setTimeout(resolve, 1500));

    state.result = {
      success: true,
      message: `${state.preview.rows.length} enregistrements importés avec succès`,
      imported: state.preview.rows.length,
      updated: 0,
      skipped: 0
    };
    state.step = 3;
  } catch (error) {
    state.result = {
      success: false,
      message: `Erreur: ${error.message}`
    };
    state.step = 3;
  }

  state.importing = false;
  refresh();
}

/**
 * Rafraîchir l'UI
 */
function refresh() {
  renderInvImport();
}

/**
 * Main render function
 */
export async function renderInvImport() {
  logger.info('[Investissement] Rendering Import screen...');
  injectInvSidebarStyles();

  let content;
  if (state.importing) {
    content = renderLoading();
  } else {
    switch (state.step) {
      case 1:
        content = renderStep1();
        break;
      case 2:
        content = renderStep2();
        break;
      case 3:
        content = renderStep3();
        break;
    }
  }

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderSidebar('/investissement/import'),

    el('main', { className: 'page-main import-main' }, [
      // Progress bar
      el('div', { className: 'import-progress' }, [
        el('div', { className: `progress-step ${state.step >= 1 ? 'active' : ''} ${state.step > 1 ? 'done' : ''}` }, [
          el('div', { className: 'progress-dot' }, state.step > 1 ? '✓' : '1'),
          el('div', { className: 'progress-label' }, 'Sélection')
        ]),
        el('div', { className: 'progress-line' }),
        el('div', { className: `progress-step ${state.step >= 2 ? 'active' : ''} ${state.step > 2 ? 'done' : ''}` }, [
          el('div', { className: 'progress-dot' }, state.step > 2 ? '✓' : '2'),
          el('div', { className: 'progress-label' }, 'Vérification')
        ]),
        el('div', { className: 'progress-line' }),
        el('div', { className: `progress-step ${state.step >= 3 ? 'active' : ''}` }, [
          el('div', { className: 'progress-dot' }, '3'),
          el('div', { className: 'progress-label' }, 'Résultat')
        ])
      ]),

      content
    ])
  ]);

  mount('#app', page);
  injectImportStyles();

  logger.info('[Investissement] Import screen rendered');
}

/**
 * Inject CSS
 */
function injectImportStyles() {
  const styleId = 'inv-import-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    .import-main {
      background: var(--color-surface-alt, #f9fafb);
      min-height: 100vh;
    }

    /* Progress Bar */
    .import-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: white;
      border-bottom: 1px solid var(--color-border);
      gap: 0;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-dot {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      background: #e5e7eb;
      color: #9ca3af;
      transition: all 0.3s;
    }

    .progress-step.active .progress-dot {
      background: var(--color-primary, #3b82f6);
      color: white;
    }

    .progress-step.done .progress-dot {
      background: #10b981;
      color: white;
    }

    .progress-label {
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 500;
    }

    .progress-step.active .progress-label {
      color: var(--color-text);
    }

    .progress-line {
      width: 80px;
      height: 2px;
      background: #e5e7eb;
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
    }

    /* Step Content */
    .import-step {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .step-number {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      background: #e5e7eb;
      color: #9ca3af;
      flex-shrink: 0;
    }

    .step-number.active {
      background: var(--color-primary, #3b82f6);
      color: white;
    }

    .step-info h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
      color: var(--color-text);
    }

    .step-info p {
      margin: 0;
      color: var(--color-text-muted);
    }

    .btn-back {
      margin-right: auto;
    }

    /* Type Selection Grid */
    .import-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .import-type-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .import-type-card:hover {
      border-color: var(--card-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .import-type-card.selected {
      border-color: var(--card-color);
      background: linear-gradient(135deg, white 0%, color-mix(in srgb, var(--card-color) 5%, white) 100%);
    }

    .type-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .type-content {
      flex: 1;
      min-width: 0;
    }

    .type-label {
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.25rem;
    }

    .type-desc {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .type-check {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--card-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    /* Step Actions */
    .step-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      padding-top: 1rem;
    }

    .file-label {
      cursor: pointer;
    }

    .file-input-hidden {
      display: none;
    }

    .file-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      background: #e5e7eb;
      border-radius: 1rem;
      font-size: 0.875rem;
    }

    /* Preview */
    .preview-card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid var(--color-border);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--color-surface-alt);
      border-bottom: 1px solid var(--color-border);
    }

    .preview-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .preview-info {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .preview-table-wrapper {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .preview-table th,
    .preview-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      text-align: left;
      white-space: nowrap;
    }

    .preview-table th {
      background: #f9fafb;
      font-weight: 600;
      position: sticky;
      top: 0;
    }

    .preview-table th.col-error {
      background: #fef2f2;
      color: #dc2626;
    }

    .preview-table tr.row-error {
      background: #fef2f2;
    }

    /* Validation */
    .validation-summary {
      margin-bottom: 1.5rem;
    }

    .validation-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .validation-status.status-ok {
      background: #f0fdf4;
      border: 1px solid #86efac;
    }

    .validation-status.status-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .status-icon {
      font-size: 1.25rem;
    }

    .status-text {
      font-weight: 500;
    }

    .validation-errors,
    .validation-warnings {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .validation-errors {
      background: #fef2f2;
    }

    .validation-warnings {
      background: #fffbeb;
    }

    .validation-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .validation-errors .validation-title {
      color: #dc2626;
    }

    .validation-warnings .validation-title {
      color: #d97706;
    }

    .validation-summary ul {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .more-items {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 0.5rem;
    }

    /* Result */
    .result-card {
      text-align: center;
      padding: 3rem 2rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid var(--color-border);
    }

    .result-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .result-card h2 {
      font-size: 1.5rem;
      margin: 0 0 0.5rem;
    }

    .result-message {
      color: var(--color-text-muted);
      margin-bottom: 2rem;
    }

    .result-stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-bottom: 2rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .result-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    /* Loading */
    .import-loading {
      text-align: center;
      padding: 4rem 2rem;
    }

    .loader {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loader-hint {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    /* Buttons */
    .btn-lg {
      padding: 0.875rem 2rem;
      font-size: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .import-types-grid {
        grid-template-columns: 1fr;
      }

      .step-header {
        flex-wrap: wrap;
      }

      .result-stats {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvImport;
