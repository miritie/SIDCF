/* ============================================
   ECR04B - Créer un Avenant
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { uploadDocument } from '../../../lib/r2-storage-mp.js';
import logger from '../../../lib/logger.js';
import { getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { renderMontantPourcentageDualInput } from '../../../ui/widgets/montant-pourcentage-dual-input.js';
import { renderFormulaBadge } from '../../../ui/widgets/formula-tip-mp.js';

// API exposée par le widget dual de l'avenant courant (montant peut être négatif)
let _avenantMontantApi = null;

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderAvenantCreate(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  logger.info('[ECR04B-Create] Chargement écran création avenant', { idOperation });

  try {
    // Charger les données
    const operation = await dataService.get(ENTITIES.MP_OPERATION, idOperation);
    const avenantsRaw = await dataService.query(ENTITIES.MP_AVENANT, { operationId: idOperation });
    const registries = dataService.getAllRegistries();

    // Marché+ multi-lot : charger les lots depuis la procédure
    const fullData = await dataService.getMpOperationFull(idOperation);
    const procedure = fullData?.procedure;
    const lots = getLotsFromProcedure(procedure);
    const currentLotId = resolveCurrentLotId(lots, params);

    // Filtrer avenants au lot pour calcul du numéro et des cumuls
    const avenants = currentLotId
      ? avenantsRaw.filter(av => !av.lotId || av.lotId === currentLotId)
      : avenantsRaw;

    if (!operation) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
      ]));
      return;
    }

    // Vérifier si marché résilié
    const resiliations = await dataService.query(ENTITIES.MP_RESILIATION, { operationId: idOperation });
    if (resiliations && resiliations.length > 0) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, [
          el('div', { className: 'alert-icon' }, '🚫'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Marché résilié'),
            el('div', { className: 'alert-message' }, 'Impossible de créer un avenant pour un marché résilié.')
          ])
        ]),
        createButton('btn btn-secondary', '← Retour', () => router.navigate('/mp/avenants', { idOperation }))
      ]));
      return;
    }

    const montantInitial = operation.montantPrevisionnel || 0;
    const totalAvenants = avenants.reduce((sum, av) => sum + (av.variationMontant || 0), 0);
    const montantActuel = montantInitial + totalAvenants;
    const pourcentageCumul = montantInitial > 0 ? (totalAvenants / montantInitial) * 100 : 0;

    const numeroAvenant = avenants.length + 1;

    const page = el('div', { className: 'page' }, [
      el('div', { className: 'page-header' }, [
        createButton('btn btn-secondary btn-sm', '← Retour liste avenants', () => router.navigate('/mp/avenants', { idOperation, lotId: currentLotId })),
        el('h1', { className: 'page-title', style: { marginTop: '12px' } }, `➕ Nouvel avenant N°${numeroAvenant}`),
        el('p', { className: 'page-subtitle' }, operation.objet)
      ]),

      // Sélecteur de lot (visible si > 1 lot)
      renderLotSelector({
        lots,
        currentLotId,
        route: '/mp/avenant-create',
        routeParams: { idOperation }
      }),

      // Info contexte
      el('div', { className: 'card', style: { marginBottom: '24px', backgroundColor: '#f8f9fa' } }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
            el('div', {}, [
              el('div', { style: { fontSize: '12px', color: '#6c757d', marginBottom: '4px' } }, 'Montant du marché de base'),
              el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, `${montantInitial.toLocaleString('fr-FR')} XOF`)
            ]),
            el('div', {}, [
              el('div', { style: { fontSize: '12px', color: '#6c757d', marginBottom: '4px', display: 'flex', alignItems: 'center' } }, [
                el('span', {}, 'Cumul avenants'),
                // Modif #37 — Badge formule sur le cumul avenants
                renderFormulaBadge({
                  titre: 'Cumul des avenants',
                  formule: 'Σ variationMontant / montantInitial × 100',
                  regle: 'Seuil légal RG021 : cumul ≤ 30 % du montant initial. Alerte à partir de 25 %. Dépassement = dérogation requise du Directeur des Marchés Publics.',
                  exemple: 'Marché initial 100 M + avenant 1 +15 M + avenant 2 +10 M ⇒ cumul = 25 M / 100 M = 25 % (jaune, attention)',
                  reference: 'RG021 du SDF · Code MP CI'
                })
              ]),
              el('div', { style: { fontSize: '18px', fontWeight: 'bold', color: pourcentageCumul >= 25 ? '#dc3545' : '#28a745' } },
                `${totalAvenants.toLocaleString('fr-FR')} XOF (${pourcentageCumul.toFixed(1)}%)`)
            ]),
            el('div', {}, [
              el('div', { style: { fontSize: '12px', color: '#6c757d', marginBottom: '4px' } }, 'Montant total du marché'),
              el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, `${montantActuel.toLocaleString('fr-FR')} XOF`)
            ])
          ])
        ])
      ]),

      // Alerte seuil (30% selon le Code des Marchés Publics)
      pourcentageCumul >= 25 ? el('div', { className: 'alert alert-warning', style: { marginBottom: '24px' } }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, pourcentageCumul >= 30 ? 'Seuil légal dépassé' : 'Seuil d\'alerte atteint'),
          el('div', { className: 'alert-message' }, pourcentageCumul >= 30
            ? `Le cumul des avenants (${pourcentageCumul.toFixed(1)}%) dépasse le seuil légal de 30% fixé par le Code des Marchés Publics. Une dérogation est requise.`
            : `Le cumul des avenants (${pourcentageCumul.toFixed(1)}%) approche le seuil légal de 30% fixé par le Code des Marchés Publics.`)
        ])
      ]) : null,

      // Formulaire
      el('form', {
        id: 'form-avenant',
        onsubmit: (e) => e.preventDefault(),
        'data-montant-initial': montantInitial,
        'data-montant-actuel': montantActuel,
        'data-total-avenants': totalAvenants
      }, [
        // Section: Identification
        el('div', { className: 'card', style: { marginBottom: '24px' } }, [
          el('div', { className: 'card-header' }, [
            el('h3', { className: 'card-title' }, '📋 Identification de l\'avenant')
          ]),
          el('div', { className: 'card-body' }, [
            el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
              el('div', { className: 'form-field' }, [
                el('label', { className: 'form-label' }, ['Numéro', el('span', { className: 'required' }, '*')]),
                el('input', {
                  type: 'text',
                  className: 'form-input',
                  id: 'avenant-numero',
                  value: `AV${numeroAvenant}`,
                  required: true,
                  readonly: true
                })
              ]),

              el('div', { className: 'form-field' }, [
                el('label', { className: 'form-label' }, ['Type d\'avenant', el('span', { className: 'required' }, '*')]),
                el('select', { className: 'form-input', id: 'avenant-type', required: true }, [
                  el('option', { value: '' }, '-- Sélectionner --'),
                  ...(registries.TYPE_AVENANT || []).map(t =>
                    el('option', { value: t.code }, t.label)
                  )
                ])
              ]),

              el('div', { className: 'form-field' }, [
                el('label', { className: 'form-label' }, ['Date de signature', el('span', { className: 'required' }, '*')]),
                el('input', {
                  type: 'date',
                  className: 'form-input',
                  id: 'avenant-date-signature',
                  value: new Date().toISOString().split('T')[0],
                  required: true
                })
              ]),

              el('div', { className: 'form-field' }, [
                el('label', { className: 'form-label' }, 'Date d\'approbation'),
                el('input', {
                  type: 'date',
                  className: 'form-input',
                  id: 'avenant-date-approbation'
                })
              ])
            ])
          ])
        ]),

        // Section: Impact (Montant ou Délai selon le type d'avenant)
        el('div', { className: 'card', style: { marginBottom: '24px' }, id: 'section-impact' }, [
          el('div', { className: 'card-header' }, [
            el('h3', { className: 'card-title', id: 'impact-title' }, '💰 Impact financier')
          ]),
          el('div', { className: 'card-body' }, [
            // Bloc pour variation montant (affiché par défaut pour avenants financiers)
            el('div', { id: 'bloc-variation-montant' }, [
              el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' } }, [
                el('div', { className: 'form-field' }, [
                  el('label', { className: 'form-label' }, 'Base de calcul'),
                  el('select', { className: 'form-input', id: 'avenant-base-calc' }, [
                    el('option', { value: 'HT' }, 'HT'),
                    el('option', { value: 'TTC', selected: true }, 'TTC')
                  ]),
                  el('small', { className: 'text-muted' }, 'Base du montant marché sur laquelle le pourcentage de variation est évalué')
                ]),

                el('div', { className: 'form-field' }, [
                  el('label', { className: 'form-label' }, 'Montant total du marché (après cet avenant)'),
                  el('input', {
                    type: 'text',
                    className: 'form-input',
                    id: 'avenant-nouveau-montant',
                    readonly: true,
                    disabled: true,
                    style: { backgroundColor: '#e9ecef', fontWeight: 'bold' }
                  })
                ])
              ]),

              // Widget DUAL montant + % (synchronisés, négatifs autorisés pour diminution)
              el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
                el('label', { className: 'form-label' }, ['Montant de l\'avenant (montant + %)', el('span', { className: 'required' }, '*')]),
                el('div', { id: 'avenant-montant-host' }),
                el('small', { className: 'text-muted' }, 'Saisie synchronisée : montant positif = augmentation, négatif = diminution. Le % est calculé sur la base choisie.')
              ]),

              // Champ caché pour compat avec le code de soumission existant
              el('input', { type: 'hidden', id: 'avenant-montant', value: '0' }),

              // Aperçu impact financier
              el('div', {
                id: 'impact-preview',
                style: {
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  display: 'none'
                }
              }, [
                el('div', { style: { fontSize: '14px', marginBottom: '8px' } }, [
                  el('strong', {}, 'Impact : '),
                  el('span', { id: 'impact-text' }, '')
                ]),
                el('div', { style: { fontSize: '14px' } }, [
                  el('strong', {}, 'Nouveau cumul : '),
                  el('span', { id: 'impact-cumul' }, '')
                ])
              ])
            ]),

            // Bloc pour variation délai (masqué par défaut, affiché pour avenants de type DELAI)
            el('div', { id: 'bloc-variation-delai', style: { display: 'none' } }, [
              el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' } }, [
                el('div', { className: 'form-field' }, [
                  el('label', { className: 'form-label' }, ['Prolongation de délai (mois)', el('span', { className: 'required' }, '*')]),
                  el('input', {
                    type: 'number',
                    className: 'form-input',
                    id: 'avenant-delai',
                    placeholder: 'Nombre de mois de prolongation',
                    min: 0,
                    step: 1
                  }),
                  el('small', { className: 'text-muted' }, 'Durée additionnelle accordée pour l\'exécution du marché')
                ]),

                el('div', { className: 'form-field' }, [
                  el('label', { className: 'form-label' }, 'Nouvelle date fin prévue'),
                  el('input', {
                    type: 'date',
                    className: 'form-input',
                    id: 'avenant-nouvelle-date-fin',
                    readonly: true,
                    disabled: true,
                    style: { backgroundColor: '#e9ecef', fontWeight: 'bold' }
                  })
                ])
              ]),

              el('div', {
                style: {
                  padding: '12px',
                  backgroundColor: '#f0f7ff',
                  borderRadius: '6px',
                  border: '1px solid #cce5ff'
                }
              }, [
                el('div', { style: { fontSize: '14px', color: '#004085' } }, [
                  el('strong', {}, 'ℹ️ Note : '),
                  'Les avenants de délai n\'ont pas d\'impact sur le montant du marché.'
                ])
              ])
            ])
          ])
        ]),

        // Section: Justification
        el('div', { className: 'card', style: { marginBottom: '24px' } }, [
          el('div', { className: 'card-header' }, [
            el('h3', { className: 'card-title' }, '📝 Justification')
          ]),
          el('div', { className: 'card-body' }, [
            el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
              el('label', { className: 'form-label' }, ['Motif de l\'avenant', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'avenant-motif', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.MOTIF_AVENANT || []).map(m =>
                  el('option', { value: m.code }, m.label)
                ),
                el('option', { value: 'AUTRE' }, 'Autre motif')
              ])
            ]),

            el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
              el('label', { className: 'form-label' }, ['Description détaillée', el('span', { className: 'required' }, '*')]),
              el('textarea', {
                className: 'form-input',
                id: 'avenant-description',
                rows: 4,
                placeholder: 'Justification détaillée de l\'avenant et de son impact...',
                required: true
              })
            ]),

            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Commentaires additionnels'),
              el('textarea', {
                className: 'form-input',
                id: 'avenant-commentaire',
                rows: 2,
                placeholder: 'Remarques, observations...'
              })
            ])
          ])
        ]),

        // Section: Documents
        el('div', { className: 'card', style: { marginBottom: '24px' } }, [
          el('div', { className: 'card-header' }, [
            el('h3', { className: 'card-title' }, '📎 Documents justificatifs')
          ]),
          el('div', { className: 'card-body' }, [
            el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
              el('label', { className: 'form-label' }, ['Document de l\'avenant (PDF)', el('span', { className: 'required' }, '*')]),
              el('input', {
                type: 'file',
                className: 'form-input',
                id: 'avenant-document',
                accept: '.pdf',
                required: true,
                onchange: handleFileChange
              }),
              el('small', { className: 'text-muted' }, 'Format PDF uniquement, max 10MB')
            ]),

            el('div', {
              id: 'file-preview',
              style: { display: 'none', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }
            }, [
              el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
                el('span', { style: { fontSize: '24px' } }, '📄'),
                el('div', { style: { flex: 1 } }, [
                  el('div', { id: 'file-name', style: { fontWeight: '500', marginBottom: '4px' } }),
                  el('div', { id: 'file-size', style: { fontSize: '12px', color: '#6c757d' } })
                ])
              ])
            ])
          ])
        ]),

        // Actions
        el('div', { className: 'card' }, [
          el('div', { className: 'card-body' }, [
            el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
              createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/avenants', { idOperation, lotId: currentLotId })),
              createButton('btn btn-primary', '✅ Créer l\'avenant', () => handleSubmit(idOperation, operation, numeroAvenant, montantActuel, totalAvenants, currentLotId))
            ])
          ])
        ])
      ])
    ]);

    mount('#app', page);

    // Initialiser le widget DUAL montant/% pour la variation d'avenant.
    // Bases : montants HT/TTC issus de l'attribution si dispo, sinon montantPrevisionnel comme TTC.
    const attribMontants = fullData?.attribution?.montants || {};
    const baseHT = Number(attribMontants.ht) || (montantInitial / 1.18);
    const baseTTC = Number(attribMontants.ttc) || montantInitial;
    let avenantBaseCalc = 'TTC';
    const avenantHost = document.getElementById('avenant-montant-host');
    if (avenantHost) {
      const widget = renderMontantPourcentageDualInput({
        idPrefix: 'avenant',
        total: avenantBaseCalc === 'TTC' ? baseTTC : baseHT,
        value: 0,
        mode: 'MONTANT',
        allowNegative: true,
        onChange: (montant /* mode */) => {
          // Synchroniser le champ caché pour conserver le flow de soumission existant
          const hidden = document.getElementById('avenant-montant');
          if (hidden) hidden.value = String(montant);
          updateImpactPreview();
        }
      });
      avenantHost.appendChild(widget);
      _avenantMontantApi = widget._mpDual;
    }
    const avenantBaseSelect = document.getElementById('avenant-base-calc');
    if (avenantBaseSelect) {
      avenantBaseSelect.addEventListener('change', () => {
        avenantBaseCalc = avenantBaseSelect.value === 'HT' ? 'HT' : 'TTC';
        if (_avenantMontantApi) {
          _avenantMontantApi.setTotal(avenantBaseCalc === 'TTC' ? baseTTC : baseHT);
        }
      });
    }

    // Ajouter le listener pour changer les blocs selon le type d'avenant
    const typeSelect = document.getElementById('avenant-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        const blocMontant = document.getElementById('bloc-variation-montant');
        const blocDelai = document.getElementById('bloc-variation-delai');
        const impactTitle = document.getElementById('impact-title');

        if (type === 'DELAI') {
          // Afficher le bloc délai, masquer le bloc montant
          blocMontant.style.display = 'none';
          blocDelai.style.display = 'block';
          impactTitle.textContent = '⏱️ Impact sur le délai';

          // Réinitialiser le montant (hidden + widget dual)
          const montantInput = document.getElementById('avenant-montant');
          if (montantInput) montantInput.value = '0';
          if (_avenantMontantApi) _avenantMontantApi.setMontant(0);

          // Masquer l'aperçu
          const impactPreview = document.getElementById('impact-preview');
          if (impactPreview) impactPreview.style.display = 'none';
        } else {
          // Afficher le bloc montant, masquer le bloc délai
          blocMontant.style.display = 'block';
          blocDelai.style.display = 'none';
          impactTitle.textContent = '💰 Impact financier';

          // Réinitialiser le délai
          const delaiInput = document.getElementById('avenant-delai');
          if (delaiInput) delaiInput.value = '';
        }
      });
    }

  } catch (err) {
    logger.error('[ECR04B-Create] Erreur chargement', err);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `❌ Erreur : ${err.message}`)
    ]));
  }
}

/**
 * Met à jour l'aperçu de l'impact financier
 */
function updateImpactPreview() {
  const montantInput = document.getElementById('avenant-montant');
  const nouveauMontantInput = document.getElementById('avenant-nouveau-montant');
  const impactPreview = document.getElementById('impact-preview');
  const impactText = document.getElementById('impact-text');
  const impactCumul = document.getElementById('impact-cumul');

  if (!montantInput || !nouveauMontantInput) return;

  const variationMontant = parseFloat(montantInput.value) || 0;

  if (variationMontant === 0) {
    impactPreview.style.display = 'none';
    nouveauMontantInput.value = '';
    return;
  }

  // Récupérer les montants depuis le contexte (stockés dans des attributs data)
  const montantActuel = parseFloat(document.getElementById('form-avenant').dataset.montantActuel || 0);
  const totalAvenants = parseFloat(document.getElementById('form-avenant').dataset.totalAvenants || 0);
  const montantInitial = parseFloat(document.getElementById('form-avenant').dataset.montantInitial || 0);

  const nouveauMontant = montantActuel + variationMontant;
  const nouveauCumul = totalAvenants + variationMontant;
  const nouveauPourcentage = montantInitial > 0 ? (nouveauCumul / montantInitial) * 100 : 0;

  nouveauMontantInput.value = `${nouveauMontant.toLocaleString('fr-FR')} XOF`;

  const signe = variationMontant > 0 ? '+' : '';
  const couleur = variationMontant > 0 ? '#28a745' : '#dc3545';

  impactText.innerHTML = `<span style="color: ${couleur}; font-weight: bold;">${signe}${variationMontant.toLocaleString('fr-FR')} XOF</span> → Montant total du marché : <strong>${nouveauMontant.toLocaleString('fr-FR')} XOF</strong>`;

  const couleurCumul = nouveauPourcentage >= 30 ? '#dc3545' : (nouveauPourcentage >= 25 ? '#ffc107' : '#28a745');
  impactCumul.innerHTML = `<span style="color: ${couleurCumul}; font-weight: bold;">${nouveauCumul.toLocaleString('fr-FR')} XOF (${nouveauPourcentage.toFixed(1)}%)</span>`;

  impactPreview.style.display = 'block';
}

/**
 * Gère le changement de fichier
 */
function handleFileChange(e) {
  const fileInput = e.target;
  const filePreview = document.getElementById('file-preview');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');

  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];

    // Validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('❌ Fichier trop volumineux. Maximum: 10MB');
      fileInput.value = '';
      filePreview.style.display = 'none';
      return;
    }

    if (!file.type.includes('pdf')) {
      alert('❌ Format non accepté. Seuls les fichiers PDF sont autorisés.');
      fileInput.value = '';
      filePreview.style.display = 'none';
      return;
    }

    // Afficher l'aperçu
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    filePreview.style.display = 'block';
  } else {
    filePreview.style.display = 'none';
  }
}

/**
 * Soumission du formulaire
 *
 * Marché+ multi-lot : si lotId est fourni, on l'enregistre sur l'avenant
 * (chaque avenant est rattaché à un lot précis ; null pour mono-lot).
 */
async function handleSubmit(idOperation, operation, numeroAvenant, montantActuel, totalAvenants, lotId = null) {
  try {
    // Validation de base
    const numero = document.getElementById('avenant-numero').value.trim();
    const type = document.getElementById('avenant-type').value;
    const dateSignature = document.getElementById('avenant-date-signature').value;
    const motif = document.getElementById('avenant-motif').value;
    const description = document.getElementById('avenant-description').value.trim();
    const fileInput = document.getElementById('avenant-document');

    if (!numero || !type || !dateSignature || !motif || !description) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation spécifique selon le type
    let variationMontant = 0;
    let variationDelai = 0;

    if (type === 'DELAI') {
      // Avenant de délai
      variationDelai = parseInt(document.getElementById('avenant-delai')?.value) || 0;
      if (variationDelai <= 0) {
        alert('⚠️ Veuillez renseigner la prolongation de délai (en mois)');
        return;
      }
    } else {
      // Avenant financier (FINAN, MIXTE, etc.)
      variationMontant = parseFloat(document.getElementById('avenant-montant')?.value);
      if (isNaN(variationMontant) || variationMontant === 0) {
        alert('⚠️ Veuillez renseigner la variation de montant');
        return;
      }
    }

    if (!fileInput.files || fileInput.files.length === 0) {
      alert('⚠️ Veuillez joindre le document de l\'avenant');
      return;
    }

    // Vérifier le seuil (uniquement pour les avenants avec impact financier)
    const montantInitial = operation.montantPrevisionnel || 0;
    let nouveauPourcentage = 0;

    if (variationMontant !== 0) {
      const nouveauCumul = totalAvenants + variationMontant;
      nouveauPourcentage = montantInitial > 0 ? (nouveauCumul / montantInitial) * 100 : 0;

      if (nouveauPourcentage > 30) {
        if (!confirm(`⚠️ ATTENTION : Le cumul des avenants dépassera ${nouveauPourcentage.toFixed(1)}%, ce qui excède le seuil légal de 30% fixé par le Code des Marchés Publics.\n\nCet avenant nécessitera une dérogation spéciale.\n\nVoulez-vous continuer ?`)) {
          return;
        }
      }
    }

    // Upload du document vers Cloudflare R2
    const file = fileInput.files[0];
    logger.info('[ECR04B-Create] Upload document vers R2...', { fileName: file.name });

    let documentRef = null;
    try {
      const uploadResult = await uploadDocument(file, {
        operationId: idOperation,
        entityType: 'AVENANT',
        phase: 'EXEC',
        typeDocument: 'AVENANT',
        obligatoire: true,
        commentaire: `Avenant ${numero}`
      });

      documentRef = uploadResult.documentId;
      logger.info('[ECR04B-Create] Document uploadé avec succès', uploadResult);
    } catch (uploadError) {
      logger.error('[ECR04B-Create] Erreur upload document', uploadError);
      alert(`❌ Erreur lors de l'upload du document : ${uploadError.message}`);
      return;
    }

    // Créer l'avenant
    const avenantId = `AVEN-${idOperation}-${Date.now()}`;
    const avenantBaseCalc = document.getElementById('avenant-base-calc')?.value === 'HT' ? 'HT' : 'TTC';
    const avenantSaisieMode = _avenantMontantApi ? _avenantMontantApi.getMode() : 'MONTANT';
    const avenantData = {
      id: avenantId,
      operationId: idOperation,
      lotId: lotId || null,
      numero,
      type,
      dateSignature,
      dateApprobation: document.getElementById('avenant-date-approbation').value || null,
      variationMontant: variationMontant || 0,
      variationBaseCalc: avenantBaseCalc, // HT ou TTC — base utilisée pour le % côté UI
      variationSaisieMode: avenantSaisieMode, // dernier champ saisi (montant ou %)
      variationDelai: variationDelai || 0,
      motifRef: motif,
      description,
      commentaire: document.getElementById('avenant-commentaire').value || '',
      documentRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await dataService.add(ENTITIES.MP_AVENANT, avenantData);

    if (!result.success) {
      alert('❌ Erreur lors de la création de l\'avenant');
      return;
    }

    logger.info('[ECR04B-Create] Avenant créé avec succès', avenantData);

    // Mettre à jour l'opération
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    // Pour les avenants financiers, mettre à jour le montant final
    if (variationMontant !== 0) {
      const nouveauMontant = montantActuel + variationMontant;
      updateData.montantFinal = nouveauMontant;
    }

    await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateData);

    const messageSucces = type === 'DELAI'
      ? `✅ Avenant de délai créé avec succès (+${variationDelai} mois)`
      : '✅ Avenant créé avec succès';
    alert(messageSucces);
    router.navigate('/mp/avenants', { idOperation, lotId });

  } catch (err) {
    logger.error('[ECR04B-Create] Erreur création avenant', err);
    alert(`❌ Erreur : ${err.message}`);
  }
}

export default renderAvenantCreate;
