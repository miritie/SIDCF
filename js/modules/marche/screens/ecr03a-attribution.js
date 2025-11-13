/**
 * ECR03A - Attribution du Marché
 * Écran complet enrichi avec :
 * - Garanties (avance, bonne exécution, cautionnement)
 * - Réserves CF
 * - Clé de répartition multi-bailleurs
 * - Échéancier de paiement avec livrables
 */

import { el, mount } from '../../../lib/dom.js';
import logger from '../../../lib/logger.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderCleRepartitionManager } from '../../../ui/widgets/cle-repartition-manager.js';
import { renderEcheancierManager } from '../../../ui/widgets/echeancier-manager.js';

// État global pour les widgets
let cleRepartitionList = [];
let echeancierData = null;

export async function renderAttribution(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  logger.info('[ECR03A] Chargement écran Attribution', { idOperation });

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

    // Charger attribution existante (si elle existe déjà)
    let existingAttribution = attribution;

    // Initialiser l'état
    cleRepartitionList = [];
    echeancierData = { periodicite: 'LIBRE', periodiciteJours: null, items: [], total: 0, totalPourcent: 0 };

    const page = el('div', { className: 'page' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('button', {
          className: 'btn btn-secondary btn-sm',
          onclick: () => router.navigate('/fiche-marche', { idOperation })
        }, '← Retour fiche'),
        el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Attribution du Marché'),
        el('p', { className: 'page-subtitle' }, operation.objet)
      ]),

      // Formulaire
      renderAttributionForm(existingAttribution, operation, registries),

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
              onclick: async () => await handleSave(idOperation, operation)
            }, existingAttribution ? '💾 Mettre à jour' : '✅ Enregistrer l\'attribution')
          ])
        ])
      ])
    ]);

    mount('#app', page);

    // Initialiser les widgets après montage
    setTimeout(() => initializeWidgets(operation, registries), 100);

  } catch (err) {
    logger.error('[ECR03A] Erreur chargement', err);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `❌ Erreur : ${err.message}`)
    ]));
  }
}

/**
 * Formulaire d'attribution
 */
function renderAttributionForm(attribution, operation, registries) {
  const existingAttr = attribution || {};
  const montantHT = existingAttr.montants?.ht || operation.montantPrevisionnel || 0;
  const montantTTC = existingAttr.montants?.ttc || (montantHT * 1.18);

  return el('div', { style: { display: 'flex', flexDirection: 'column', gap: '24px' } }, [
    // Section Montants
    renderMontantsSection(montantHT, montantTTC),

    // Section Garanties
    renderGarantiesSection(existingAttr.garanties || {}),

    // Section Réserves CF
    renderReservesCFSection(existingAttr.decisionCF || {}),

    // Section Clé de Répartition
    renderCleRepartitionSection(montantHT, montantTTC, operation.livrables || [], registries),

    // Section Échéancier
    renderEcheancierSection(montantTTC, operation.livrables || [], registries)
  ]);
}

/**
 * Section Montants
 */
function renderMontantsSection(montantHT, montantTTC) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '💰 Montants du marché')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Montant HT (XOF)', el('span', { className: 'required' }, '*')]),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'attr-montant-ht',
            value: montantHT,
            required: true,
            min: 0,
            step: 0.01,
            oninput: () => {
              const ht = parseFloat(document.getElementById('attr-montant-ht').value) || 0;
              const ttc = ht * 1.18;
              document.getElementById('attr-montant-ttc').value = ttc.toFixed(2);
            }
          })
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Taux TVA (%)'),
          el('input', {
            type: 'number',
            className: 'form-input',
            value: 18,
            disabled: true,
            style: { backgroundColor: '#e9ecef' }
          }),
          el('small', { className: 'text-muted' }, 'Taux standard Côte d\'Ivoire')
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Montant TTC (XOF)'),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'attr-montant-ttc',
            value: montantTTC,
            disabled: true,
            style: { backgroundColor: '#e9ecef', fontWeight: 'bold' }
          })
        ])
      ])
    ])
  ]);
}

/**
 * Section Garanties
 */
function renderGarantiesSection(garanties) {
  const garantieAvance = garanties.garantieAvance || { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };
  const garantieBonneExec = garanties.garantieBonneExec || { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };
  const cautionnement = garanties.cautionnement || { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '🔐 Garanties et Cautionnement')
    ]),
    el('div', { className: 'card-body' }, [
      // Garantie d'avance
      renderGarantieItem('avance', 'Garantie d\'avance', garantieAvance),

      el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } }),

      // Garantie de bonne exécution
      renderGarantieItem('bonne-exec', 'Garantie de bonne exécution', garantieBonneExec),

      el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } }),

      // Cautionnement
      renderGarantieItem('cautionnement', 'Cautionnement', cautionnement)
    ])
  ]);
}

/**
 * Item de garantie
 */
function renderGarantieItem(id, label, garantie) {
  return el('div', { style: { marginBottom: '16px' } }, [
    el('div', { style: { marginBottom: '12px' } }, [
      el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        el('input', {
          type: 'checkbox',
          id: `garantie-${id}-existe`,
          checked: garantie.existe,
          onchange: (e) => {
            const detailsDiv = document.getElementById(`garantie-${id}-details`);
            if (detailsDiv) {
              detailsDiv.style.display = e.target.checked ? 'grid' : 'none';
            }
          }
        }),
        el('span', { style: { fontWeight: 'bold' } }, label)
      ])
    ]),

    el('div', {
      id: `garantie-${id}-details`,
      style: {
        display: garantie.existe ? 'grid' : 'none',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        paddingLeft: '24px'
      }
    }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Montant (XOF)'),
        el('input', {
          type: 'number',
          className: 'form-input',
          id: `garantie-${id}-montant`,
          value: garantie.montant,
          min: 0,
          step: 0.01
        })
      ]),

      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Date émission'),
        el('input', {
          type: 'date',
          className: 'form-input',
          id: `garantie-${id}-emission`,
          value: garantie.dateEmission || ''
        })
      ]),

      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Date échéance'),
        el('input', {
          type: 'date',
          className: 'form-input',
          id: `garantie-${id}-echeance`,
          value: garantie.dateEcheance || ''
        })
      ]),

      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Document'),
        el('input', {
          type: 'file',
          className: 'form-input',
          id: `garantie-${id}-doc`,
          accept: '.pdf,.doc,.docx'
        }),
        garantie.docRef ? el('small', { className: 'text-muted' }, `✓ ${garantie.docRef}`) : null
      ])
    ])
  ]);
}

/**
 * Section Réserves CF
 */
function renderReservesCFSection(decisionCF) {
  const aReserves = decisionCF.aReserves || false;

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '⚠️ Réserves du Contrôleur Financier')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          el('input', {
            type: 'checkbox',
            id: 'cf-a-reserves',
            checked: aReserves,
            onchange: (e) => {
              const detailsDiv = document.getElementById('cf-reserves-details');
              if (detailsDiv) {
                detailsDiv.style.display = e.target.checked ? 'block' : 'none';
              }
            }
          }),
          el('span', {}, 'Le CF a émis des réserves')
        ])
      ]),

      el('div', {
        id: 'cf-reserves-details',
        style: {
          display: aReserves ? 'block' : 'none',
          padding: '16px',
          backgroundColor: '#fff3cd',
          borderRadius: '4px'
        }
      }, [
        el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
          el('label', { className: 'form-label' }, 'Type de réserve'),
          el('input', {
            type: 'text',
            className: 'form-input',
            id: 'cf-type-reserve',
            value: decisionCF.typeReserve || '',
            placeholder: 'Ex: DOCUMENT_MANQUANT'
          })
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Motif détaillé'),
          el('textarea', {
            className: 'form-input',
            id: 'cf-motif-reserve',
            rows: 3,
            placeholder: 'Décrire les réserves émises par le CF...'
          }, decisionCF.motifReserve || '')
        ]),

        el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
          el('label', { className: 'form-label' }, 'Commentaire'),
          el('textarea', {
            className: 'form-input',
            id: 'cf-commentaire',
            rows: 2,
            placeholder: 'Commentaires additionnels...'
          }, decisionCF.commentaire || '')
        ])
      ])
    ])
  ]);
}

/**
 * Section Clé de Répartition
 */
function renderCleRepartitionSection(montantHT, montantTTC, livrables, registries) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📊 Clé de Répartition Multi-Bailleurs')
    ]),
    el('div', { className: 'card-body', id: 'cle-repartition-container' })
  ]);
}

/**
 * Section Échéancier
 */
function renderEcheancierSection(montantMarcheTotal, livrables, registries) {
  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '📅 Échéancier de Paiement')
    ]),
    el('div', { className: 'card-body', id: 'echeancier-container' })
  ]);
}

/**
 * Initialiser les widgets après rendu
 */
function initializeWidgets(operation, registries) {
  const cleContainer = document.getElementById('cle-repartition-container');
  const echeancierContainer = document.getElementById('echeancier-container');

  if (cleContainer) {
    const montantHT = parseFloat(document.getElementById('attr-montant-ht')?.value) || 0;
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc')?.value) || 0;

    const widget = renderCleRepartitionManager(
      cleRepartitionList,
      montantHT,
      montantTTC,
      registries,
      (updatedList) => {
        cleRepartitionList = updatedList;
      }
    );
    cleContainer.innerHTML = '';
    cleContainer.appendChild(widget);
  }

  if (echeancierContainer) {
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc')?.value) || 0;

    const widget = renderEcheancierManager(
      echeancierData,
      operation.livrables || [],
      montantTTC,
      registries,
      (updatedEcheancier) => {
        echeancierData = updatedEcheancier;
      }
    );
    echeancierContainer.innerHTML = '';
    echeancierContainer.appendChild(widget);
  }
}

/**
 * Sauvegarde de l'attribution
 */
async function handleSave(idOperation, operation) {
  try {
    // Collecte des données
    const montantHT = parseFloat(document.getElementById('attr-montant-ht').value);
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc').value);

    if (!montantHT || montantHT <= 0) {
      alert('⚠️ Veuillez saisir un montant HT valide');
      return;
    }

    // Garanties (simplifié pour l'instant - à enrichir plus tard)
    // Note: Les garanties seront gérées plus tard

    // Données attribution simplifiées
    const attributionId = `ATTR-${idOperation}`;
    const attributionData = {
      id: attributionId,
      operationId: idOperation,
      attributaire: {
        singleOrGroup: 'SIMPLE',
        groupType: null,
        entrepriseId: null,
        groupementId: null,
        entreprises: []
      },
      montants: {
        ht: montantHT,
        ttc: montantTTC,
        confidentiel: false
      },
      dates: {
        signatureTitulaire: null,
        signatureAC: null,
        approbation: null,
        decisionCF: null
      },
      decisionCF: {
        etat: null,
        motifRef: null,
        commentaire: ''
      },
      delaiExecution: 0,
      delaiUnite: 'MOIS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Sauvegarder attribution
    const existingAttr = await dataService.get(ENTITIES.ATTRIBUTION, attributionId);
    let attrResult;

    if (existingAttr) {
      attrResult = await dataService.update(ENTITIES.ATTRIBUTION, attributionId, attributionData);
      logger.info('[ECR03A] Attribution mise à jour', attributionData);
    } else {
      attrResult = await dataService.create(ENTITIES.ATTRIBUTION, attributionData);
      logger.info('[ECR03A] Attribution créée', attributionData);
    }

    if (!attrResult.success) {
      alert('❌ Erreur lors de la sauvegarde de l\'attribution');
      return;
    }

    // Mettre à jour l'opération
    const updateOp = {
      montantFinal: montantTTC
    };

    if (!operation.timeline.includes('ATTR')) {
      updateOp.timeline = [...operation.timeline, 'ATTR'];
      updateOp.etat = 'EN_ATTR';
    }

    const opResult = await dataService.update(ENTITIES.OPERATION, idOperation, updateOp);

    if (opResult.success) {
      alert('✅ Attribution enregistrée avec succès');
      router.navigate('/fiche-marche', { idOperation });
    } else {
      alert('❌ Erreur lors de la mise à jour de l\'opération');
    }

  } catch (err) {
    logger.error('[ECR03A] Erreur sauvegarde', err);
    alert(`❌ Erreur lors de la sauvegarde : ${err.message}`);
  }
}

/**
 * Collecte les données d'une garantie
 */
function collectGarantieData(id) {
  const existe = document.getElementById(`garantie-${id}-existe`).checked;

  if (!existe) {
    return { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };
  }

  const montant = parseFloat(document.getElementById(`garantie-${id}-montant`).value) || 0;
  const dateEmission = document.getElementById(`garantie-${id}-emission`).value || null;
  const dateEcheance = document.getElementById(`garantie-${id}-echeance`).value || null;

  // Simuler upload document
  const docFile = document.getElementById(`garantie-${id}-doc`).files[0];
  const docRef = docFile ? `garantie_${id}_${Date.now()}_${docFile.name}` : null;

  return {
    existe: true,
    montant,
    dateEmission,
    dateEcheance,
    docRef
  };
}

export default renderAttribution;
