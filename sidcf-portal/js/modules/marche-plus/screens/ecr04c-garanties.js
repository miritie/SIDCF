/* ============================================
   ECR04C - Gestion des Garanties
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps-mp.js';
import logger from '../../../lib/logger.js';
import { getLotData, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { renderMontantPourcentageDualInput } from '../../../ui/widgets/montant-pourcentage-dual-input.js';

// API exposée par le widget dual courant pour la garantie en saisie
let _garantieDualApi = null;
let _garantieBaseCalc = 'HT';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderGaranties(params) {
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

  const { operation, attribution, procedure } = fullData;
  const rulesConfig = dataService.getRulesConfig();

  // Marché+ multi-lot : résoudre le lot courant
  const lots = getLotsFromProcedure(procedure);
  const currentLotId = resolveCurrentLotId(lots, params);

  // Check if market is terminated (resiliée)
  const isResilie = operation.etat === 'RESILIE';

  // Check prerequisites
  if (isResilie) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-error' }, [
        el('div', { className: 'alert-icon' }, '🚫'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Marché résilié'),
          el('div', { className: 'alert-message' }, 'Aucune action n\'est possible sur un marché résilié.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  if (!operation.timeline.includes('VISE')) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Approbation non accordée'),
          el('div', { className: 'alert-message' }, 'Les garanties ne sont requises qu\'après l\'obtention du visa CF.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Load garanties (filtrées au lot courant ; back-compat : si pas de lotId, inclure)
  const garantiesRaw = await dataService.query(ENTITIES.MP_GARANTIE, { operationId: idOperation });
  const garanties = currentLotId
    ? garantiesRaw.filter(g => !g.lotId || g.lotId === currentLotId)
    : garantiesRaw;

  // Attribution scopée au lot pour les montants HT/TTC
  const attributionForLot = getLotData(attribution, currentLotId);
  const montantMarcheTTC = Number(attributionForLot?.montants?.ttc) || Number(operation.montantPrevisionnel) || 0;
  const montantMarcheHT = Number(attributionForLot?.montants?.ht) || (montantMarcheTTC / 1.18);
  // Total marché total affiché dans le résumé (TTC par défaut, compat existant)
  const montantMarche = montantMarcheTTC;

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/mp/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Gestion des Garanties'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Sélecteur de lot (visible si > 1 lot)
    renderLotSelector({
      lots,
      currentLotId,
      route: '/mp/garanties',
      routeParams: { idOperation }
    }),

    // Summary
    renderGarantiesSummary(garanties, montantMarche, rulesConfig),

    // Garanties list
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `🛡️ Garanties enregistrées (${garanties.length})`)
      ]),
      el('div', { className: 'card-body' }, [
        garanties.length > 0
          ? renderGarantiesTable(garanties, rulesConfig)
          : el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Aucune garantie enregistrée'),
                el('div', { className: 'alert-message' }, 'Ajoutez les garanties bancaires requises.')
              ])
            ])
      ])
    ]),

    // Add garantie form
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '➕ Ajouter une garantie')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Type de garantie',
              el('span', { className: 'required' }, '*')
            ]),
            createTypeGarantieSelect(rulesConfig)
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Base de calcul'),
            el('select', { className: 'form-input', id: 'garantie-base-calc' }, [
              el('option', { value: 'HT', selected: true }, 'HT'),
              el('option', { value: 'TTC' }, 'TTC')
            ]),
            el('small', { className: 'text-muted' }, 'Base du montant marché')
          ])
        ]),

        // Widget DUAL montant + % (synchronisés bidirectionnellement)
        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, [
            'Montant et pourcentage',
            el('span', { className: 'required' }, '*')
          ]),
          el('div', {
            id: 'garantie-montant-host',
            'data-montant-marche-ht': String(montantMarcheHT),
            'data-montant-marche-ttc': String(montantMarcheTTC)
          }),
          el('small', { className: 'text-muted' }, 'Les deux champs sont synchronisés : modifier l\'un met à jour l\'autre.')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Date émission',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'garantie-date-emission',
              value: new Date().toISOString().split('T')[0]
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Date échéance',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'garantie-date-echeance'
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Document de garantie (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'garantie-document',
            accept: '.pdf'
          })
        ]),

        el('div', { style: { display: 'flex', justifyContent: 'flex-end' } }, [
          createButton('btn btn-primary', 'Enregistrer la garantie', async () => {
            await handleAddGarantie(idOperation, montantMarche, currentLotId);
          })
        ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        createButton('btn btn-secondary', '← Retour', () => router.navigate('/mp/fiche-marche', { idOperation }))
      ])
    ])
  ]);

  mount('#app', page);

  // Setup listeners — widget dual montant/% avec base HT/TTC
  setupGarantieListeners(montantMarcheTTC, montantMarcheHT, rulesConfig);
}

/**
 * Render garanties summary
 */
function renderGarantiesSummary(garanties, montantMarche, rulesConfig) {
  const tauxRecommandes = rulesConfig?.garanties || {};

  const garantiesByType = {
    'AVANCE': garanties.filter(g => g.type === 'AVANCE' && g.etat === 'ACTIVE'),
    'BONNE_EXEC': garanties.filter(g => g.type === 'BONNE_EXEC' && g.etat === 'ACTIVE'),
    'RETENUE': garanties.filter(g => g.type === 'RETENUE' && g.etat === 'ACTIVE')
  };

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📊 Vue d\'ensemble')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
        renderGarantieKPI('Montant marché', `${(montantMarche / 1000000).toFixed(2)}M XOF`, 'var(--color-primary)'),
        renderGarantieKPI('Garanties actives', garanties.filter(g => g.etat === 'ACTIVE').length, 'var(--color-success)'),
        renderGarantieKPI('Mainlevées', garanties.filter(g => g.mainleveeDate).length, 'var(--color-info)')
      ])
    ])
  ]);
}

function renderGarantieKPI(label, value, color) {
  return el('div', {
    style: {
      padding: '12px',
      borderRadius: '6px',
      border: `1px solid ${color}30`,
      background: `${color}10`
    }
  }, [
    el('div', { className: 'text-small', style: { color: 'var(--color-text-muted)', marginBottom: '4px' } }, label),
    el('div', { style: { fontSize: '18px', fontWeight: '600', color } }, String(value))
  ]);
}

/**
 * Create type garantie select
 */
function createTypeGarantieSelect(rulesConfig) {
  const select = el('select', { className: 'form-input', id: 'garantie-type' });

  const emptyOption = el('option', { value: '' }, '-- Sélectionnez --');
  select.appendChild(emptyOption);

  const types = rulesConfig?.referentiels?.types_garantie || [
    { code: 'AVANCE', label: 'Garantie de restitution d\'avance' },
    { code: 'BONNE_EXEC', label: 'Garantie de bonne exécution' },
    { code: 'RETENUE', label: 'Retenue de garantie' },
    { code: 'DECENNALE', label: 'Garantie décennale' }
  ];

  types.forEach(type => {
    const option = el('option', { value: type.code }, type.label);
    select.appendChild(option);
  });

  return select;
}

/**
 * Setup garantie listeners — widget DUAL montant/% (Marché+ modif #23)
 */
function setupGarantieListeners(montantMarcheTTC, montantMarcheHT, rulesConfig) {
  const typeSelect = document.getElementById('garantie-type');
  const baseSelect = document.getElementById('garantie-base-calc');
  const host = document.getElementById('garantie-montant-host');
  const dateEmissionInput = document.getElementById('garantie-date-emission');
  const dateEcheanceInput = document.getElementById('garantie-date-echeance');

  if (!typeSelect || !host || !baseSelect) return;

  _garantieBaseCalc = baseSelect.value === 'TTC' ? 'TTC' : 'HT';
  const currentTotal = () => (_garantieBaseCalc === 'TTC' ? montantMarcheTTC : montantMarcheHT);

  // Construire le widget dual une fois
  const widget = renderMontantPourcentageDualInput({
    idPrefix: 'garantie',
    total: currentTotal(),
    value: 0,
    mode: 'POURCENTAGE', // Garanties typiquement saisies en taux
    required: true
  });
  host.innerHTML = '';
  host.appendChild(widget);
  _garantieDualApi = widget._mpDual;

  // Bascule HT/TTC → setTotal sur le widget
  baseSelect.addEventListener('change', () => {
    _garantieBaseCalc = baseSelect.value === 'TTC' ? 'TTC' : 'HT';
    _garantieDualApi.setTotal(currentTotal());
  });

  // Type → taux recommandé + montant calculé sur la base courante
  typeSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    const garantiesConfig = rulesConfig?.garanties || {};

    let tauxRecommande = 10;
    let dureeDays = 365;

    if (type === 'AVANCE') {
      tauxRecommande = garantiesConfig.garantie_avance?.taux_min || 10;
      dureeDays = garantiesConfig.durees?.garantie_avance?.value || 365;
    } else if (type === 'BONNE_EXEC') {
      tauxRecommande = garantiesConfig.garantie_bonne_execution?.taux_min || 5;
      dureeDays = garantiesConfig.durees?.garantie_bonne_exec?.value || 730;
    } else if (type === 'RETENUE') {
      tauxRecommande = garantiesConfig.retenue_garantie?.taux || 10;
      dureeDays = 365;
    }

    // Appliquer le taux recommandé : on calcule le montant correspondant et on l'injecte
    // dans le widget (les deux champs montant + % s'actualisent en cohérence).
    const total = currentTotal();
    const montantRecommande = (total * tauxRecommande) / 100;
    _garantieDualApi.setMontant(montantRecommande);

    // Calculate echeance
    if (dateEmissionInput?.value) {
      const dateEmission = new Date(dateEmissionInput.value);
      const dateEcheance = new Date(dateEmission);
      dateEcheance.setDate(dateEcheance.getDate() + dureeDays);
      if (dateEcheanceInput) dateEcheanceInput.value = dateEcheance.toISOString().split('T')[0];
    }
  });
}

/**
 * Render garanties table
 */
function renderGarantiesTable(garanties, rulesConfig) {
  return el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'Type'),
          el('th', {}, 'Base'),
          el('th', {}, 'Taux'),
          el('th', {}, 'Montant'),
          el('th', {}, 'Émission'),
          el('th', {}, 'Échéance'),
          el('th', {}, 'État'),
          el('th', {}, 'Mainlevée'),
          el('th', {}, 'Actions')
        ])
      ]),
      el('tbody', {},
        garanties.map(garantie => renderGarantieRow(garantie, rulesConfig))
      )
    ])
  ]);
}

function renderGarantieRow(garantie, rulesConfig) {
  const typeObj = rulesConfig?.referentiels?.types_garantie?.find(t => t.code === garantie.type);

  return el('tr', {}, [
    el('td', { style: { fontWeight: '500' } }, typeObj?.label || garantie.type),
    el('td', {}, garantie.baseCalc || 'TTC'),
    el('td', {}, `${(garantie.taux ?? 0).toFixed(2)}%`),
    el('td', {}, `${(garantie.montant / 1000000).toFixed(2)}M`),
    el('td', {}, garantie.dateEmission ? new Date(garantie.dateEmission).toLocaleDateString() : '-'),
    el('td', {}, garantie.dateEcheance ? new Date(garantie.dateEcheance).toLocaleDateString() : '-'),
    el('td', {}, renderEtatBadge(garantie.etat)),
    el('td', {}, garantie.mainleveeDate ? new Date(garantie.mainleveeDate).toLocaleDateString() : '-'),
    el('td', {}, [
      !garantie.mainleveeDate
        ? createButton('btn btn-sm btn-warning', 'Mainlevée', () => handleMainlevee(garantie.id))
        : el('span', { className: 'text-muted text-small' }, '✓ Levée')
    ])
  ]);
}

function renderEtatBadge(etat) {
  const colorMap = {
    'ACTIVE': 'var(--color-success)',
    'EXPIREE': 'var(--color-error)',
    'LEVEE': 'var(--color-info)'
  };

  const color = colorMap[etat] || 'var(--color-gray-500)';

  return el('span', {
    style: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      background: `${color}20`,
      color: color
    }
  }, etat);
}

/**
 * Handle add garantie
 *
 * Marché+ multi-lot : si lotId est fourni, on l'enregistre sur le record
 * (chaque garantie est rattachée à un lot précis ; null pour mono-lot).
 */
async function handleAddGarantie(idOperation, montantMarche, lotId = null) {
  const type = document.getElementById('garantie-type')?.value;
  const baseCalc = document.getElementById('garantie-base-calc')?.value === 'TTC' ? 'TTC' : 'HT';
  const dateEmission = document.getElementById('garantie-date-emission')?.value;
  const dateEcheance = document.getElementById('garantie-date-echeance')?.value;
  const docInput = document.getElementById('garantie-document');

  // Lire montant + dériver taux via le widget dual
  const montant = _garantieDualApi ? _garantieDualApi.getMontant() : 0;
  const saisieMode = _garantieDualApi ? _garantieDualApi.getMode() : 'POURCENTAGE';
  // Le taux est dérivé du montant et de la base courante pour rester cohérent avec l'affichage.
  // (Note : montantMarche passé en paramètre = TTC ; on recalcule selon baseCalc choisi.)
  const totalBase = baseCalc === 'TTC' ? montantMarche : (montantMarche / 1.18);
  const taux = totalBase > 0 ? parseFloat(((montant / totalBase) * 100).toFixed(4)) : 0;

  // Validation
  if (!type || !montant || montant <= 0 || !dateEmission || !dateEcheance) {
    alert('⚠️ Veuillez renseigner tous les champs obligatoires');
    return;
  }

  // Handle document
  let doc = null;
  if (docInput?.files?.[0]) {
    doc = 'DOC_GAR_' + Date.now() + '.pdf';
    logger.info('[Garanties] Document uploadé:', doc);
  }

  // Create garantie
  const garantieId = `GAR-${idOperation}-${Date.now()}`;
  const garantieData = {
    id: garantieId,
    operationId: idOperation,
    lotId: lotId || null,
    type,
    taux,
    montant,
    baseCalc, // HT | TTC — base sur laquelle le taux a été évalué (Marché+ modif #23)
    saisieMode, // 'MONTANT' ou 'POURCENTAGE' — dernier champ saisi
    dateEmission,
    dateEcheance,
    etat: 'ACTIVE',
    doc,
    mainleveeDate: null,
    mainleveeDoc: null,
    createdAt: new Date().toISOString()
  };

  const result = await dataService.add(ENTITIES.MP_GARANTIE, garantieData);

  if (!result.success) {
    alert('❌ Erreur lors de l\'enregistrement de la garantie');
    return;
  }

  logger.info('[Garanties] Garantie créée:', garantieId);
  alert('✅ Garantie enregistrée avec succès');

  // Reload
  router.navigate('/mp/garanties', { idOperation, lotId });
}

/**
 * Handle mainlevee
 */
async function handleMainlevee(garantieId) {
  if (!confirm('Confirmer la mainlevée de cette garantie ?')) {
    return;
  }

  const updateData = {
    etat: 'LEVEE',
    mainleveeDate: new Date().toISOString(),
    mainleveeDoc: 'DOC_MAINLEVEE_' + Date.now() + '.pdf',
    updatedAt: new Date().toISOString()
  };

  const result = await dataService.update(ENTITIES.MP_GARANTIE, garantieId, updateData);

  if (result.success) {
    alert('✅ Mainlevée enregistrée');
    location.reload();
  } else {
    alert('❌ Erreur lors de la mainlevée');
  }
}

export default renderGaranties;
