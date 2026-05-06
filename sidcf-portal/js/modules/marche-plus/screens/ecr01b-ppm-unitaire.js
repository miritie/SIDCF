/* ============================================
   ECR01B - PPM List & Operations (v3 - Optimized)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { money, moneyMillions } from '../../../lib/format.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

// État global des filtres
let activeFilters = {
  search: '',
  typeMarche: 'ALL',
  modePassation: 'ALL',
  etat: 'ALL',
  typeFinancement: 'ALL',
  bailleur: 'ALL',
  categoriePrestation: 'ALL',
  region: 'ALL',
  exercice: 'ALL',
  unite: 'ALL'
};

// Opération sélectionnée pour modal détails
let selectedOperation = null;

export async function renderPPMList() {
  // Load data
  const operations = await dataService.query(ENTITIES.MP_OPERATION);
  const registries = dataService.getAllRegistries();

  // Extract unique values for filters
  const exercices = [...new Set(operations.map(op => op.exercice).filter(Boolean))].sort((a, b) => b - a);
  const regions = [...new Set(operations.map(op => op.localisation?.region).filter(Boolean))].sort();
  const unites = [...new Set(operations.map(op => op.unite).filter(Boolean))].sort();

  // Apply filters
  const filteredOps = applyFilters(operations);

  // Calculate stats
  const stats = {
    totalOperations: filteredOps.length,
    totalMontant: filteredOps.reduce((sum, op) => sum + op.montantPrevisionnel, 0),
    enExecution: filteredOps.filter(op => op.etat === 'EN_EXEC').length,
    planifies: filteredOps.filter(op => op.etat === 'PLANIFIE').length
  };

  const page = el('div', { className: 'page' }, [
    // Header
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, '📋 PPM & Opérations'),
      el('p', { className: 'page-subtitle' }, `${stats.totalOperations} opération(s) - ${money(stats.totalMontant)}`),
      el('div', { className: 'page-actions', style: { display: 'flex', gap: '12px' } }, [
        createButton('btn btn-secondary', '📤 Importer PPM', () => router.navigate('/mp/ppm-import')),
        createButton('btn btn-primary', '➕ Créer ligne PPM', () => router.navigate('/mp/ppm-create-line')),
        createButton('btn btn-accent', '📊 Tableau de bord', () => router.navigate('/mp/dashboard'))
      ])
    ]),

    // Stats KPIs
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' } }, [
      renderKPI('Total Opérations', stats.totalOperations, 'var(--color-primary)', '📁'),
      renderKPI('Montant Total', money(stats.totalMontant), 'var(--color-success)', '💰'),
      renderKPI('En exécution', stats.enExecution, 'var(--color-info)', '▶️'),
      renderKPI('Planifiées', stats.planifies, 'var(--color-warning)', '📅')
    ]),

    // Filters
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🔍 Filtres'),
        createButton('btn btn-sm btn-secondary', 'Réinitialiser', () => resetFilters())
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
          // Search
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Recherche'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'filter-search',
              placeholder: 'Objet, bénéficiaire, localité...',
              value: activeFilters.search
            })
          ]),

          // Exercice
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Exercice'),
            el('select', { className: 'form-input', id: 'filter-exercice', value: activeFilters.exercice }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...exercices.map(ex => el('option', { value: ex }, String(ex)))
            ])
          ]),

          // Type marché
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Type de marché'),
            el('select', { className: 'form-input', id: 'filter-typeMarche', value: activeFilters.typeMarche }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.TYPE_MARCHE || []).map(t =>
                el('option', { value: t.code }, t.label)
              )
            ])
          ]),

          // Mode passation
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Mode de passation'),
            el('select', { className: 'form-input', id: 'filter-modePassation', value: activeFilters.modePassation }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.MODE_PASSATION || []).map(m =>
                el('option', { value: m.code }, m.label)
              )
            ])
          ]),

          // État
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'État'),
            el('select', { className: 'form-input', id: 'filter-etat', value: activeFilters.etat }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.ETAT_MARCHE || []).map(e =>
                el('option', { value: e.code }, e.label)
              )
            ])
          ]),

          // Type financement
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Type financement'),
            el('select', { className: 'form-input', id: 'filter-typeFinancement', value: activeFilters.typeFinancement }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.TYPE_FINANCEMENT || []).map(t =>
                el('option', { value: t.code }, t.label)
              )
            ])
          ]),

          // Bailleur
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Bailleur'),
            el('select', { className: 'form-input', id: 'filter-bailleur', value: activeFilters.bailleur }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.BAILLEUR || []).map(b =>
                el('option', { value: b.code }, b.label)
              )
            ])
          ]),

          // Catégorie prestation
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Catégorie prestation'),
            el('select', { className: 'form-input', id: 'filter-categoriePrestation', value: activeFilters.categoriePrestation }, [
              el('option', { value: 'ALL' }, 'Toutes'),
              ...(registries.CATEGORIE_PRESTATION || []).map(c =>
                el('option', { value: c.code }, c.label)
              )
            ])
          ]),

          // Région
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Région'),
            el('select', { className: 'form-input', id: 'filter-region', value: activeFilters.region }, [
              el('option', { value: 'ALL' }, 'Toutes'),
              ...regions.map(r => el('option', { value: r }, r))
            ])
          ]),

          // Unité Administrative (UA)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Unité Administrative'),
            el('select', { className: 'form-input', id: 'filter-unite', value: activeFilters.unite }, [
              el('option', { value: 'ALL' }, 'Toutes'),
              ...unites.map(u => el('option', { value: u }, u))
            ])
          ])
        ])
      ])
    ]),

    // Results table (SIMPLIFIED)
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `Résultats (${filteredOps.length})`),
        createButton('btn btn-sm btn-accent', '📥 Exporter CSV', () => exportToCSV(filteredOps))
      ]),
      el('div', { className: 'card-body' }, [
        filteredOps.length > 0
          ? renderSimpleTable(filteredOps, registries)
          : el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, '📭'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucune opération trouvée'),
                el('div', { className: 'alert-message' }, 'Ajustez les filtres ou créez une nouvelle ligne PPM')
              ])
            ])
      ])
    ]),

    // Modal container
    el('div', { id: 'modal-detail-container' })
  ]);

  mount('#app', page);

  // Attach event listeners
  setupFilterListeners();
}

function renderKPI(label, value, color, icon) {
  return el('div', {
    className: 'card',
    style: {
      borderColor: `${color}30`,
      background: `${color}10`,
      cursor: 'default'
    }
  }, [
    el('div', { className: 'card-body', style: { textAlign: 'center', padding: '20px' } }, [
      el('div', { style: { fontSize: '28px', marginBottom: '8px' } }, icon),
      el('div', { style: { fontSize: '20px', fontWeight: '700', color, marginBottom: '4px' } }, String(value)),
      el('div', { className: 'text-small text-muted' }, label)
    ])
  ]);
}

// NOUVEAU: Tableau simplifié (colonnes essentielles uniquement)
function renderSimpleTable(operations, registries) {
  const table = el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', { style: { minWidth: '80px' } }, 'Exercice'),
          el('th', { style: { minWidth: '200px' } }, 'UA'),
          el('th', { style: { minWidth: '300px' } }, 'Objet'),
          el('th', { style: { minWidth: '120px' } }, 'Type'),
          el('th', { style: { minWidth: '100px' } }, 'Mode'),
          el('th', { style: { minWidth: '120px', textAlign: 'right' } }, 'Montant (M)'),
          el('th', { style: { minWidth: '100px' } }, 'Étape'),
          el('th', { style: { minWidth: '180px' } }, 'Actions')
        ])
      ]),
      el('tbody', {},
        operations.map(op => renderSimpleRow(op, registries))
      )
    ])
  ]);

  return table;
}

function renderSimpleRow(op, registries) {
  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === op.typeMarche);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === op.modePassation);
  const etat = registries.ETAT_MARCHE?.find(e => e.code === op.etat);
  const categorie = registries.CATEGORIE_PRESTATION?.find(c => c.code === op.categoriePrestation);

  return el('tr', {
    style: { cursor: 'pointer' },
    onclick: () => router.navigate('/mp/fiche-marche', { idOperation: op.id })
  }, [
    el('td', {}, String(op.exercice || '-')),
    el('td', { className: 'text-small', title: op.unite },
      op.unite?.length > 30 ? op.unite.substring(0, 30) + '...' : (op.unite || '-')
    ),
    el('td', { style: { fontWeight: '500' }, title: op.objet },
      op.objet.length > 60 ? op.objet.substring(0, 60) + '...' : op.objet
    ),
    el('td', {}, ((typeMarche?.label || op.typeMarche || '-') + '').toUpperCase()),
    el('td', { className: 'text-small' }, modePassation?.label?.split('(')[0]?.trim() || op.modePassation || '-'),
    el('td', { style: { fontWeight: '600', textAlign: 'right' } }, moneyMillions(op.montantPrevisionnel)),
    el('td', {},
      el('span', {
        className: `badge badge-${etat?.color || 'gray'}`,
        style: { fontSize: '11px' }
      }, etat?.label || op.etat)
    ),
    el('td', {}, [
      createButton('btn btn-sm btn-secondary', '👁️ Voir', (e) => {
        e.stopPropagation();
        router.navigate('/mp/fiche-marche', { idOperation: op.id });
      }),
      createButton('btn btn-sm btn-primary', '📋 Détails', (e) => {
        e.stopPropagation();
        showDetailModal(op, registries);
      })
    ])
  ]);
}

// NOUVEAU: Modal de détails complets
function showDetailModal(operation, registries) {
  selectedOperation = operation;

  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === operation.typeMarche);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === operation.modePassation);
  const naturePrix = registries.NATURE_PRIX?.find(n => n.code === operation.naturePrix);
  const etat = registries.ETAT_MARCHE?.find(e => e.code === operation.etat);
  const categorie = registries.CATEGORIE_PRESTATION?.find(c => c.code === operation.categoriePrestation);
  const bailleur = registries.BAILLEUR?.find(b => b.code === operation.sourceFinancement);
  const typeFinancement = registries.TYPE_FINANCEMENT?.find(t => t.code === operation.typeFinancement);

  const modal = el('div', {
    className: 'modal-overlay',
    id: 'detail-modal',
    style: { display: 'flex' }
  }, [
    el('div', {
      className: 'modal-content',
      style: { maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' },
      onclick: (e) => e.stopPropagation()
    }, [
      // Header
      el('div', { className: 'modal-header' }, [
        el('h2', { className: 'modal-title' }, '📋 Détails de l\'opération'),
        createButton('btn-close', '×', closeDetailModal)
      ]),

      // Body
      el('div', { className: 'modal-body' }, [
        // Section: Identification
        renderDetailSection('Identification', [
          { label: 'Exercice', value: operation.exercice },
          { label: 'Unité opérationnelle', value: operation.unite },
          { label: 'Objet', value: operation.objet, fullWidth: true }
        ]),

        // Section: Classification
        renderDetailSection('Classification', [
          { label: 'Type de marché', value: typeMarche?.label || operation.typeMarche },
          { label: 'Mode de passation', value: modePassation?.label || operation.modePassation },
          { label: 'Revue', value: operation.revue },
          { label: 'Nature des prix', value: naturePrix?.label || operation.naturePrix },
          { label: 'État', value: etat?.label || operation.etat }
        ]),

        // Section: Financier
        renderDetailSection('Financier', [
          { label: 'Montant prévisionnel', value: money(operation.montantPrevisionnel) },
          { label: 'Montant actuel', value: money(operation.montantActuel) },
          { label: 'Type de financement', value: typeFinancement?.label || operation.typeFinancement },
          { label: 'Bailleur / Source', value: bailleur?.label || operation.sourceFinancement }
        ]),

        // Section: Chaîne budgétaire
        renderDetailSection('Chaîne budgétaire', [
          { label: 'Activité', value: operation.chaineBudgetaire?.activite },
          { label: 'Code activité', value: operation.chaineBudgetaire?.activiteCode },
          { label: 'Ligne budgétaire', value: operation.chaineBudgetaire?.ligneBudgetaire },
          { label: 'Bailleur', value: operation.chaineBudgetaire?.bailleur }
        ]),

        // Section: Technique
        renderDetailSection('Technique', [
          { label: 'Délai d\'exécution', value: operation.delaiExecution ? `${operation.delaiExecution} jours` : '-' },
          { label: 'Catégorie prestation', value: categorie?.label || operation.categoriePrestation },
          { label: 'Bénéficiaire', value: operation.beneficiaire },
          { label: 'Livrables', value: operation.livrables?.join(', ') || '-', fullWidth: true }
        ]),

        // Section: Localisation
        renderDetailSection('Localisation géographique', [
          { label: 'Région', value: `${operation.localisation?.region || '-'} (${operation.localisation?.regionCode || ''})` },
          { label: 'Département', value: `${operation.localisation?.departement || '-'} (${operation.localisation?.departementCode || ''})` },
          { label: 'Sous-préfecture', value: `${operation.localisation?.sousPrefecture || '-'} (${operation.localisation?.sousPrefectureCode || ''})` },
          { label: 'Localité', value: operation.localisation?.localite },
          { label: 'Longitude', value: operation.localisation?.longitude },
          { label: 'Latitude', value: operation.localisation?.latitude },
          {
            label: 'Coordonnées GPS',
            value: operation.localisation?.coordsOK
              ? '✅ Validées'
              : '❌ Non renseignées'
          }
        ])
      ]),

      // Footer
      el('div', { className: 'modal-footer' }, [
        createButton('btn btn-secondary', 'Fermer', closeDetailModal),
        createButton('btn btn-primary', '🔍 Voir fiche complète', () => {
          closeDetailModal();
          router.navigate('/mp/fiche-marche', { idOperation: operation.id });
        })
      ])
    ])
  ]);

  const container = document.getElementById('modal-detail-container');
  container.innerHTML = '';
  container.appendChild(modal);

  // Add click handler to overlay for closing
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeDetailModal();
    }
  });

  // Add CSS for modal if not exists
  if (!document.getElementById('modal-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-styles';
    style.textContent = `
      .modal-overlay {
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
        padding: 20px;
      }
      .modal-content {
        background: #ffffff;
        border-radius: var(--radius-lg);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 100%;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid var(--color-gray-200);
      }
      .modal-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
      .btn-close {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: var(--color-gray-500);
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .btn-close:hover {
        background: var(--color-gray-100);
        color: var(--color-gray-700);
      }
      .modal-body {
        padding: 24px;
      }
      .modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 24px;
        border-top: 1px solid var(--color-gray-200);
      }
      .detail-section {
        margin-bottom: 32px;
      }
      .detail-section:last-child {
        margin-bottom: 0;
      }
      .detail-section-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 16px;
        color: var(--color-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      .detail-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .detail-field.full-width {
        grid-column: 1 / -1;
      }
      .detail-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-gray-500);
        letter-spacing: 0.5px;
      }
      .detail-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text);
      }
    `;
    document.head.appendChild(style);
  }
}

function renderDetailSection(title, fields) {
  return el('div', { className: 'detail-section' }, [
    el('div', { className: 'detail-section-title' }, title),
    el('div', { className: 'detail-grid' },
      fields.map(field =>
        el('div', { className: field.fullWidth ? 'detail-field full-width' : 'detail-field' }, [
          el('div', { className: 'detail-label' }, field.label),
          el('div', { className: 'detail-value' }, field.value || '-')
        ])
      )
    )
  ]);
}

function closeDetailModal() {
  const container = document.getElementById('modal-detail-container');
  if (container) {
    container.innerHTML = '';
  }
  selectedOperation = null;
}

function applyFilters(operations) {
  return operations.filter(op => {
    // Search
    if (activeFilters.search) {
      const search = activeFilters.search.toLowerCase();
      const matchObjet = op.objet?.toLowerCase().includes(search);
      const matchBenef = op.beneficiaire?.toLowerCase().includes(search);
      const matchLocalite = op.localisation?.localite?.toLowerCase().includes(search);
      if (!matchObjet && !matchBenef && !matchLocalite) return false;
    }

    // Exercice
    if (activeFilters.exercice !== 'ALL' && op.exercice !== Number(activeFilters.exercice)) {
      return false;
    }

    // Type marché
    if (activeFilters.typeMarche !== 'ALL' && op.typeMarche !== activeFilters.typeMarche) {
      return false;
    }

    // Mode passation
    if (activeFilters.modePassation !== 'ALL' && op.modePassation !== activeFilters.modePassation) {
      return false;
    }

    // État
    if (activeFilters.etat !== 'ALL' && op.etat !== activeFilters.etat) {
      return false;
    }

    // Type financement
    if (activeFilters.typeFinancement !== 'ALL' && op.typeFinancement !== activeFilters.typeFinancement) {
      return false;
    }

    // Bailleur
    if (activeFilters.bailleur !== 'ALL' && op.sourceFinancement !== activeFilters.bailleur) {
      return false;
    }

    // Catégorie prestation
    if (activeFilters.categoriePrestation !== 'ALL' && op.categoriePrestation !== activeFilters.categoriePrestation) {
      return false;
    }

    // Région
    if (activeFilters.region !== 'ALL' && op.localisation?.region !== activeFilters.region) {
      return false;
    }

    // Unité Administrative (UA)
    if (activeFilters.unite !== 'ALL' && op.unite !== activeFilters.unite) {
      return false;
    }

    return true;
  });
}

function setupFilterListeners() {
  const inputs = {
    search: document.getElementById('filter-search'),
    exercice: document.getElementById('filter-exercice'),
    typeMarche: document.getElementById('filter-typeMarche'),
    modePassation: document.getElementById('filter-modePassation'),
    etat: document.getElementById('filter-etat'),
    typeFinancement: document.getElementById('filter-typeFinancement'),
    bailleur: document.getElementById('filter-bailleur'),
    categoriePrestation: document.getElementById('filter-categoriePrestation'),
    region: document.getElementById('filter-region'),
    unite: document.getElementById('filter-unite')
  };

  // Search with debounce
  let searchTimeout;
  inputs.search?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      activeFilters.search = e.target.value;
      renderPPMList();
    }, 300);
  });

  // Select filters
  Object.entries(inputs).forEach(([key, input]) => {
    if (key !== 'search' && input) {
      input.addEventListener('change', (e) => {
        activeFilters[key] = e.target.value;

        // Logique automatique: Type financement → Bailleur
        if (key === 'typeFinancement') {
          const typeFin = e.target.value;
          if (typeFin === 'ETAT') {
            activeFilters.bailleur = 'TRESOR';
            const bailSelect = document.getElementById('filter-bailleur');
            if (bailSelect) bailSelect.value = 'TRESOR';
          }
        }

        renderPPMList();
      });
    }
  });
}

function resetFilters() {
  activeFilters = {
    search: '',
    typeMarche: 'ALL',
    modePassation: 'ALL',
    etat: 'ALL',
    typeFinancement: 'ALL',
    bailleur: 'ALL',
    categoriePrestation: 'ALL',
    region: 'ALL',
    exercice: 'ALL',
    unite: 'ALL'
  };
  renderPPMList();
}

function exportToCSV(operations) {
  const headers = [
    'Exercice', 'Unité Opérationnelle', 'Objet', 'Type Marché', 'Mode Passation',
    'Revue', 'Nature Prix', 'Montant Prévisionnel', 'Type Financement', 'Bailleur',
    'Activité', 'Activité Code', 'Ligne Budgétaire', 'Délai Execution', 'Catégorie Prestation',
    'Bénéficiaire', 'Région', 'Département', 'Sous-Préfecture', 'Localité',
    'Longitude', 'Latitude', 'État'
  ];

  const rows = operations.map(op => [
    op.exercice || '',
    op.unite || '',
    op.objet || '',
    op.typeMarche || '',
    op.modePassation || '',
    op.revue || '',
    op.naturePrix || '',
    op.montantPrevisionnel || 0,
    op.typeFinancement || '',
    op.sourceFinancement || '',
    op.chaineBudgetaire?.activite || '',
    op.chaineBudgetaire?.activiteCode || '',
    op.chaineBudgetaire?.ligneBudgetaire || '',
    op.delaiExecution || op.dureePrevisionnelle || '',
    op.categoriePrestation || '',
    op.beneficiaire || '',
    op.localisation?.region || '',
    op.localisation?.departement || '',
    op.localisation?.sousPrefecture || '',
    op.localisation?.localite || '',
    op.localisation?.longitude || '',
    op.localisation?.latitude || '',
    op.etat || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ppm_export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export default renderPPMList;
