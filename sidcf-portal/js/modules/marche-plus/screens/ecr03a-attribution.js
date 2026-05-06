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
import { renderCleRepartitionManager } from '../../../ui/widgets/cle-repartition-manager-mp.js';
import { renderEcheancierManager } from '../../../ui/widgets/echeancier-manager-mp.js';
import {
  isFieldRequired,
  isFieldOptional,
  isFieldHidden,
  getContextualConfig
} from '../../../lib/procedure-context.js';
import { getLotData, buildLotPatch, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';
import { renderLotSelector } from '../../../ui/widgets/lot-selector.js';
import { checkSanction, renderSanctionBanner, openSanctionsDrawer } from '../../../lib/mp-sanctions.js';
import { loadBanques } from '../../../lib/mp-banques.js';
import { renderMontantPourcentageInput } from '../../../ui/widgets/montant-pourcentage-input.js';
import { validateTaux, getLabelContraintes } from '../../../lib/mp-garanties-rules.js';

// Cache local pour éviter de recharger les banques à chaque render
let _banquesCache = null;
async function getBanques() {
  if (!_banquesCache) _banquesCache = await loadBanques();
  return _banquesCache;
}

// État global pour les widgets
let cleRepartitionList = [];
let echeancierData = null;
// Marché+ multi-lot : lot courant pour cet écran
let currentLotId = null;

// Debounce simple pour la détection sanctions (évite un appel à chaque touche)
let sanctionCheckTimer = null;
function triggerSanctionCheck() {
  clearTimeout(sanctionCheckTimer);
  sanctionCheckTimer = setTimeout(async () => {
    const banner = document.getElementById('attr-sanction-banner');
    if (!banner) return;
    const raisonSociale = (document.getElementById('attr-raison-sociale')?.value || '').trim();
    const ncc = (document.getElementById('attr-ncc')?.value || '').trim();
    if (!raisonSociale && !ncc) {
      banner.innerHTML = '';
      return;
    }
    const sanction = await checkSanction({ raisonSociale, ncc });
    banner.innerHTML = '';
    if (sanction) {
      const node = renderSanctionBanner(sanction);
      if (node) banner.appendChild(node);
    }
  }, 300);
}
// Exposer pour usage depuis les onload après mount (cf. fin de renderAttribution)
window.__mpTriggerSanctionCheck = triggerSanctionCheck;

export async function renderAttribution(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID marché manquant')
    ]));
    return;
  }

  logger.info('[ECR03A] Chargement écran Attribution', { idOperation });

  try {
    // Charger les données
    const fullData = await dataService.getMpOperationFull(idOperation);
    if (!fullData?.operation) {
      mount('#app', el('div', { className: 'page' }, [
        el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')
      ]));
      return;
    }

    const { operation, procedure, attribution } = fullData;
    const registries = dataService.getAllRegistries();

    // Get mode de passation for contextual behavior
    const modePassation = operation.modePassation || 'PSD';

    // Marché+ multi-lot : résoudre le lot courant depuis la procédure
    const lots = getLotsFromProcedure(procedure);
    currentLotId = resolveCurrentLotId(lots, params);

    // Charger attribution existante (si elle existe déjà), scopée au lot courant
    const rawAttribution = attribution;
    const existingAttribution = getLotData(rawAttribution, currentLotId);

    // Initialiser l'état
    cleRepartitionList = [];
    echeancierData = { periodicite: 'LIBRE', periodiciteJours: null, items: [], total: 0, totalPourcent: 0 };

    const page = el('div', { className: 'page' }, [
      // Header
      el('div', { className: 'page-header' }, [
        el('button', {
          className: 'btn btn-secondary btn-sm',
          onclick: () => router.navigate('/mp/fiche-marche', { idOperation })
        }, '← Retour fiche'),
        el('h1', { className: 'page-title', style: { marginTop: '12px' } }, 'Attribution du Marché'),
        el('p', { className: 'page-subtitle' }, operation.objet)
      ]),

      // Sélecteur de lot (visible si > 1 lot)
      renderLotSelector({
        lots,
        currentLotId,
        route: '/mp/attribution',
        routeParams: { idOperation }
      }),

      // Alerte contextuelle
      renderContextualAlert(modePassation),

      // Formulaire (scopé au lot courant)
      renderAttributionForm(existingAttribution, operation, registries, modePassation),

      // Actions
      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
            el('button', {
              type: 'button',
              className: 'btn btn-secondary',
              onclick: () => router.navigate('/mp/fiche-marche', { idOperation })
            }, 'Annuler'),
            el('button', {
              type: 'button',
              className: 'btn btn-primary',
              onclick: async () => await handleSave(idOperation, operation, rawAttribution, currentLotId)
            }, (rawAttribution && (currentLotId ? rawAttribution.parLot?.[currentLotId] : true)) ? '💾 Mettre à jour' : '✅ Enregistrer l\'attribution')
          ])
        ])
      ])
    ]);

    mount('#app', page);

    // Initialiser les widgets après montage
    setTimeout(() => initializeWidgets(operation, registries), 100);

    // Déclencher la détection sanctions sur les valeurs initiales (chargement d'un attributaire existant)
    setTimeout(() => triggerSanctionCheck(), 150);

    // Marché+ : remplir les selects banques (entreprise simple + mandataire) en async
    setTimeout(() => {
      populateBanqueSelect('attr-banque');
      populateBanqueSelect('attr-mandataire-banque');
    }, 100);

    // Marché+ : instancier les widgets montant/% pour les 3 garanties
    setTimeout(() => {
      ['avance', 'bonne-exec', 'cautionnement'].forEach(id => initGarantieWidget(id));
    }, 120);

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

    // Section Garanties (contextuelle) — Marché+ : on passe aussi le montant
    // attribué pour que le widget montant/% puisse calculer les pourcentages.
    renderGarantiesSection(existingAttr.garanties || {}, modePassation, montantHT || montantTTC || 0),

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
    : { raisonSociale: '', ncc: '', adresse: '', telephone: '', email: '', coordonneesBancaires: {} };
  // Coordonnées bancaires (peuvent être absentes sur les anciens enregistrements)
  const cbSimple = entrepriseSimple.coordonneesBancaires || {};

  // Mandataire pour le groupement (idem)
  const mandataire = singleOrGroup === 'GROUPEMENT' && existingEntreprises.length > 0
    ? existingEntreprises[0]
    : {};
  const cbMandataire = mandataire.coordonneesBancaires || {};

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
        // Bouton de gestion des sanctions (drawer)
        el('div', { style: { textAlign: 'right', marginBottom: '8px' } }, [
          el('button', {
            type: 'button',
            className: 'btn btn-sm btn-secondary',
            onclick: (e) => { e.preventDefault(); openSanctionsDrawer(); }
          }, '🚫 Gérer la liste des entreprises sanctionnées')
        ]),
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
              required: true,
              oninput: (e) => triggerSanctionCheck()
            }),
            el('div', { id: 'attr-sanction-banner' }) // bandeau d'alerte
          ]),
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'N° Compte Contribuable (NCC)'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'attr-ncc',
              value: entrepriseSimple.ncc || '',
              placeholder: 'Ex: CI-ABJ-2024-XXXXX',
              oninput: (e) => triggerSanctionCheck()
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
        ]),

        // Coordonnées bancaires (Marché+ — modif #18)
        renderCoordonneesBancairesSection('attr', cbSimple)
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

        // Coordonnées bancaires du mandataire (Marché+ — modif #18)
        renderCoordonneesBancairesSection('attr-mandataire', cbMandataire),

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
function renderGarantiesSection(garanties, modePassation, montantTotal = 0) {
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
      renderGarantieItem('avance', 'Garantie d\'avance' + (avanceObligatoire ? ' *' : ''), garantieAvance, avanceObligatoire, montantTotal, 'avance')
    );
  }

  // Garantie de bonne exécution (si non cachée)
  if (!isFieldHidden('garantieBonneExecution', modePassation, 'attribution')) {
    if (garantiesVisibles.length > 0) {
      garantiesVisibles.push(el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } }));
    }
    garantiesVisibles.push(
      renderGarantieItem('bonne-exec', 'Garantie de bonne exécution' + (bonneExecObligatoire ? ' *' : ''), garantieBonneExec, bonneExecObligatoire, montantTotal, 'bonneExec')
    );
  }

  // Cautionnement (toujours optionnel)
  if (garantiesVisibles.length > 0) {
    garantiesVisibles.push(el('hr', { style: { margin: '16px 0', borderColor: '#dee2e6' } }));
  }
  garantiesVisibles.push(
    renderGarantieItem('cautionnement', 'Cautionnement', cautionnement, false, montantTotal, 'cautionnement')
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
/**
 * Section Coordonnées bancaires (Marché+ — modif #18)
 * idPrefix : 'attr' (entreprise simple) ou 'attr-mandataire' (mandataire de groupement)
 * Le select banque est rempli en async après le mount via populateBanqueSelect.
 */
function renderCoordonneesBancairesSection(idPrefix, cb) {
  const data = cb || {};
  return el('div', {
    style: {
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px dashed #d1d5db'
    }
  }, [
    el('h4', {
      style: { margin: '0 0 12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }
    }, ['🏦 Coordonnées bancaires']),
    el('p', { className: 'text-small text-muted', style: { marginBottom: '12px' } },
      'Nécessaires pour l\'émission des paiements en exécution.'),

    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Banque'),
        // Select rempli après mount via populateBanqueSelect()
        el('select', {
          className: 'form-input',
          id: `${idPrefix}-banque`,
          'data-selected': data.banque || ''
        }, [
          el('option', { value: '' }, '-- Chargement... --')
        ])
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Agence'),
        el('input', {
          type: 'text',
          className: 'form-input',
          id: `${idPrefix}-banque-agence`,
          value: data.agence || '',
          placeholder: 'Plateau, Cocody, etc.'
        })
      ])
    ]),

    el('div', { className: 'form-field', style: { marginTop: '16px' } }, [
      el('label', { className: 'form-label' }, 'Numéro de compte (RIB / IBAN)'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: `${idPrefix}-banque-numero`,
        value: data.numeroCompte || '',
        placeholder: 'Ex: CI05 BICI 01040 0011 4555 0048 7'
      })
    ]),

    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' } }, [
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'Intitulé du compte'),
        el('input', {
          type: 'text',
          className: 'form-input',
          id: `${idPrefix}-banque-intitule`,
          value: data.intituleCompte || '',
          placeholder: 'Si différent de la raison sociale'
        })
      ]),
      el('div', { className: 'form-field' }, [
        el('label', { className: 'form-label' }, 'SWIFT / BIC'),
        el('input', {
          type: 'text',
          className: 'form-input',
          id: `${idPrefix}-banque-swift`,
          value: data.swiftBic || '',
          placeholder: 'BICIIVCIA, SGCIIVCI, ...'
        })
      ])
    ])
  ]);
}

// API des widgets garanties (montant/%) — clé : id ('avance', 'bonne-exec', 'cautionnement')
const _garantieWidgetApis = {};

function initGarantieWidget(id) {
  const host = document.getElementById(`garantie-${id}-montant-host`);
  if (!host) return;
  const initMontant = parseFloat(host.dataset.initMontant) || 0;
  const initMode = host.dataset.initMode || 'MONTANT';
  const total = parseFloat(host.dataset.total) || 0;
  const regleType = host.dataset.regleType || null;

  const widget = renderMontantPourcentageInput({
    id: `garantie-${id}-montant`,
    total,
    value: initMontant,
    mode: initMode,
    onChange: (montant /* mode */) => {
      // Mettre à jour le warning seuil
      updateGarantieWarning(id, montant, total, regleType);
    }
  });
  host.innerHTML = '';
  host.appendChild(widget);
  _garantieWidgetApis[id] = widget._mpInput;
  // Premier calcul du warning
  updateGarantieWarning(id, initMontant, total, regleType);
}

function updateGarantieWarning(id, montant, total, regleType) {
  const warnHost = document.getElementById(`garantie-${id}-warning`);
  if (!warnHost) return;
  warnHost.innerHTML = '';
  if (!regleType || total <= 0 || montant <= 0) return;

  const taux = (montant / total) * 100;
  const v = validateTaux(regleType, taux);
  if (v.severity === 'warning') {
    const banner = el('div', {
      style: {
        padding: '6px 10px',
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderLeft: '3px solid #f59e0b',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#92400e'
      }
    }, v.message);
    warnHost.appendChild(banner);
  } else if (v.severity === 'ok' && v.tauxMin != null) {
    const banner = el('div', {
      style: {
        padding: '4px 8px',
        fontSize: '11px',
        color: '#16a34a'
      }
    }, `✓ ${v.message}`);
    warnHost.appendChild(banner);
  }
}

/**
 * Remplit un <select> banque en async après le mount.
 */
async function populateBanqueSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const banques = await getBanques();
  const selected = sel.getAttribute('data-selected') || '';
  sel.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = ''; opt0.textContent = '-- Sélectionner --';
  sel.appendChild(opt0);
  banques.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.code;
    opt.textContent = b.label;
    if (b.code === selected) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderGarantieItem(id, label, garantie, required = false, montantTotal = 0, regleType = null) {
  // Par défaut décoché, sauf si existe=true dans les données
  const isChecked = garantie.existe === true;
  const contraintes = regleType ? getLabelContraintes(regleType) : '';

  return el('div', { style: { marginBottom: '16px' } }, [
    el('div', { style: { marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
      el('label', { className: 'form-label', style: { display: 'flex', alignItems: 'center', gap: '8px', margin: 0 } }, [
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
      ]),
      // Badge contraintes légales (à droite du titre)
      contraintes ? el('span', {
        style: {
          fontSize: '11px',
          fontWeight: '600',
          padding: '3px 8px',
          borderRadius: '12px',
          background: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #93c5fd'
        }
      }, `📐 ${contraintes}`) : null
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
      el('div', { className: 'form-field', style: { gridColumn: 'span 1' } }, [
        el('label', { className: 'form-label' }, 'Montant ou %'),
        // Host pour le widget montant/% — instancié après mount via initGarantieWidget
        el('div', {
          id: `garantie-${id}-montant-host`,
          'data-init-montant': String(garantie.montant || 0),
          'data-init-mode': garantie.saisieMode || 'MONTANT',
          'data-total': String(montantTotal),
          'data-regle-type': regleType || ''
        }),
        // Bandeau warning (caché par défaut, alimenté par le listener du widget)
        el('div', { id: `garantie-${id}-warning`, style: { marginTop: '4px' } })
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
 *
 * Marché+ multi-lot : si lotId est fourni, on écrit dans
 * `entity.parLot[lotId]` plutôt qu'à la racine. Comportement transparent
 * pour les opérations à 1 lot ou héritées (lotId = null).
 */
async function handleSave(idOperation, operation, rawAttribution = null, lotId = null) {
  try {
    // Collecte des données attributaire
    const attrType = document.querySelector('input[name="attr-type"]:checked')?.value || 'SIMPLE';

    // Collecte des données de l'attributaire selon le type
    let attributaireData;
    let raisonSocialeValidation;

    // Helper pour collecter les coordonnées bancaires
    const collectCoordonneesBancaires = (prefix) => {
      const banque = document.getElementById(`${prefix}-banque`)?.value?.trim() || '';
      const agence = document.getElementById(`${prefix}-banque-agence`)?.value?.trim() || '';
      const numeroCompte = document.getElementById(`${prefix}-banque-numero`)?.value?.trim() || '';
      const intituleCompte = document.getElementById(`${prefix}-banque-intitule`)?.value?.trim() || '';
      const swiftBic = document.getElementById(`${prefix}-banque-swift`)?.value?.trim() || '';
      // Ne renvoyer un objet que si au moins un champ est saisi
      if (!banque && !agence && !numeroCompte && !intituleCompte && !swiftBic) return undefined;
      return { banque, agence, numeroCompte, intituleCompte, swiftBic };
    };

    if (attrType === 'SIMPLE') {
      const raisonSociale = document.getElementById('attr-raison-sociale')?.value?.trim() || '';
      const ncc = document.getElementById('attr-ncc')?.value?.trim() || '';
      const adresse = document.getElementById('attr-adresse')?.value?.trim() || '';
      const telephone = document.getElementById('attr-telephone')?.value?.trim() || '';
      const email = document.getElementById('attr-email')?.value?.trim() || '';
      const coordonneesBancaires = collectCoordonneesBancaires('attr');

      raisonSocialeValidation = raisonSociale;

      const ent = { role: 'TITULAIRE', raisonSociale, ncc, adresse, telephone, email };
      if (coordonneesBancaires) ent.coordonneesBancaires = coordonneesBancaires;

      attributaireData = {
        singleOrGroup: 'SIMPLE',
        groupType: null,
        entrepriseId: null,
        groupementId: null,
        entreprises: [ent]
      };
    } else {
      // Groupement
      const groupType = document.getElementById('attr-group-type')?.value || 'CONJOINT';
      const raisonSociale = document.getElementById('attr-mandataire-raison-sociale')?.value?.trim() || '';
      const ncc = document.getElementById('attr-mandataire-ncc')?.value?.trim() || '';
      const adresse = document.getElementById('attr-mandataire-adresse')?.value?.trim() || '';
      const telephone = document.getElementById('attr-mandataire-telephone')?.value?.trim() || '';
      const email = document.getElementById('attr-mandataire-email')?.value?.trim() || '';
      const coordonneesBancaires = collectCoordonneesBancaires('attr-mandataire');

      raisonSocialeValidation = raisonSociale;

      const ent = { role: 'MANDATAIRE', raisonSociale, ncc, adresse, telephone, email };
      if (coordonneesBancaires) ent.coordonneesBancaires = coordonneesBancaires;

      attributaireData = {
        singleOrGroup: 'GROUPEMENT',
        groupType,
        entrepriseId: null,
        groupementId: null,
        entreprises: [ent]
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

    // Garanties (Marché+ — modif #18 : montant via widget montant/%)
    const collectGarantie = (id) => {
      const existe = document.getElementById(`garantie-${id}-existe`)?.checked === true;
      if (!existe) return { existe: false, montant: 0 };
      const api = _garantieWidgetApis[id];
      const montant = api ? api.getMontant() : 0;
      const saisieMode = api ? api.getMode() : 'MONTANT';
      const dateEmission = document.getElementById(`garantie-${id}-emission`)?.value || null;
      const dateEcheance = document.getElementById(`garantie-${id}-echeance`)?.value || null;
      return { existe: true, montant, saisieMode, dateEmission, dateEcheance };
    };
    const garantiesData = {
      garantieAvance: collectGarantie('avance'),
      garantieBonneExec: collectGarantie('bonne-exec'),
      cautionnement: collectGarantie('cautionnement')
    };

    // Chercher si une attribution existe déjà pour cette opération
    const existingAttrs = await dataService.query(ENTITIES.MP_ATTRIBUTION, { operationId: idOperation });
    const existingAttr = (existingAttrs && existingAttrs.length > 0) ? existingAttrs[0] : (rawAttribution || null);

    // Champs métier (per-lot ou racine selon lotId)
    const lotFields = {
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
      garanties: garantiesData
    };

    // Construit le patch : si lotId, les champs vont sous parLot[lotId]
    const lotPatch = buildLotPatch(lotId, lotFields, existingAttr);

    // Sauvegarder attribution
    let attrResult;

    if (existingAttr && existingAttr.id) {
      // Mise à jour
      const updateData = {
        ...lotPatch,
        operation_id: idOperation,
        updated_at: new Date().toISOString()
      };
      attrResult = await dataService.update(ENTITIES.MP_ATTRIBUTION, existingAttr.id, updateData);
      logger.info('[ECR03A] Attribution mise à jour', { id: existingAttr.id, lotId });
    } else {
      // Création
      const createData = {
        ...lotPatch,
        operation_id: idOperation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      attrResult = await dataService.add(ENTITIES.MP_ATTRIBUTION, createData);
      logger.info('[ECR03A] Attribution créée', { lotId });
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

    const opResult = await dataService.update(ENTITIES.MP_OPERATION, idOperation, updateOp);

    if (opResult.success) {
      alert('✅ Attribution enregistrée avec succès');
      router.navigate('/mp/fiche-marche', { idOperation });
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
