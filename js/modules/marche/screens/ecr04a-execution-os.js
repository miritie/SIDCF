/* ============================================
   ECR04A - Exécution & Ordres de Service
   Simplifié : OS de démarrage unique + lien Avenants
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';
import { money } from '../../../lib/format.js';
import logger from '../../../lib/logger.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
}

/**
 * Format bureau display
 */
function formatBureau(bureau) {
  if (!bureau || !bureau.type) return '-';
  if (bureau.type === 'UA') {
    return `🏛️ ${bureau.nom || 'UA'}`;
  } else if (bureau.type === 'ENTREPRISE') {
    return `🏢 ${bureau.nom || 'Entreprise'}`;
  }
  return '-';
}

export async function renderExecutionOS(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  // Load data
  const fullData = await dataService.getOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
    ]));
    return;
  }

  const { operation, attribution, ordresService, visasCF, avenants } = fullData;
  const registries = dataService.getAllRegistries();

  // Vérifier si l'OS de démarrage existe déjà
  // Le premier OS créé est considéré comme l'OS de démarrage
  const osDemarrage = ordresService && ordresService.length > 0 ? ordresService[0] : null;
  const hasOSDemarrage = !!osDemarrage;

  // Helper pour vérifier si l'attribution est complète (supporte les deux structures)
  const isAttributionComplete = (attr) => {
    if (!attr) return false;
    // Nouvelle structure JSONB (PostgreSQL)
    const hasAttributaire = attr.attributaire?.nom || attr.attributaire?.entrepriseId;
    const hasMontant = attr.montants?.attribue > 0 || attr.montants?.ttc > 0;
    if (hasAttributaire && hasMontant) return true;
    // Ancienne structure
    if (attr.titulaire && attr.montantAttribue > 0) return true;
    return false;
  };

  // Check if attribution is complete
  if (!isAttributionComplete(attribution)) {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Attribution incomplète'),
          el('div', { className: 'alert-message' }, 'L\'attribution doit être complétée (titulaire et montant) avant de pouvoir démarrer l\'exécution.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Déterminer si le visa CF est requis selon le mode de passation
  const modePassation = operation.modePassation || 'PSD';
  const visaRequired = ['PSL', 'PSO', 'AOO', 'PI'].includes(modePassation);

  // Check if visa CF granted (si requis)
  const visaFavorable = visasCF && visasCF.length > 0 &&
    visasCF.some(v => ['VISA', 'FAVORABLE', 'VISE', 'VISE_RESERVE'].includes(v.decision));

  if (visaRequired && !visaFavorable && operation.etat !== 'EN_EXEC' && operation.etat !== 'CLOS') {
    mount('#app', el('div', { className: 'page' }, [
      renderSteps(fullData, idOperation),
      el('div', { className: 'alert alert-warning' }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Visa CF non accordé'),
          el('div', { className: 'alert-message' }, 'L\'exécution ne peut commencer que si le Contrôle Financier a accordé son visa favorable.')
        ])
      ]),
      el('div', { style: { marginTop: '16px' } }, [
        createButton('btn btn-primary', '← Vers Engagement', () => router.navigate('/visa-cf', { idOperation })),
        createButton('btn btn-secondary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ]));
    return;
  }

  // Check delay alert (OS > 30 days after visa)
  const delayAlert = checkDelayAlert(operation, ordresService);

  // Calcul des KPIs pour les avenants
  const montantInitial = attribution?.montants?.ttc || attribution?.montants?.attribue || operation?.montantPrevisionnel || 0;
  const totalAvenants = avenants?.reduce((sum, av) => sum + (av.variationMontant || 0), 0) || 0;
  const montantActuel = montantInitial + totalAvenants;
  const pourcentageAvenants = montantInitial > 0 ? (totalAvenants / montantInitial) * 100 : 0;

  const page = el('div', { className: 'page' }, [
    // Timeline
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Exécution du marché'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // Delay alert (if applicable)
    delayAlert ? delayAlert : null,

    // Attribution summary
    renderAttributionSummary(attribution),

    // =========================================
    // SECTION 1: Ordre de Service de Démarrage
    // =========================================
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🚀 Ordre de Service de Démarrage')
      ]),
      el('div', { className: 'card-body' }, [
        hasOSDemarrage
          // Afficher l'OS de démarrage existant
          ? el('div', {}, [
              el('div', { className: 'alert alert-success', style: { marginBottom: '16px' } }, [
                el('div', { className: 'alert-icon' }, '✅'),
                el('div', { className: 'alert-content' }, [
                  el('div', { className: 'alert-title' }, 'Travaux démarrés'),
                  el('div', { className: 'alert-message' }, `OS n° ${osDemarrage.numero} émis le ${formatDate(osDemarrage.dateEmission)}`)
                ])
              ]),
              el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
                renderField('Numéro OS', osDemarrage.numero),
                renderField('Date d\'émission', formatDate(osDemarrage.dateEmission)),
                renderField('Bureau de contrôle', formatBureau(osDemarrage.bureauControle)),
                renderField('Bureau d\'études', formatBureau(osDemarrage.bureauEtudes))
              ]),
              osDemarrage.objet ? el('div', { style: { marginTop: '16px' } }, [
                el('div', { className: 'text-small text-muted' }, 'Objet'),
                el('div', { style: { marginTop: '4px' } }, osDemarrage.objet)
              ]) : null
            ])
          // Formulaire pour créer l'OS de démarrage
          : el('div', {}, [
              el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
                el('div', { className: 'alert-icon' }, 'ℹ️'),
                el('div', { className: 'alert-content' }, [
                  el('div', { className: 'alert-title' }, 'Travaux non démarrés'),
                  el('div', { className: 'alert-message' }, 'Émettez l\'ordre de service de démarrage pour lancer l\'exécution du marché.')
                ])
              ]),

              el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } }, [
                el('div', { className: 'form-field' }, [
                  el('label', { className: 'form-label' }, [
                    'Numéro OS',
                    el('span', { className: 'required' }, '*')
                  ]),
                  el('input', {
                    type: 'text',
                    className: 'form-input',
                    id: 'os-numero',
                    placeholder: 'Ex: OS-2024-001'
                  })
                ]),

                el('div', { className: 'form-field' }, [
                  el('label', { className: 'form-label' }, [
                    'Date d\'émission',
                    el('span', { className: 'required' }, '*')
                  ]),
                  el('input', {
                    type: 'date',
                    className: 'form-input',
                    id: 'os-date',
                    value: new Date().toISOString().split('T')[0]
                  })
                ])
              ]),

              // Bureau de contrôle & Bureau d'études
              el('div', { style: { marginTop: '16px' } }, [
                el('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '12px' } }, 'Bureau de contrôle / Bureau d\'études')
              ]),

              el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' } }, [
                // Bureau de contrôle
                el('div', { style: { border: '1px solid var(--color-gray-300)', borderRadius: '8px', padding: '12px' } }, [
                  el('div', { className: 'form-field', style: { marginBottom: '8px' } }, [
                    el('label', { className: 'form-label' }, 'Bureau de Contrôle'),
                    el('select', { className: 'form-input', id: 'bc-type' }, [
                      el('option', { value: '' }, 'Non défini'),
                      el('option', { value: 'UA' }, 'Unité Administrative'),
                      el('option', { value: 'ENTREPRISE' }, 'Entreprise externe')
                    ])
                  ]),
                  el('div', { className: 'form-field', id: 'bc-field-container' })
                ]),

                // Bureau d'études
                el('div', { style: { border: '1px solid var(--color-gray-300)', borderRadius: '8px', padding: '12px' } }, [
                  el('div', { className: 'form-field', style: { marginBottom: '8px' } }, [
                    el('label', { className: 'form-label' }, 'Bureau d\'Études'),
                    el('select', { className: 'form-input', id: 'be-type' }, [
                      el('option', { value: '' }, 'Non défini'),
                      el('option', { value: 'UA' }, 'Unité Administrative'),
                      el('option', { value: 'ENTREPRISE' }, 'Entreprise externe')
                    ])
                  ]),
                  el('div', { className: 'form-field', id: 'be-field-container' })
                ])
              ]),

              el('div', { className: 'form-field', style: { marginTop: '8px' } }, [
                el('label', { className: 'form-label' }, 'Objet / Description'),
                el('textarea', {
                  className: 'form-input',
                  id: 'os-objet',
                  rows: 2,
                  placeholder: 'Description de l\'ordre de service...'
                })
              ]),

              el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
                el('label', { className: 'form-label' }, 'Document OS (PDF)'),
                el('input', {
                  type: 'file',
                  className: 'form-input',
                  id: 'os-document',
                  accept: '.pdf'
                })
              ]),

              el('div', { style: { marginTop: '16px', display: 'flex', justifyContent: 'flex-end' } }, [
                createButton('btn btn-primary', '🚀 Émettre l\'OS de démarrage', async () => {
                  await handleAddOSDemarrage(idOperation);
                })
              ])
            ])
      ])
    ]),

    // =========================================
    // SECTION 2: Avenants au marché
    // =========================================
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('h3', { className: 'card-title' }, `📑 Avenants au marché (${avenants?.length || 0})`),
          hasOSDemarrage
            ? createButton('btn btn-sm btn-primary', '➕ Nouvel avenant', () => {
                router.navigate('/avenant-create', { idOperation });
              })
            : null
        ])
      ]),
      el('div', { className: 'card-body' }, [
        !hasOSDemarrage
          ? el('div', { className: 'alert alert-info' }, [
              el('div', { className: 'alert-icon' }, 'ℹ️'),
              el('div', { className: 'alert-content' }, [
                el('div', { className: 'alert-title' }, 'Exécution non démarrée'),
                el('div', { className: 'alert-message' }, 'Les avenants ne peuvent être enregistrés qu\'après l\'émission de l\'OS de démarrage.')
              ])
            ])
          : avenants && avenants.length > 0
            ? el('div', {}, [
                // Résumé des avenants
                el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' } }, [
                  el('div', { style: { textAlign: 'center', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Montant initial'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px' } }, money(montantInitial))
                  ]),
                  el('div', { style: { textAlign: 'center', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Total avenants'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px', color: totalAvenants >= 0 ? 'var(--color-success)' : 'var(--color-error)' } },
                      `${totalAvenants >= 0 ? '+' : ''}${money(totalAvenants)}`)
                  ]),
                  el('div', { style: { textAlign: 'center', padding: '12px', background: 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Montant actuel'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px' } }, money(montantActuel))
                  ]),
                  el('div', { style: { textAlign: 'center', padding: '12px', background: pourcentageAvenants > 25 ? 'var(--color-warning-bg)' : 'var(--color-gray-100)', borderRadius: '8px' } }, [
                    el('div', { className: 'text-small text-muted' }, 'Cumul (%)'),
                    el('div', { style: { fontWeight: '600', fontSize: '14px', color: pourcentageAvenants > 25 ? 'var(--color-warning)' : 'inherit' } },
                      `${pourcentageAvenants.toFixed(1)}%`)
                  ])
                ]),
                // Liste simplifiée des avenants
                el('div', { style: { overflowX: 'auto' } }, [
                  el('table', { className: 'data-table' }, [
                    el('thead', {}, [
                      el('tr', {}, [
                        el('th', {}, 'N°'),
                        el('th', {}, 'Type'),
                        el('th', {}, 'Variation'),
                        el('th', {}, 'Date'),
                        el('th', {}, 'Motif')
                      ])
                    ]),
                    el('tbody', {},
                      avenants.map(av => el('tr', {}, [
                        el('td', { style: { fontWeight: '500' } }, av.numero || '-'),
                        el('td', {}, av.type || av.typeRef || '-'),
                        el('td', { style: { color: (av.variationMontant || 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' } },
                          av.variationMontant ? money(av.variationMontant) : '-'),
                        el('td', {}, av.dateSignature ? formatDate(av.dateSignature) : '-'),
                        el('td', { className: 'text-small' }, av.motifRef || av.motif || '-')
                      ]))
                    )
                  ])
                ]),
                // Lien vers l'écran complet
                el('div', { style: { marginTop: '16px', textAlign: 'right' } }, [
                  createButton('btn btn-sm btn-secondary', 'Voir tous les avenants →', () => {
                    router.navigate('/avenants', { idOperation });
                  })
                ])
              ])
            : el('div', { className: 'text-center text-muted', style: { padding: '24px' } }, [
                el('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '📄'),
                el('div', {}, 'Aucun avenant enregistré'),
                el('div', { className: 'text-small', style: { marginTop: '8px' } },
                  'Les avenants peuvent être ajoutés à tout moment pendant l\'exécution du marché.')
              ])
      ])
    ]),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('div', { className: 'text-small text-muted' },
            hasOSDemarrage
              ? `Travaux démarrés le ${formatDate(osDemarrage.dateEmission)} • ${avenants?.length || 0} avenant(s)`
              : 'Travaux non démarrés'),
          el('div', { style: { display: 'flex', gap: '8px' } }, [
            hasOSDemarrage
              ? createButton('btn btn-secondary', 'Avenants & Résiliation', () => router.navigate('/avenants', { idOperation }))
              : null,
            createButton('btn btn-secondary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
          ])
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Setup bureau listeners si formulaire affiché
  if (!hasOSDemarrage) {
    setupBureauListeners();
  }
}

/**
 * Setup bureau type listeners
 */
function setupBureauListeners() {
  const bcTypeSelect = document.getElementById('bc-type');
  const beTypeSelect = document.getElementById('be-type');

  if (bcTypeSelect) {
    bcTypeSelect.addEventListener('change', (e) => {
      renderBureauField('bc', e.target.value);
    });
  }

  if (beTypeSelect) {
    beTypeSelect.addEventListener('change', (e) => {
      renderBureauField('be', e.target.value);
    });
  }
}

/**
 * Render bureau field based on type
 */
function renderBureauField(prefix, type) {
  const container = document.getElementById(`${prefix}-field-container`);
  if (!container) return;

  container.innerHTML = '';

  if (!type) return;

  if (type === 'UA') {
    const field = el('div', {}, [
      el('label', { className: 'form-label' }, 'Sélectionner l\'UA'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: `${prefix}-ua-nom`,
        placeholder: 'Nom de l\'UA'
      })
    ]);
    container.appendChild(field);
  } else if (type === 'ENTREPRISE') {
    const field = el('div', {}, [
      el('label', { className: 'form-label' }, 'Nom de l\'entreprise'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: `${prefix}-entreprise-nom`,
        placeholder: 'Raison sociale'
      })
    ]);
    container.appendChild(field);
  }
}

/**
 * Check delay alert (OS > 30 days after visa)
 */
function checkDelayAlert(operation, ordresService) {
  if (!operation.dateCF) return null;

  const visaDate = new Date(operation.dateCF);
  const today = new Date();
  const daysSinceVisa = Math.floor((today - visaDate) / (1000 * 60 * 60 * 24));

  // Get rules config
  const rulesConfig = dataService.getRulesConfig();
  const maxDays = rulesConfig?.seuils?.DELAI_MAX_OS_APRES_VISA?.value || 30;

  if (daysSinceVisa > maxDays && (!ordresService || ordresService.length === 0)) {
    return el('div', { className: 'card', style: { marginBottom: '24px', borderColor: 'var(--color-warning)' } }, [
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-warning' }, [
          el('div', { className: 'alert-icon' }, '⏰'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Délai dépassé'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, `Le visa CF a été accordé il y a ${daysSinceVisa} jours (le ${visaDate.toLocaleDateString()}).`),
              el('p', { style: { marginTop: '8px', fontWeight: '600' } }, `⚠️ Délai maximal recommandé: ${maxDays} jours`)
            ])
          ])
        ])
      ])
    ]);
  }

  return null;
}

/**
 * Render attribution summary
 */
function renderAttributionSummary(attribution) {
  if (!attribution) return null;

  // Extraire le nom de l'attributaire - supporte plusieurs structures
  let attributaireName = 'N/A';
  if (attribution.attributaire) {
    // Structure avec entreprises[]
    if (attribution.attributaire.entreprises && attribution.attributaire.entreprises.length > 0) {
      const isSimple = attribution.attributaire.singleOrGroup === 'SIMPLE';
      if (isSimple) {
        attributaireName = attribution.attributaire.entreprises[0]?.raisonSociale || 'N/A';
      } else {
        const mandataire = attribution.attributaire.entreprises.find(e => e.role === 'MANDATAIRE');
        attributaireName = mandataire?.raisonSociale || attribution.attributaire.entreprises[0]?.raisonSociale || 'N/A';
      }
    }
    // Structure simple avec nom direct
    else if (attribution.attributaire.nom) {
      attributaireName = attribution.attributaire.nom;
    }
    // Structure simple avec raisonSociale directe
    else if (attribution.attributaire.raisonSociale) {
      attributaireName = attribution.attributaire.raisonSociale;
    }
  }
  // Ancienne structure avec titulaire
  else if (attribution.titulaire) {
    attributaireName = attribution.titulaire;
  }

  // Extraire le montant TTC - supporte plusieurs sources
  let montantTTC = 0;
  if (attribution.montants?.ttc) {
    montantTTC = attribution.montants.ttc;
  } else if (attribution.montants?.attribue) {
    montantTTC = attribution.montants.attribue;
  } else if (attribution.montantAttribue) {
    montantTTC = attribution.montantAttribue;
  }

  // Formatage du montant
  const montantFormatted = montantTTC > 0
    ? `${(montantTTC / 1000000).toFixed(2)}M XOF`
    : 'Non renseigné';

  // Extraire le délai
  const delai = attribution.delaiExecution || attribution.delai || 0;
  const unite = attribution.delaiUnite || 'MOIS';
  const delaiFormatted = delai > 0 ? `${delai} ${unite}` : 'Non renseigné';

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, 'Marché visé')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
        renderField('Attributaire', attributaireName),
        renderField('Montant TTC', montantFormatted),
        renderField('Délai d\'exécution', delaiFormatted)
      ])
    ])
  ]);
}

function renderField(label, value) {
  return el('div', {}, [
    el('div', { className: 'text-small text-muted' }, label),
    el('div', { style: { fontWeight: '500', marginTop: '4px' } }, String(value || '-'))
  ]);
}

/**
 * Handle add OS de démarrage
 */
async function handleAddOSDemarrage(idOperation) {
  // Collect form data
  const numero = document.getElementById('os-numero')?.value;
  const date = document.getElementById('os-date')?.value;
  const objet = document.getElementById('os-objet')?.value;
  const docInput = document.getElementById('os-document');

  // Bureau de contrôle
  const bcType = document.getElementById('bc-type')?.value;
  const bcUaNom = document.getElementById('bc-ua-nom')?.value;
  const bcEntrepriseNom = document.getElementById('bc-entreprise-nom')?.value;

  // Bureau d'études
  const beType = document.getElementById('be-type')?.value;
  const beUaNom = document.getElementById('be-ua-nom')?.value;
  const beEntrepriseNom = document.getElementById('be-entreprise-nom')?.value;

  // Validation
  if (!numero) {
    alert('⚠️ Veuillez saisir un numéro d\'OS');
    return;
  }

  if (!date) {
    alert('⚠️ Veuillez saisir une date d\'émission');
    return;
  }

  // Handle document upload (simulate)
  let docRef = null;
  if (docInput?.files?.[0]) {
    docRef = 'DOC_OS_' + Date.now() + '.pdf';
    logger.info('[Execution] Document OS uploadé:', docRef);
  }

  // Prepare bureau data
  const bureauControle = bcType ? {
    type: bcType,
    uaId: null,
    entrepriseId: null,
    nom: bcType === 'UA' ? bcUaNom : bcEntrepriseNom
  } : { type: null, uaId: null, entrepriseId: null, nom: '' };

  const bureauEtudes = beType ? {
    type: beType,
    uaId: null,
    entrepriseId: null,
    nom: beType === 'UA' ? beUaNom : beEntrepriseNom
  } : { type: null, uaId: null, entrepriseId: null, nom: '' };

  // Create OS de démarrage entity
  // Note: Le schéma PostgreSQL n'a pas de colonne 'type', on utilise l'objet pour identifier le type
  const osEntity = {
    operationId: idOperation,
    numero,
    dateEmission: date,
    objet: objet || 'Ordre de service de démarrage des travaux',
    docRef,
    bureauControle,
    bureauEtudes,
    createdAt: new Date().toISOString()
  };

  const result = await dataService.add(ENTITIES.ORDRE_SERVICE, osEntity);

  if (!result.success) {
    alert('❌ Erreur lors de la création de l\'ordre de service');
    return;
  }

  // Update operation state to EN_EXEC
  const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
  const updateData = {
    etat: 'EN_EXEC',
    updatedAt: new Date().toISOString()
  };

  // Si timeline existe, ajouter EXEC
  if (operation.timeline) {
    if (!operation.timeline.includes('EXEC')) {
      updateData.timeline = [...operation.timeline, 'EXEC'];
    }
  }

  await dataService.update(ENTITIES.OPERATION, idOperation, updateData);

  logger.info('[Execution] OS de démarrage créé avec succès:', osId);
  alert('✅ Ordre de service de démarrage enregistré\nLes travaux peuvent maintenant commencer.');

  // Reload page
  router.navigate('/execution', { idOperation });
}

export default renderExecutionOS;
