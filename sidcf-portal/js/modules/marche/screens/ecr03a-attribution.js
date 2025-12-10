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
import {
  isFieldRequired,
  isFieldOptional,
  isFieldHidden,
  getContextualConfig
} from '../../../lib/procedure-context.js';

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

    // Get mode de passation for contextual behavior
    const modePassation = operation.modePassation || 'PSD';

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

      // Alerte contextuelle
      renderContextualAlert(modePassation),

      // Formulaire
      renderAttributionForm(existingAttribution, operation, registries, modePassation),

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
 * Alerte contextuelle
 */
function renderContextualAlert(modePassation) {
  const config = getContextualConfig(modePassation, 'attribution');
  if (!config || !config.note) return null;

  const isPI = modePassation === 'PI';
  const isAOO = modePassation === 'AOO';

  return el('div', { className: 'card', style: { marginBottom: '24px', borderColor: isPI ? '#dc3545' : '#0dcaf0' } }, [
    el('div', { className: 'card-header', style: { background: isPI ? '#f8d7da' : '#cff4fc' } }, [
      el('h3', { className: 'card-title', style: { color: isPI ? '#842029' : '#055160' } }, [
        el('span', {}, isPI ? '⚠️ Procédure PI - Particularités' : isAOO ? '✅ Procédure AOO - Garanties obligatoires' : '📌 Exigences contextuelles')
      ])
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'alert ' + (isPI ? 'alert-danger' : 'alert-info') }, [
        el('strong', {}, config.note),
        isPI ? el('p', { style: { marginTop: '8px' } }, 'Les champs de garanties et d\'avance seront masqués automatiquement.') : null,
        isAOO ? el('p', { style: { marginTop: '8px' } }, 'Les garanties d\'avance et de bonne exécution sont OBLIGATOIRES pour ce mode.') : null
      ])
    ])
  ]);
}

/**
 * Formulaire d'attribution
 */
function renderAttributionForm(attribution, operation, registries, modePassation) {
  const existingAttr = attribution || {};
  const montantHT = existingAttr.montants?.ht || operation.montantPrevisionnel || 0;
  const montantTTC = existingAttr.montants?.ttc || (montantHT * 1.18);

  return el('div', { style: { display: 'flex', flexDirection: 'column', gap: '24px' } }, [
    // Section Attributaire (NOUVELLE)
    renderAttributaireSection(existingAttr.attributaire || {}, registries),

    // Section Montants
    renderMontantsSection(montantHT, montantTTC),

    // Section Garanties (contextuelle)
    renderGarantiesSection(existingAttr.garanties || {}, modePassation),

    // Section Réserves CF
    renderReservesCFSection(existingAttr.decisionCF || {}),

    // Section TVA supportée par l'État
    renderTVASection(existingAttr.tvaEtat || {}),

    // Section Clé de Répartition
    renderCleRepartitionSection(montantHT, montantTTC, operation.livrables || [], registries),

    // Section Échéancier
    renderEcheancierSection(montantTTC, operation.livrables || [], registries)
  ]);
}

/**
 * Section Attributaire
 */
function renderAttributaireSection(attributaire, registries) {
  // Extraire les données existantes
  const singleOrGroup = attributaire.singleOrGroup || 'SIMPLE';
  const existingEntreprises = attributaire.entreprises || [];

  // Pour une entreprise simple, récupérer les infos
  const entrepriseSimple = singleOrGroup === 'SIMPLE' && existingEntreprises.length > 0
    ? existingEntreprises[0]
    : { raisonSociale: '', ncc: '', adresse: '', telephone: '', email: '' };

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '🏢 Attributaire du marché')
    ]),
    el('div', { className: 'card-body' }, [
      // Type d'attributaire
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label' }, 'Type d\'attributaire'),
        el('div', { style: { display: 'flex', gap: '24px' } }, [
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'attr-type',
              value: 'SIMPLE',
              checked: singleOrGroup === 'SIMPLE',
              onchange: () => toggleAttributaireType('SIMPLE')
            }),
            'Entreprise unique'
          ]),
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'attr-type',
              value: 'GROUPEMENT',
              checked: singleOrGroup === 'GROUPEMENT',
              onchange: () => toggleAttributaireType('GROUPEMENT')
            }),
            'Groupement d\'entreprises'
          ])
        ])
      ]),

      // Section Entreprise Unique
      el('div', {
        id: 'attr-entreprise-simple',
        style: { display: singleOrGroup === 'SIMPLE' ? 'block' : 'none' }
      }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Raison sociale',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-raison-sociale',
              value: entrepriseSimple.raisonSociale || '',
              placeholder: 'Nom de l\'entreprise',
              required: true
            })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'N° Compte Contribuable (NCC)'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-ncc',
              value: entrepriseSimple.ncc || '',
              placeholder: 'Ex: CI-ABJ-2024-XXXXX'
            })
          ])
        ]),
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Adresse'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-adresse',
              value: entrepriseSimple.adresse || '',
              placeholder: 'Adresse complète'
            })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Téléphone'),
            el('input', {
              type: 'tel',
              className: 'form-input',
              id: 'attr-telephone',
              value: entrepriseSimple.telephone || '',
              placeholder: '+225 XX XX XX XX XX'
            })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Email'),
            el('input', {
              type: 'email',
              className: 'form-input',
              id: 'attr-email',
              value: entrepriseSimple.email || '',
              placeholder: 'contact@entreprise.ci'
            })
          ])
        ])
      ]),

      // Section Groupement (simplifié pour l'instant)
      el('div', {
        id: 'attr-groupement',
        style: { display: singleOrGroup === 'GROUPEMENT' ? 'block' : 'none' }
      }, [
        el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Groupement d\'entreprises'),
            el('div', { className: 'alert-message' }, 'Saisissez les informations du mandataire du groupement.')
          ])
        ]),
        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Type de groupement'),
          el('select', { className: 'form-input', id: 'attr-group-type' }, [
            el('option', { value: 'CONJOINT' }, 'Groupement conjoint'),
            el('option', { value: 'SOLIDAIRE' }, 'Groupement solidaire')
          ])
        ]),
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Raison sociale (Mandataire)',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-mandataire-raison-sociale',
              placeholder: 'Nom de l\'entreprise mandataire'
            })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'N° Compte Contribuable'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-mandataire-ncc',
              placeholder: 'NCC du mandataire'
            })
          ])
        ]),
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Adresse'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-mandataire-adresse',
              placeholder: 'Adresse du mandataire'
            })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Téléphone'),
            el('input', {
              type: 'tel',
              className: 'form-input',
              id: 'attr-mandataire-telephone',
              placeholder: '+225 XX XX XX XX XX'
            })
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Email'),
            el('input', {
              type: 'email',
              className: 'form-input',
              id: 'attr-mandataire-email',
              placeholder: 'contact@mandataire.ci'
            })
          ])
        ]),
        // Liste des membres du groupement (à implémenter plus tard)
        el('div', { style: { marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-gray-100)', borderRadius: '8px' } }, [
          el('div', { className: 'text-small text-muted' }, 'Les autres membres du groupement pourront être ajoutés ultérieurement.')
        ])
      ])
    ])
  ]);
}

/**
 * Toggle entre entreprise unique et groupement
 */
function toggleAttributaireType(type) {
  const simpleDiv = document.getElementById('attr-entreprise-simple');
  const groupDiv = document.getElementById('attr-groupement');

  if (simpleDiv && groupDiv) {
    simpleDiv.style.display = type === 'SIMPLE' ? 'block' : 'none';
    groupDiv.style.display = type === 'GROUPEMENT' ? 'block' : 'none';
  }
}

/**
 * Section Montants
 */
function renderMontantsSection(montantHT, montantTTC) {
  // Déterminer la base par défaut (HT si disponible, sinon TTC)
  const defaultBase = montantHT > 0 ? 'HT' : 'TTC';
  const defaultMontant = defaultBase === 'HT' ? montantHT : montantTTC;

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '💰 Montants du marché')
    ]),
    el('div', { className: 'card-body' }, [
      // Sélection de la base de calcul
      el('div', { style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label' }, 'Base de calcul'),
        el('div', { style: { display: 'flex', gap: '16px' } }, [
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'base-calcul',
              value: 'HT',
              checked: defaultBase === 'HT',
              onchange: () => updateMontantsDisplay()
            }),
            'Montant HT'
          ]),
          el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
            el('input', {
              type: 'radio',
              name: 'base-calcul',
              value: 'TTC',
              checked: defaultBase === 'TTC',
              onchange: () => updateMontantsDisplay()
            }),
            'Montant TTC'
          ])
        ])
      ]),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        // Montant saisi (HT ou TTC selon la base)
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label', id: 'label-montant-base' }, [
            defaultBase === 'HT' ? 'Montant HT (XOF)' : 'Montant TTC (XOF)',
            el('span', { className: 'required' }, '*')
          ]),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'attr-montant-base',
            value: defaultMontant,
            required: true,
            min: 0,
            step: 1,
            oninput: () => calculerMontants()
          })
        ]),

        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, 'Taux TVA (%)'),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'attr-taux-tva',
            value: 18,
            min: 0,
            max: 100,
            step: 0.01,
            oninput: () => calculerMontants()
          }),
          el('small', { className: 'text-muted' }, 'Taux standard Côte d\'Ivoire: 18%')
        ]),

        // Montant calculé (TTC ou HT selon la base)
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label', id: 'label-montant-calcule' },
            defaultBase === 'HT' ? 'Montant TTC (XOF)' : 'Montant HT (XOF)'
          ),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'attr-montant-calcule',
            value: defaultBase === 'HT' ? (montantHT * 1.18).toFixed(0) : (montantTTC / 1.18).toFixed(0),
            disabled: true,
            style: { backgroundColor: '#e9ecef', fontWeight: 'bold' }
          })
        ])
      ]),

      // Résumé des montants
      el('div', { id: 'montants-resume', style: { marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-gray-100)', borderRadius: '8px' } }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' } }, [
          el('div', {}, [
            el('div', { className: 'text-small text-muted' }, 'HT'),
            el('div', { id: 'resume-ht', style: { fontWeight: '600' } }, formatMoney(defaultBase === 'HT' ? defaultMontant : defaultMontant / 1.18))
          ]),
          el('div', {}, [
            el('div', { className: 'text-small text-muted' }, 'TVA (18%)'),
            el('div', { id: 'resume-tva', style: { fontWeight: '600' } }, formatMoney(defaultBase === 'HT' ? defaultMontant * 0.18 : defaultMontant - defaultMontant / 1.18))
          ]),
          el('div', {}, [
            el('div', { className: 'text-small text-muted' }, 'TTC'),
            el('div', { id: 'resume-ttc', style: { fontWeight: '600', color: 'var(--color-primary)' } }, formatMoney(defaultBase === 'HT' ? defaultMontant * 1.18 : defaultMontant))
          ])
        ])
      ]),

      // Champs cachés pour stocker HT et TTC
      el('input', { type: 'hidden', id: 'attr-montant-ht', value: defaultBase === 'HT' ? defaultMontant : (defaultMontant / 1.18).toFixed(0) }),
      el('input', { type: 'hidden', id: 'attr-montant-ttc', value: defaultBase === 'HT' ? (defaultMontant * 1.18).toFixed(0) : defaultMontant })
    ])
  ]);
}

/**
 * Format money for display
 */
function formatMoney(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' XOF';
}

/**
 * Update montants display when base changes
 */
function updateMontantsDisplay() {
  const base = document.querySelector('input[name="base-calcul"]:checked')?.value || 'HT';
  const labelBase = document.getElementById('label-montant-base');
  const labelCalcule = document.getElementById('label-montant-calcule');

  if (labelBase && labelCalcule) {
    if (base === 'HT') {
      labelBase.innerHTML = 'Montant HT (XOF)<span class="required">*</span>';
      labelCalcule.textContent = 'Montant TTC (XOF)';
    } else {
      labelBase.innerHTML = 'Montant TTC (XOF)<span class="required">*</span>';
      labelCalcule.textContent = 'Montant HT (XOF)';
    }
  }

  calculerMontants();
}

/**
 * Calculer les montants HT/TTC
 */
function calculerMontants() {
  const base = document.querySelector('input[name="base-calcul"]:checked')?.value || 'HT';
  const montantBase = parseFloat(document.getElementById('attr-montant-base')?.value) || 0;
  const tauxTVA = parseFloat(document.getElementById('attr-taux-tva')?.value) || 18;

  let montantHT, montantTTC, montantTVA;

  if (base === 'HT') {
    montantHT = montantBase;
    montantTVA = montantHT * (tauxTVA / 100);
    montantTTC = montantHT + montantTVA;
  } else {
    montantTTC = montantBase;
    montantHT = montantTTC / (1 + tauxTVA / 100);
    montantTVA = montantTTC - montantHT;
  }

  // Update calculated field
  const montantCalcule = document.getElementById('attr-montant-calcule');
  if (montantCalcule) {
    montantCalcule.value = (base === 'HT' ? montantTTC : montantHT).toFixed(0);
  }

  // Update hidden fields
  document.getElementById('attr-montant-ht').value = montantHT.toFixed(0);
  document.getElementById('attr-montant-ttc').value = montantTTC.toFixed(0);

  // Update resume
  const resumeHT = document.getElementById('resume-ht');
  const resumeTVA = document.getElementById('resume-tva');
  const resumeTTC = document.getElementById('resume-ttc');

  if (resumeHT) resumeHT.textContent = formatMoney(montantHT);
  if (resumeTVA) resumeTVA.textContent = formatMoney(montantTVA);
  if (resumeTTC) resumeTTC.textContent = formatMoney(montantTTC);
}

/**
 * Section Garanties (contextuelle)
 */
function renderGarantiesSection(garanties, modePassation) {
  // Pour PI, masquer complètement la section garanties
  if (isFieldHidden('garantieAvance', modePassation, 'attribution') &&
      isFieldHidden('garantieBonneExecution', modePassation, 'attribution')) {
    return el('div', { className: 'card', style: { display: 'none' } });
  }

  const garantieAvance = garanties.garantieAvance || { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };
  const garantieBonneExec = garanties.garantieBonneExec || { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };
  const cautionnement = garanties.cautionnement || { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null };

  // Vérifier si les garanties sont obligatoires (AOO)
  const avanceObligatoire = isFieldRequired('garantieAvance', modePassation, 'attribution');
  const bonneExecObligatoire = isFieldRequired('garantieBonneExecution', modePassation, 'attribution');

  const garantiesVisibles = [];

  // Garantie d'avance (si non cachée)
  if (!isFieldHidden('garantieAvance', modePassation, 'attribution')) {
    garantiesVisibles.push(
      renderGarantieItem('avance', 'Garantie d\'avance' + (avanceObligatoire ? ' *' : ''), garantieAvance, avanceObligatoire)
    );
  }

  // Garantie de bonne exécution (si non cachée)
  if (!isFieldHidden('garantieBonneExecution', modePassation, 'attribution')) {
    if (garantiesVisibles.length > 0) {
      garantiesVisibles.push(el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } }));
    }
    garantiesVisibles.push(
      renderGarantieItem('bonne-exec', 'Garantie de bonne exécution' + (bonneExecObligatoire ? ' *' : ''), garantieBonneExec, bonneExecObligatoire)
    );
  }

  // Cautionnement (toujours optionnel)
  if (garantiesVisibles.length > 0) {
    garantiesVisibles.push(el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } }));
  }
  garantiesVisibles.push(
    renderGarantieItem('cautionnement', 'Cautionnement', cautionnement, false)
  );

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '🔐 Garanties et Cautionnement')
    ]),
    el('div', { className: 'card-body' }, garantiesVisibles)
  ]);
}

/**
 * Item de garantie
 */
function renderGarantieItem(id, label, garantie, required = false) {
  // Par défaut décoché, sauf si existe=true dans les données
  const isChecked = garantie.existe === true;

  return el('div', { style: { marginBottom: '16px' } }, [
    el('div', { style: { marginBottom: '12px' } }, [
      el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        el('input', {
          type: 'checkbox',
          id: `garantie-${id}-existe`,
          checked: isChecked,
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
        display: isChecked ? 'grid' : 'none',
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
  // Par défaut décoché, sauf si aReserves=true dans les données
  const aReserves = decisionCF.aReserves === true;

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
 * Section TVA supportée par l'État
 */
function renderTVASection(tvaEtat) {
  // Par défaut décoché, sauf si supporte=true dans les données
  const supporte = tvaEtat.supporte === true;

  return el('div', { className: 'card' }, [
    el('div', { className: 'card-header' }, [
      el('h3', { className: 'card-title' }, '💵 TVA supportée par l\'État')
    ]),
    el('div', { className: 'card-body' }, [
      el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
        el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          el('input', {
            type: 'checkbox',
            id: 'tva-etat-supporte',
            checked: supporte,
            onchange: (e) => {
              const detailsDiv = document.getElementById('tva-etat-details');
              if (detailsDiv) {
                detailsDiv.style.display = e.target.checked ? 'block' : 'none';
              }
            }
          }),
          el('span', {}, 'L\'État supporte la TVA (18%)')
        ])
      ]),

      el('div', {
        id: 'tva-etat-details',
        style: {
          display: supporte ? 'block' : 'none',
          padding: '16px',
          backgroundColor: '#d1ecf1',
          borderRadius: '4px'
        }
      }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Montant TVA supporté (XOF)'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'tva-etat-montant',
              value: tvaEtat.montant || '',
              min: 0,
              step: 0.01,
              placeholder: 'Calculé automatiquement ou saisir manuellement'
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Référence décision'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'tva-etat-reference',
              value: tvaEtat.reference || '',
              placeholder: 'Ex: Décision N°2024-XXX'
            })
          ])
        ]),

        el('div', { className: 'form-field', style: { marginTop: '12px' } }, [
          el('label', { className: 'form-label' }, 'Observations'),
          el('textarea', {
            className: 'form-input',
            id: 'tva-etat-observations',
            rows: 2,
            placeholder: 'Observations sur la prise en charge TVA par l\'État...'
          }, tvaEtat.observations || '')
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
    // Collecte des données attributaire
    const attrType = document.querySelector('input[name="attr-type"]:checked')?.value || 'SIMPLE';

    // Collecte des données de l'attributaire selon le type
    let attributaireData;
    let raisonSocialeValidation;

    if (attrType === 'SIMPLE') {
      const raisonSociale = document.getElementById('attr-raison-sociale')?.value?.trim() || '';
      const ncc = document.getElementById('attr-ncc')?.value?.trim() || '';
      const adresse = document.getElementById('attr-adresse')?.value?.trim() || '';
      const telephone = document.getElementById('attr-telephone')?.value?.trim() || '';
      const email = document.getElementById('attr-email')?.value?.trim() || '';

      raisonSocialeValidation = raisonSociale;

      attributaireData = {
        singleOrGroup: 'SIMPLE',
        groupType: null,
        entrepriseId: null,
        groupementId: null,
        entreprises: [{
          role: 'TITULAIRE',
          raisonSociale,
          ncc,
          adresse,
          telephone,
          email
        }]
      };
    } else {
      // Groupement
      const groupType = document.getElementById('attr-group-type')?.value || 'CONJOINT';
      const raisonSociale = document.getElementById('attr-mandataire-raison-sociale')?.value?.trim() || '';
      const ncc = document.getElementById('attr-mandataire-ncc')?.value?.trim() || '';
      const adresse = document.getElementById('attr-mandataire-adresse')?.value?.trim() || '';
      const telephone = document.getElementById('attr-mandataire-telephone')?.value?.trim() || '';
      const email = document.getElementById('attr-mandataire-email')?.value?.trim() || '';

      raisonSocialeValidation = raisonSociale;

      attributaireData = {
        singleOrGroup: 'GROUPEMENT',
        groupType,
        entrepriseId: null,
        groupementId: null,
        entreprises: [{
          role: 'MANDATAIRE',
          raisonSociale,
          ncc,
          adresse,
          telephone,
          email
        }]
      };
    }

    // Validation de la raison sociale
    if (!raisonSocialeValidation) {
      alert('⚠️ Veuillez saisir la raison sociale de l\'attributaire');
      return;
    }

    // Collecte des montants
    const montantHT = parseFloat(document.getElementById('attr-montant-ht').value);
    const montantTTC = parseFloat(document.getElementById('attr-montant-ttc').value);

    if (!montantHT || montantHT <= 0) {
      alert('⚠️ Veuillez saisir un montant HT valide');
      return;
    }

    // Garanties (simplifié pour l'instant - à enrichir plus tard)
    // Note: Les garanties seront gérées plus tard

    // Chercher si une attribution existe déjà pour cette opération
    const existingAttrs = await dataService.query(ENTITIES.ATTRIBUTION, { operationId: idOperation });
    const existingAttr = existingAttrs && existingAttrs.length > 0 ? existingAttrs[0] : null;

    // Données attribution complètes (sans ID si création, le backend le génère)
    // Données attribution - noms de colonnes en snake_case pour PostgreSQL
    const attributionData = {
      operation_id: idOperation,
      attributaire: attributaireData,
      montants: {
        ht: montantHT,
        ttc: montantTTC,
        confidentiel: false
      },
      dates: {
        signatureTitulaire: null,
        signatureAC: null,
        approbation: null,
        delaiExecution: 0,
        delaiUnite: 'MOIS'
      },
      decision_cf: {
        etat: null,
        motifRef: null,
        commentaire: ''
      },
      garanties: {},
      updated_at: new Date().toISOString()
    };

    // Sauvegarder attribution
    let attrResult;

    if (existingAttr) {
      // Mise à jour avec l'ID existant
      attrResult = await dataService.update(ENTITIES.ATTRIBUTION, existingAttr.id, attributionData);
      logger.info('[ECR03A] Attribution mise à jour', { id: existingAttr.id, ...attributionData });
    } else {
      // Création - ajouter created_at
      attributionData.created_at = new Date().toISOString();
      attrResult = await dataService.add(ENTITIES.ATTRIBUTION, attributionData);
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
