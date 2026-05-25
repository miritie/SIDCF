/* ============================================
   ECR03B - Échéancier & Clé de Répartition
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps-mp.js';
import logger from '../../../lib/logger.js';
import { getLotData, buildLotPatch, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { renderPageHeaderMP } from '../../../ui/widgets/page-header-mp.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderEcheancierCle(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  // Load data
  const fullData = await dataService.getMpOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
    ]));
    return;
  }

  const { operation, attribution, budgetLine, procedure } = fullData;
  const registries = dataService.getAllRegistries();
  const rulesConfig = dataService.getRulesConfig();

  // Marché+ multi-lot : résoudre le lot courant depuis la procédure
  const lots = getLotsFromProcedure(procedure);
  const currentLotId = resolveCurrentLotId(lots, params);

  // Check prerequisites
  if (!operation.timeline.includes('ATTR')) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Attribution non complétée'),
          el('div', { className: 'alert-message' }, 'Complétez d\'abord l\'attribution pour définir l\'échéancier.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Load existing écheancier + clé (raw, sans scope lot)
  const rawEcheancier = await dataService.get(ENTITIES.MP_ECHEANCIER, `ECH-${idOperation}`);
  const rawCleRepartition = await dataService.get(ENTITIES.MP_CLE_REPARTITION, `CLE-${idOperation}`);

  // Vue scopée au lot courant (merge root + parLot[lotId])
  const echeancier = getLotData(rawEcheancier, currentLotId);
  const cleRepartition = getLotData(rawCleRepartition, currentLotId);

  // Attribution scopée au lot pour le montant marché
  const attributionForLot = getLotData(attribution, currentLotId);
  const montantMarche = attributionForLot?.montants?.ttc || operation.montantPrevisionnel || 0;

  // State
  let echeancierItems = echeancier?.items || [];
  let cleLines = cleRepartition?.lignes || [];

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header — Modif #68
    renderPageHeaderMP({
      idOperation, operation,
      phaseIcon: '✅', phaseLabel: 'Attribution',
      subEcran: 'Échéancier',
      titre: 'Échéancier & Clé de Répartition'
    }),

    // Sélecteur de lot (visible si > 1 lot)
    renderLotSelector({
      lots,
      currentLotId,
      route: '/mp/echeancier',
      routeParams: { idOperation }
    }),

    // KPI Summary
    renderKPISummary(montantMarche, attributionForLot),

    // Clé de répartition
    el('div', { className: 'card', style: { marginBottom: '24px' }, id: 'cle-card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🔑 Clé de Répartition'),
        el('p', { className: 'text-small text-muted', style: { marginTop: '4px' } },
          'Répartition pluri-annuelle et pluri-bailleurs (Σ montants = montant marché, Σ % = 100%)')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { id: 'cle-table-container' }),
        el('div', { style: { marginTop: '16px', display: 'flex', gap: '12px' } }, [
          createButton('btn btn-primary btn-sm', '+ Ajouter ligne', () => addCleLine()),
          createButton('btn btn-secondary btn-sm', '↻ Recalculer', () => recalculateCle())
        ]),
        el('div', { id: 'cle-validation', style: { marginTop: '16px' } })
      ])
    ]),

    // Échéancier — Modif #74 : la saisie complète n'est pas opérationnelle
    // dans cette version (les helpers addEcheanceItem / recalculateEcheancier
    // sont des stubs). On affiche en consultation propre les échéances déjà
    // présentes (depuis la base) et on signale que la saisie est en lecture
    // seule pour la démo. Plus honnête qu'un bouton « + Ajouter » qui ne
    // fait rien et qu'un placeholder « à implémenter ».
    el('div', { className: 'card', style: { marginBottom: '24px' }, id: 'echeancier-card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📅 Échéancier de Paiement'),
        el('p', { className: 'text-small text-muted', style: { marginTop: '4px' } },
          'Échéances de paiement (périodiques ou libres) — consultation pour la maquette')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Type d\'échéancier'),
          createPeriodiciteSelect(echeancier?.periodicite || 'LIBRE')
        ]),
        el('div', { id: 'echeancier-table-container' }),
        el('div', { style: { marginTop: '16px', padding: '10px 12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#6b7280' } },
          'ℹ️ La saisie pas-à-pas de l\'échéancier (ajout/modification/suppression d\'échéances individuelles) sera disponible dans une prochaine itération. Les échéances existantes restent consultables ci-dessus.'),
        el('div', { id: 'echeancier-validation', style: { marginTop: '16px' } })
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer', async () => {
            await handleSave(idOperation, echeancierItems, cleLines, montantMarche, currentLotId, rawEcheancier, rawCleRepartition);
          })
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Initial render
  renderCleTable(cleLines, budgetLine, montantMarche);
  renderEcheancierTable(echeancierItems, montantMarche);
}

/**
 * Render KPI summary
 */
function renderKPISummary(montantMarche, attribution) {
  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
        renderKPI('Montant du marché de base (TTC)', `${(montantMarche / 1000000).toFixed(2)}M XOF`, 'var(--color-primary)'),
        renderKPI('Montant du marché de base (HT)', `${((attribution?.montants?.ht || 0) / 1000000).toFixed(2)}M XOF`, 'var(--color-info)'),
        renderKPI('Délai', `${attribution?.delaiExecution || 0} ${attribution?.delaiUnite || 'MOIS'}`, 'var(--color-warning)')
      ])
    ])
  ]);
}

function renderKPI(label, value, color) {
  return el('div', {
    style: {
      padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${color}30`,
      background: `${color}10`
    }
  }, [
    el('div', { className: 'text-small', style: { color: 'var(--color-text-muted)', marginBottom: '4px' } }, label),
    el('div', { style: { fontSize: '18px', fontWeight: '600', color } }, value)
  ]);
}

/**
 * Create periodicite select
 */
function createPeriodiciteSelect(selectedValue) {
  const select = el('select', { className: 'form-input', id: 'periodicite-select' });

  const options = [
    { code: 'LIBRE', label: 'Libre (dates définies manuellement)' },
    { code: 'MENSUEL', label: 'Mensuel' },
    { code: 'TRIMESTRIEL', label: 'Trimestriel' },
    { code: 'SEMESTRIEL', label: 'Semestriel' },
    { code: 'ANNUEL', label: 'Annuel' }
  ];

  options.forEach(opt => {
    const option = el('option', { value: opt.code }, opt.label);
    if (opt.code === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  return select;
}

/**
 * Render Clé de Répartition table
 */
function renderCleTable(lines, budgetLine, montantMarche) {
  const container = document.getElementById('cle-table-container');
  if (!container) return;

  if (lines.length === 0) {
    container.innerHTML = '';
    const empty = el('div', { className: 'alert alert-info' }, [
      el('div', { className: 'alert-icon' }, 'ℹ️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Aucune ligne de répartition'),
        el('div', { className: 'alert-message' }, 'Ajoutez des lignes pour répartir le financement.')
      ])
    ]);
    container.appendChild(empty);
    return;
  }

  const table = el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table', id: 'cle-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'Année'),
          el('th', {}, 'Bailleur'),
          el('th', {}, 'Type Financement'),
          el('th', {}, 'Base'),
          el('th', {}, 'Montant (XOF)'),
          el('th', {}, '%'),
          el('th', {}, 'Actions')
        ])
      ]),
      el('tbody', {},
        lines.map((line, idx) => renderCleRow(line, idx, montantMarche))
      )
    ])
  ]);

  container.innerHTML = '';
  container.appendChild(table);

  // Validation
  validateCle(lines, montantMarche);
}

function renderCleRow(line, idx, montantMarche) {
  return el('tr', { 'data-cle-idx': idx }, [
    el('td', {}, [
      el('input', {
        type: 'number',
        className: 'form-input form-input-sm',
        value: line.annee || new Date().getFullYear(),
        min: 2020,
        max: 2050,
        'data-cle-field': 'annee',
        'data-cle-idx': idx,
        onchange: () => updateCleLine(idx)
      })
    ]),
    el('td', {}, [
      createBailleurSelect(line.bailleur, idx)
    ]),
    el('td', {}, [
      createTypeFinancementSelect(line.typeFinancement, idx)
    ]),
    el('td', {}, [
      createBaseCalcSelect(line.baseCalc, idx)
    ]),
    el('td', {}, [
      el('input', {
        type: 'number',
        className: 'form-input form-input-sm',
        value: line.montant || 0,
        min: 0,
        step: 100000,
        'data-cle-field': 'montant',
        'data-cle-idx': idx,
        onchange: () => updateCleLine(idx)
      })
    ]),
    el('td', {}, [
      el('input', {
        type: 'number',
        className: 'form-input form-input-sm',
        value: line.pourcentage || 0,
        min: 0,
        max: 100,
        step: 0.1,
        'data-cle-field': 'pourcentage',
        'data-cle-idx': idx,
        disabled: true,
        style: { background: 'var(--color-gray-100)' }
      })
    ]),
    el('td', {}, [
      createButton('btn btn-sm btn-danger', '×', () => removeCleLine(idx))
    ])
  ]);
}

function createBailleurSelect(selected, idx) {
  const select = el('select', {
    className: 'form-input form-input-sm',
    'data-cle-field': 'bailleur',
    'data-cle-idx': idx
  });

  const bailleurs = [
    { code: 'BN', label: 'Budget National' },
    { code: 'BM', label: 'Banque Mondiale' },
    { code: 'BAD', label: 'BAD' },
    { code: 'AFD', label: 'AFD' },
    { code: 'UE', label: 'UE' }
  ];

  bailleurs.forEach(b => {
    const option = el('option', { value: b.code }, b.label);
    if (b.code === selected) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => updateCleLine(idx));
  return select;
}

function createTypeFinancementSelect(selected, idx) {
  const select = el('select', {
    className: 'form-input form-input-sm',
    'data-cle-field': 'typeFinancement',
    'data-cle-idx': idx
  });

  ['ETAT', 'BAILLEUR', 'MIXTE', 'PPP'].forEach(type => {
    const option = el('option', { value: type }, type);
    if (type === selected) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => updateCleLine(idx));
  return select;
}

function createBaseCalcSelect(selected, idx) {
  const select = el('select', {
    className: 'form-input form-input-sm',
    'data-cle-field': 'baseCalc',
    'data-cle-idx': idx
  });

  ['HT', 'TTC'].forEach(base => {
    const option = el('option', { value: base }, base);
    if (base === selected) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => updateCleLine(idx));
  return select;
}

/**
 * Global state for lines
 */
let globalCleLines = [];
let globalEcheancierItems = [];

function addCleLine() {
  const newLine = {
    annee: new Date().getFullYear(),
    bailleur: 'BN',
    typeFinancement: 'ETAT',
    baseCalc: 'TTC',
    montant: 0,
    pourcentage: 0
  };

  globalCleLines.push(newLine);

  // Re-render table
  const montantMarche = parseFloat(document.querySelector('[data-montant-marche]')?.value) || 0;
  renderCleTable(globalCleLines, null, montantMarche);
}

function removeCleLine(idx) {
  globalCleLines.splice(idx, 1);
  const montantMarche = parseFloat(document.querySelector('[data-montant-marche]')?.value) || 0;
  renderCleTable(globalCleLines, null, montantMarche);
}

function updateCleLine(idx) {
  const inputs = document.querySelectorAll(`[data-cle-idx="${idx}"]`);
  const line = {};

  inputs.forEach(input => {
    const field = input.getAttribute('data-cle-field');
    if (field) {
      line[field] = input.tagName === 'SELECT' ? input.value : parseFloat(input.value) || input.value;
    }
  });

  globalCleLines[idx] = { ...globalCleLines[idx], ...line };
  recalculateCle();
}

function recalculateCle() {
  const montantMarche = parseFloat(document.querySelector('[data-montant-marche]')?.value) || 0;
  let totalMontant = 0;

  globalCleLines.forEach(line => {
    totalMontant += line.montant || 0;
    line.pourcentage = montantMarche > 0 ? ((line.montant / montantMarche) * 100) : 0;
  });

  renderCleTable(globalCleLines, null, montantMarche);
}

function validateCle(lines, montantMarche) {
  const validationContainer = document.getElementById('cle-validation');
  if (!validationContainer) return;

  validationContainer.innerHTML = '';

  let totalMontant = 0;
  let totalPourcent = 0;

  lines.forEach(line => {
    totalMontant += line.montant || 0;
    totalPourcent += line.pourcentage || 0;
  });

  const montantDiff = Math.abs(totalMontant - montantMarche);
  const pourcentDiff = Math.abs(totalPourcent - 100);

  const montantValid = montantDiff < 1; // tolerance 1 XOF
  const pourcentValid = pourcentDiff < 0.01; // tolerance 0.01%

  const alerts = [];

  if (!montantValid) {
    alerts.push(el('div', { className: 'alert alert-error' }, [
      el('div', { className: 'alert-icon' }, '❌'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Écart montant détecté'),
        el('div', { className: 'alert-message' },
          `Total répartition: ${(totalMontant / 1000000).toFixed(2)}M XOF | Montant marché: ${(montantMarche / 1000000).toFixed(2)}M XOF | Écart: ${(montantDiff / 1000000).toFixed(2)}M XOF`)
      ])
    ]));
  }

  if (!pourcentValid) {
    alerts.push(el('div', { className: 'alert alert-error' }, [
      el('div', { className: 'alert-icon' }, '❌'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Somme des pourcentages ≠ 100%'),
        el('div', { className: 'alert-message' },
          `Total: ${totalPourcent.toFixed(2)}% (doit être égal à 100%)`)
      ])
    ]));
  }

  if (montantValid && pourcentValid) {
    alerts.push(el('div', { className: 'alert alert-success' }, [
      el('div', { className: 'alert-icon' }, '✅'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Clé de répartition valide'),
        el('div', { className: 'alert-message' },
          `Total: ${(totalMontant / 1000000).toFixed(2)}M XOF (100%)`)
      ])
    ]));
  }

  alerts.forEach(alert => validationContainer.appendChild(alert));
}

/**
 * Render Échéancier table (similar pattern)
 */
function renderEcheancierTable(items, montantMarche) {
  const container = document.getElementById('echeancier-table-container');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '';
    const empty = el('div', {
      style: {
        padding: '14px 16px',
        background: '#f9fafb',
        border: '1px dashed #d1d5db',
        borderRadius: '6px',
        color: '#6b7280',
        fontSize: '13px',
        fontStyle: 'italic'
      }
    }, 'Aucune échéance n\'a encore été saisie pour ce marché.');
    container.appendChild(empty);
    return;
  }

  // Modif #74 — Rendu lecture seule des échéances existantes (cohérent
  // avec le pattern de renderCleTable). Remplace le placeholder
  // « Tableau échéancier à implémenter » qui apparaissait en démo.
  container.innerHTML = '';
  const total = items.reduce((sum, it) => sum + (Number(it.montant) || 0), 0);
  const tbody = items.map((it, idx) => el('tr', {}, [
    el('td', {}, String(idx + 1)),
    el('td', {}, it.libelle || it.objet || `Échéance ${idx + 1}`),
    el('td', {}, it.dateEcheance || it.date || '-'),
    el('td', { style: { textAlign: 'right' } },
      (Number(it.montant) || 0).toLocaleString('fr-FR') + ' XOF'),
    el('td', { style: { textAlign: 'right' } },
      montantMarche > 0
        ? ((Number(it.montant) || 0) / montantMarche * 100).toFixed(2) + '%'
        : '-')
  ]));
  const table = el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
    el('thead', {}, [el('tr', {}, [
      el('th', { style: { width: '40px' } }, '#'),
      el('th', {}, 'Libellé'),
      el('th', { style: { width: '120px' } }, 'Date prévue'),
      el('th', { style: { width: '140px', textAlign: 'right' } }, 'Montant'),
      el('th', { style: { width: '70px', textAlign: 'right' } }, '%')
    ])]),
    el('tbody', {}, tbody),
    el('tfoot', {}, [el('tr', { style: { fontWeight: 600, background: '#f9fafb' } }, [
      el('td', { colSpan: 3, style: { textAlign: 'right' } }, 'Total échéancier'),
      el('td', { style: { textAlign: 'right' } }, total.toLocaleString('fr-FR') + ' XOF'),
      el('td', { style: { textAlign: 'right' } },
        montantMarche > 0 ? (total / montantMarche * 100).toFixed(2) + '%' : '-')
    ])])
  ]);
  container.appendChild(table);
}

function addEcheanceItem() {
  // Implementation
}

function recalculateEcheancier() {
  // Implementation
}

/**
 * Handle save
 *
 * Marché+ multi-lot : si lotId est fourni, les champs métier vont sous
 * `entity.parLot[lotId]` plutôt qu'à la racine (back-compat single-lot).
 */
async function handleSave(idOperation, echeancierItems, cleLines, montantMarche, lotId = null, rawEcheancier = null, rawCleRepartition = null) {
  // Validation
  let totalMontant = 0;
  let totalPourcent = 0;

  cleLines.forEach(line => {
    totalMontant += line.montant || 0;
    totalPourcent += line.pourcentage || 0;
  });

  const montantValid = Math.abs(totalMontant - montantMarche) < 1;
  const pourcentValid = Math.abs(totalPourcent - 100) < 0.01;

  if (!montantValid || !pourcentValid) {
    alert('⚠️ Clé de répartition invalide. Vérifiez les totaux.');
    return;
  }

  // Save clé (per-lot ou racine selon lotId)
  const cleId = `CLE-${idOperation}`;
  const cleLotFields = {
    lignes: cleLines,
    total: totalMontant,
    sumPourcent: totalPourcent
  };
  const clePatch = buildLotPatch(lotId, cleLotFields, rawCleRepartition);

  const existingCle = rawCleRepartition || await dataService.get(ENTITIES.MP_CLE_REPARTITION, cleId);
  let cleResult;
  if (existingCle) {
    cleResult = await dataService.update(ENTITIES.MP_CLE_REPARTITION, cleId, {
      ...clePatch,
      operationId: idOperation,
      updatedAt: new Date().toISOString()
    });
  } else {
    cleResult = await dataService.add(ENTITIES.MP_CLE_REPARTITION, {
      ...clePatch,
      id: cleId,
      operationId: idOperation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (!cleResult.success) {
    alert('❌ Erreur lors de la sauvegarde de la clé de répartition');
    return;
  }

  // Save échéancier (per-lot ou racine selon lotId)
  const echId = `ECH-${idOperation}`;
  const echLotFields = {
    items: echeancierItems
  };
  const echPatch = buildLotPatch(lotId, echLotFields, rawEcheancier);

  const existingEch = rawEcheancier || await dataService.get(ENTITIES.MP_ECHEANCIER, echId);
  if (existingEch) {
    await dataService.update(ENTITIES.MP_ECHEANCIER, echId, {
      ...echPatch,
      operationId: idOperation,
      updatedAt: new Date().toISOString()
    });
  } else {
    await dataService.add(ENTITIES.MP_ECHEANCIER, {
      ...echPatch,
      id: echId,
      operationId: idOperation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  logger.info('[Écheancier-Clé] Enregistrement réussi', { lotId });
  alert('✅ Échéancier et clé de répartition enregistrés');
  router.navigate('/mp/fiche-marche', { idOperation });
}

export default renderEcheancierCle;
