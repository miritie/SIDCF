/**
 * ECR03C - Visa du Contrôleur Financier
 * Permet au CF de donner son visa (ou refus/réserves) après la contractualisation
 * Utilise l'entité VISA_CF dédiée
 */

import { el, mount } from '../../../lib/dom.js';
import logger from '../../../lib/logger.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';

export async function renderVisaCF(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  logger.info('[ECR03C] Chargement écran Visa CF', { idOperation });

  try {
    // Charger les données
    const fullData = await dataService.getOperationFull(idOperation);
    if (!fullData?.operation) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
      ]));
      return;
    }

    const { operation, attribution } = fullData;
    const registries = dataService.getAllRegistries();

    // Vérifier qu'il y a une attribution
    if (!attribution) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-warning' }, [
          el('p', {}, '⚠️ Cette opération n\'a pas encore d\'attribution.'),
          el('p', {}, 'Le visa CF ne peut être donné qu\'après la contractualisation.')
        ])
      ]));
      return;
    }

    // Le visa CF sera stocké dans l'attribution pour l'instant
    let visaCF = attribution?.decisionCF || null;

    const page = el('div', { className: 'page' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('button', {
          className: 'btn btn-secondary btn-sm',
          onclick: () => router.navigate('/fiche-marche', { idOperation })
        }, '← Retour fiche'),
        el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Visa Contrôle Financier'),
        el('p', { className: 'page-subtitle' }, operation.objet)
      ]),

      // Section Informations Attribution
      renderAttributionInfo(attribution, operation, registries),

      // Formulaire Visa CF
      renderVisaForm(visaCF, registries),

      // Actions
      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
            el('button', {
              type: 'button',
              className: 'btn btn-secondary',
              onclick: () => router.navigate('/fiche-marche', { idOperation })
            }, 'Annuler'),
            el('button', {
              type: 'button',
              className: 'btn btn-primary',
              onclick: async () => await handleSave(idOperation, attribution.id)
            }, visaCF ? '💾 Mettre à jour le visa' : '✅ Enregistrer le visa')
          ])
        ])
      ])
    ]);

    mount('#app', page);

  } catch (err) {
    logger.error('[ECR04A] Erreur chargement', err);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `❌ Erreur : ${err.message}`)
    ]));
  }
}

/**
 * Rendu des informations d'attribution
 */
function renderAttributionInfo(attribution, operation, registries) {
  const entrepriseInfo = attribution.attributaire.singleOrGroup === 'SIMPLE'
    ? `Entreprise : ${attribution.attributaire.entrepriseId || 'Non renseignée'}`
    : `Groupement : ${attribution.attributaire.groupementId || 'Non renseigné'} (${attribution.attributaire.groupType})`;

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📋 Informations de l\'attribution')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Attributaire'),
          el('div', { style: { fontWeight: 'bold' } }, entrepriseInfo)
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Montant HT'),
          el('div', { style: { fontWeight: 'bold' } }, `${attribution.montants.ht.toLocaleString('fr-FR')} XOF`)
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Montant TTC'),
          el('div', { style: { fontWeight: 'bold', color: '#0066cc' } }, `${attribution.montants.ttc.toLocaleString('fr-FR')} XOF`)
        ])
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' } }, [
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Date signature titulaire'),
          el('div', {}, attribution.dates.signatureTitulaire
            ? new Date(attribution.dates.signatureTitulaire).toLocaleDateString('fr-FR')
            : el('span', { className: 'text-muted' }, 'Non renseignée'))
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Date signature AC'),
          el('div', {}, attribution.dates.signatureAC
            ? new Date(attribution.dates.signatureAC).toLocaleDateString('fr-FR')
            : el('span', { className: 'text-muted' }, 'Non renseignée'))
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Date approbation'),
          el('div', {}, attribution.dates.approbation
            ? new Date(attribution.dates.approbation).toLocaleDateString('fr-FR')
            : el('span', { className: 'text-muted' }, 'Non renseignée'))
        ])
      ]),

      // Réserves CF (si attribution contient déjà des réserves)
      attribution.decisionCF?.aReserves
        ? el('div', { style: { marginTop: '16px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' } }, [
            el('div', { style: { fontWeight: 'bold', marginBottom: '8px' } }, '⚠️ Réserves CF lors de l\'attribution :'),
            el('div', { className: 'text-small' }, attribution.decisionCF.motifReserve || 'Non renseignées')
          ])
        : null
    ])
  ]);
}

/**
 * Rendu du formulaire de visa
 */
function renderVisaForm(visaCF, registries) {
  const existingVisa = visaCF || {};

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '✅ Décision du Contrôleur Financier')
    ]),
    el('div', { className: 'card-body' }, [
      // Décision
      el('div', { className: 'form-field', style: { marginBottom: '24px' } }, [
        el('label', { className: 'form-label' }, ['Décision', el('span', { className: 'required' }, '*')]),
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' } },
          (registries.DECISION_CF || []).filter(d => d.code !== 'EN_ATTENTE').map(decision => {
            const isSelected = existingVisa.decision === decision.code;
            return el('label', {
              className: 'form-label',
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: isSelected ? `2px solid ${getColorForDecision(decision.code)}` : '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: isSelected ? `${getColorForDecision(decision.code)}15` : '#fff'
              }
            }, [
              el('input', {
                type: 'radio',
                name: 'visa-decision',
                value: decision.code,
                checked: isSelected,
                required: true,
                onchange: (e) => {
                  // Afficher/masquer les sections conditionnelles
                  const reservesSection = document.getElementById('visa-reserves-section');
                  const refusSection = document.getElementById('visa-refus-section');

                  if (reservesSection) reservesSection.style.display = e.target.value === 'VISA_RESERVE' ? 'block' : 'none';
                  if (refusSection) refusSection.style.display = e.target.value === 'REFUS' ? 'block' : 'none';
                }
              }),
              el('span', { style: { fontWeight: 'bold' } }, decision.label)
            ]);
          })
        )
      ]),

      // Date de décision
      el('div', { className: 'form-field', style: { marginBottom: '24px' } }, [
        el('label', { className: 'form-label' }, ['Date de décision', el('span', { className: 'required' }, '*')]),
        el('input', {
          type: 'date',
          className: 'form-input',
          id: 'visa-date-decision',
          value: existingVisa.dateDecision || new Date().toISOString().split('T')[0],
          required: true,
          max: new Date().toISOString().split('T')[0]
        })
      ]),

      // Documents
      el('h4', { style: { marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' } }, '📎 Documents à joindre'),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' } }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Contrat numéroté'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'visa-contrat-doc',
            accept: '.pdf,.doc,.docx'
          }),
          existingVisa.contratDoc
            ? el('small', { className: 'text-muted' }, `✓ Fichier existant : ${existingVisa.contratDoc}`)
            : null
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Lettre de marché'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'visa-lettre-marche',
            accept: '.pdf,.doc,.docx'
          }),
          existingVisa.lettreMarche
            ? el('small', { className: 'text-muted' }, `✓ Fichier existant : ${existingVisa.lettreMarche}`)
            : null
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Formulaire de sélection'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'visa-formulaire-selection',
            accept: '.pdf,.doc,.docx'
          }),
          existingVisa.formulaireSelection
            ? el('small', { className: 'text-muted' }, `✓ Fichier existant : ${existingVisa.formulaireSelection}`)
            : null
        ])
      ]),

      // Section réserves (conditionnelle)
      el('div', {
        id: 'visa-reserves-section',
        style: {
          display: existingVisa.decision === 'VISA_RESERVE' ? 'block' : 'none',
          padding: '16px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          marginBottom: '16px'
        }
      }, [
        el('h4', { style: { marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' } }, '⚠️ Réserves du CF'),

        el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
          el('label', { className: 'form-label' }, 'Type de réserve'),
          el('select', {
            className: 'form-input',
            id: 'visa-type-reserve'
          }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.MOTIF_RESERVE || []).map(m =>
              el('option', { value: m.code, selected: m.code === existingVisa.typeReserve }, m.label)
            )
          ])
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Motif détaillé'),
          el('textarea', {
            className: 'form-input',
            id: 'visa-motif-reserve',
            rows: 4,
            placeholder: 'Décrire précisément les réserves émises...'
          }, existingVisa.motifReserve || '')
        ])
      ]),

      // Section refus (conditionnelle)
      el('div', {
        id: 'visa-refus-section',
        style: {
          display: existingVisa.decision === 'REFUS' ? 'block' : 'none',
          padding: '16px',
          backgroundColor: '#f8d7da',
          borderRadius: '4px'
        }
      }, [
        el('h4', { style: { marginBottom: '12px', fontSize: '16px', fontWeight: 'bold', color: '#721c24' } }, '❌ Motif du refus'),

        el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
          el('label', { className: 'form-label' }, 'Motif principal'),
          el('select', {
            className: 'form-input',
            id: 'visa-motif-refus'
          }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.MOTIF_REFUS_CF || []).map(m =>
              el('option', { value: m.code, selected: m.code === existingVisa.motifRefus }, m.label)
            )
          ])
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Commentaire détaillé'),
          el('textarea', {
            className: 'form-input',
            id: 'visa-commentaire-refus',
            rows: 4,
            placeholder: 'Décrire les raisons du refus et les actions correctives attendues...'
          }, existingVisa.commentaireRefus || '')
        ])
      ])
    ])
  ]);
}

/**
 * Sauvegarde du visa CF
 */
async function handleSave(idOperation, attributionId) {
  try {
    const decision = document.querySelector('input[name="visa-decision"]:checked')?.value;
    if (!decision) {
      alert('⚠️ Veuillez sélectionner une décision');
      return;
    }

    const dateDecision = document.getElementById('visa-date-decision').value;
    if (!dateDecision) {
      alert('⚠️ Veuillez saisir la date de décision');
      return;
    }

    // Pour l'instant, on stocke la décision CF dans l'attribution
    const attribution = await dataService.get(ENTITIES.ATTRIBUTION, attributionId);
    if (!attribution) {
      alert('❌ Attribution non trouvée');
      return;
    }

    // Données de la décision CF
    const decisionCFData = {
      etat: decision,
      motifRef: null,
      commentaire: ''
    };

    // Réserves si VISA_RESERVE
    if (decision === 'VISA_RESERVE') {
      const motifReserve = document.getElementById('visa-motif-reserve').value || '';
      if (!motifReserve.trim()) {
        alert('⚠️ Veuillez préciser le motif des réserves');
        return;
      }
      decisionCFData.commentaire = motifReserve;
    }

    // Refus si REFUS
    if (decision === 'REFUS') {
      const motifRefus = document.getElementById('visa-motif-refus').value || null;
      if (!motifRefus) {
        alert('⚠️ Veuillez sélectionner un motif de refus');
        return;
      }
      decisionCFData.motifRef = motifRefus;
      decisionCFData.commentaire = document.getElementById('visa-commentaire-refus').value || '';
    }

    // Mettre à jour l'attribution
    const updateAttr = {
      decisionCF: decisionCFData,
      dates: {
        ...attribution.dates,
        decisionCF: dateDecision
      },
      updatedAt: new Date().toISOString()
    };

    const attrResult = await dataService.update(ENTITIES.ATTRIBUTION, attributionId, updateAttr);

    if (!attrResult.success) {
      alert('❌ Erreur lors de la sauvegarde de la décision CF');
      return;
    }

    // Mettre à jour l'opération
    const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
    const updateOp = {
      decisionCF: decision,
      dateCF: dateDecision
    };

    if (decision === 'VISA' && !operation.timeline.includes('VISE')) {
      updateOp.timeline = [...operation.timeline, 'VISE'];
      updateOp.etat = 'VISE';
    } else if (decision === 'REFUS') {
      updateOp.etat = 'REFUSE';
    } else if (decision === 'RESERVE' || decision === 'VISA_RESERVE') {
      updateOp.etat = 'EN_RESERVE';
    }

    const opResult = await dataService.update(ENTITIES.OPERATION, idOperation, updateOp);

    if (opResult.success) {
      const icon = decision === 'VISA' ? '✅' : decision.includes('RESERVE') ? '⚠️' : '🚫';
      alert(`${icon} Décision CF enregistrée: ${decision}`);
      router.navigate('/fiche-marche', { idOperation });
    } else {
      alert('❌ Erreur lors de la mise à jour de l\'opération');
    }

  } catch (err) {
    logger.error('[ECR04A] Erreur sauvegarde', err);
    alert(`❌ Erreur lors de la sauvegarde : ${err.message}`);
  }
}

/**
 * Obtenir la couleur selon la décision
 */
function getColorForDecision(code) {
  switch (code) {
    case 'VISA': return '#28a745';
    case 'VISA_RESERVE': return '#ffc107';
    case 'REFUS': return '#dc3545';
    default: return '#6c757d';
  }
}

export default renderVisaCF;
