/* ============================================
   ECR01B - PPM List & Operations (Enhanced v2)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { money } from '../../../lib/format.js';
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
  infrastructure: 'ALL',
  region: 'ALL',
  exercice: 'ALL'
};

export async function renderPPMList() {
  // Load data
  const operations = await dataService.query(ENTITIES.OPERATION);
  const registries = dataService.getAllRegistries();

  // Extract unique values for filters
  const exercices = [...new Set(operations.map(op => op.exercice).filter(Boolean))].sort((a, b) => b - a);
  const regions = [...new Set(operations.map(op => op.localisation?.region).filter(Boolean))].sort();

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
        createButton('btn btn-secondary', '📤 Importer PPM', () => router.navigate('/ppm-import')),
        createButton('btn btn-primary', '➕ Créer ligne PPM', () => router.navigate('/ppm-create-line')),
        createButton('btn btn-accent', '📊 Dashboard CF', () => router.navigate('/dashboard-cf'))
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
              placeholder: 'Objet, bénéficiaire, localité...'
            })
          ]),

          // Exercice
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Exercice'),
            el('select', { className: 'form-input', id: 'filter-exercice' }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...exercices.map(ex => el('option', { value: ex }, String(ex)))
            ])
          ]),

          // Type marché
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Type de marché'),
            el('select', { className: 'form-input', id: 'filter-typeMarche' }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.TYPE_MARCHE || []).map(t =>
                el('option', { value: t.code }, t.label)
              )
            ])
          ]),

          // Mode passation
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Mode de passation'),
            el('select', { className: 'form-input', id: 'filter-modePassation' }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.MODE_PASSATION || []).map(m =>
                el('option', { value: m.code }, m.label)
              )
            ])
          ]),

          // État
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'État'),
            el('select', { className: 'form-input', id: 'filter-etat' }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.ETAT_MARCHE || []).map(e =>
                el('option', { value: e.code }, e.label)
              )
            ])
          ]),

          // Type financement
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Type financement'),
            el('select', { className: 'form-input', id: 'filter-typeFinancement' }, [
              el('option', { value: 'ALL' }, 'Tous'),
              ...(registries.TYPE_FINANCEMENT || []).map(t =>
                el('option', { value: t.code }, t.label)
              )
            ])
          ]),

          // Infrastructure
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Infrastructure'),
            el('select', { className: 'form-input', id: 'filter-infrastructure' }, [
              el('option', { value: 'ALL' }, 'Toutes'),
              ...(registries.TYPE_INFRASTRUCTURE || []).map(i =>
                el('option', { value: i.code }, i.label)
              )
            ])
          ]),

          // Région
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Région'),
            el('select', { className: 'form-input', id: 'filter-region' }, [
              el('option', { value: 'ALL' }, 'Toutes'),
              ...regions.map(r => el('option', { value: r }, r))
            ])
          ])
        ])
      ])
    ]),

    // Results table
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `Résultats (${filteredOps.length})`),
        createButton('btn btn-sm btn-accent', '📥 Exporter CSV', () => exportToCSV(filteredOps))
      ]),
      el('div', { className: 'card-body' }, [
        filteredOps.length > 0
          ? renderTable(filteredOps, registries)
          : el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, '📭'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucune opération trouvée'),
                el('div', { className: 'alert-message' }, 'Ajustez les filtres ou créez une nouvelle ligne PPM')
              ])
            ])
      ])
    ])
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

function renderTable(operations, registries) {
  const table = el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table', style: { minWidth: '2000px' } }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', { style: { minWidth: '80px' } }, 'Exercice'),
          el('th', { style: { minWidth: '100px' } }, 'Unité Op.'),
          el('th', { style: { minWidth: '250px' } }, 'Objet'),
          el('th', { style: { minWidth: '120px' } }, 'Type Marché'),
          el('th', { style: { minWidth: '100px' } }, 'Mode Pass.'),
          el('th', { style: { minWidth: '100px' } }, 'Revue'),
          el('th', { style: { minWidth: '100px' } }, 'Nature Prix'),
          el('th', { style: { minWidth: '120px' } }, 'Montant (M)'),
          el('th', { style: { minWidth: '100px' } }, 'Type Fin.'),
          el('th', { style: { minWidth: '100px' } }, 'Source Fin.'),
          el('th', { style: { minWidth: '120px' } }, 'Activité'),
          el('th', { style: { minWidth: '150px' } }, 'Ligne Budgétaire'),
          el('th', { style: { minWidth: '80px' } }, 'Délai (j)'),
          el('th', { style: { minWidth: '120px' } }, 'Infrastructure'),
          el('th', { style: { minWidth: '150px' } }, 'Bénéficiaire'),
          el('th', { style: { minWidth: '120px' } }, 'Région'),
          el('th', { style: { minWidth: '150px' } }, 'Département'),
          el('th', { style: { minWidth: '150px' } }, 'Sous-Préfecture'),
          el('th', { style: { minWidth: '120px' } }, 'Localité'),
          el('th', { style: { minWidth: '100px' } }, 'Coords'),
          el('th', { style: { minWidth: '100px' } }, 'État'),
          el('th', { style: { minWidth: '120px', position: 'sticky', right: 0, background: 'var(--color-bg)' } }, 'Actions')
        ])
      ]),
      el('tbody', {},
        operations.map(op => renderRow(op, registries))
      )
    ])
  ]);

  return table;
}

function renderRow(op, registries) {
  const typeMarche = registries.TYPE_MARCHE?.find(t => t.code === op.typeMarche);
  const modePassation = registries.MODE_PASSATION?.find(m => m.code === op.modePassation);
  const etat = registries.ETAT_MARCHE?.find(e => e.code === op.etat);
  const naturePrix = registries.NATURE_PRIX?.find(n => n.code === op.naturePrix);
  const infrastructure = registries.TYPE_INFRASTRUCTURE?.find(i => i.code === op.infrastructure);

  return el('tr', {
    style: { cursor: 'pointer' },
    onclick: () => router.navigate('/fiche-marche', { idOperation: op.id })
  }, [
    el('td', {}, String(op.exercice || '-')),
    el('td', { className: 'text-small' }, op.unite || '-'),
    el('td', { style: { fontWeight: '500' } }, op.objet),
    el('td', {}, typeMarche?.label || op.typeMarche || '-'),
    el('td', {}, modePassation?.label || op.modePassation || '-'),
    el('td', {}, op.revue || '-'),
    el('td', {}, naturePrix?.label || op.naturePrix || '-'),
    el('td', { style: { fontWeight: '600', textAlign: 'right' } }, (op.montantPrevisionnel / 1000000).toFixed(2)),
    el('td', {}, op.typeFinancement || '-'),
    el('td', {}, op.sourceFinancement || '-'),
    el('td', { className: 'text-small' }, op.chaineBudgetaire?.activite || '-'),
    el('td', { className: 'text-small' }, op.chaineBudgetaire?.ligneBudgetaire || '-'),
    el('td', { style: { textAlign: 'right' } }, String(op.delaiExecution || op.dureePrevisionnelle || '-')),
    el('td', {}, infrastructure?.label || op.infrastructure || '-'),
    el('td', {}, op.beneficiaire || '-'),
    el('td', {}, op.localisation?.region || '-'),
    el('td', {}, op.localisation?.departement || '-'),
    el('td', {}, op.localisation?.sousPrefecture || '-'),
    el('td', {}, op.localisation?.localite || '-'),
    el('td', { style: { textAlign: 'center' } },
      op.localisation?.coordsOK
        ? el('span', { style: { color: 'var(--color-success)' } }, '✓')
        : el('span', { style: { color: 'var(--color-gray-400)' } }, '—')
    ),
    el('td', {},
      el('span', {
        className: `badge badge-${etat?.color || 'gray'}`,
        style: { fontSize: '11px' }
      }, etat?.label || op.etat)
    ),
    el('td', { style: { position: 'sticky', right: 0, background: 'var(--color-bg)' } }, [
      createButton('btn btn-sm btn-secondary', '👁️ Voir', (e) => {
        e.stopPropagation();
        router.navigate('/fiche-marche', { idOperation: op.id });
      })
    ])
  ]);
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

    // Infrastructure
    if (activeFilters.infrastructure !== 'ALL' && op.infrastructure !== activeFilters.infrastructure) {
      return false;
    }

    // Région
    if (activeFilters.region !== 'ALL' && op.localisation?.region !== activeFilters.region) {
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
    infrastructure: document.getElementById('filter-infrastructure'),
    region: document.getElementById('filter-region')
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
    infrastructure: 'ALL',
    region: 'ALL',
    exercice: 'ALL'
  };
  renderPPMList();
}

function exportToCSV(operations) {
  const headers = [
    'Exercice', 'Unité Opérationnelle', 'Objet', 'Type Marché', 'Mode Passation',
    'Revue', 'Nature Prix', 'Montant Prévisionnel', 'Type Financement', 'Source Financement',
    'Activité', 'Activité Code', 'Ligne Budgétaire', 'Délai Execution', 'Infrastructure',
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
    op.infrastructure || '',
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
