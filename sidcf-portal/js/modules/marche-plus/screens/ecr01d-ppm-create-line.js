/* ============================================
   ECR01D - Créer Ligne PPM (Marché+)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { operationId } from '../../../lib/uid.js';
import logger from '../../../lib/logger.js';
import { renderLivrableManagerMP } from '../../../ui/widgets/livrable-manager-mp.js';
import { renderSearchableSelect } from '../../../ui/widgets/searchable-select.js';
import { renderBudgetLineHistory } from '../../../ui/widgets/budget-line-history-mp.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

function getSelectLabel(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return '';
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption?.textContent || '';
}

// Build a flat index: each entry = { activité } + UA + Programme + Section.
// Drives the reverse cascade (pick activité → fills UA/Programme/Section).
// _DEFAULT mappings are excluded — they'd be ambiguous (same activité in many UAs).
function buildActiviteIndex(uaActivitesConfig, sections) {
  const index = [];
  for (const section of sections || []) {
    for (const programme of section.programmes || []) {
      for (const ua of programme.unites || []) {
        const acts = uaActivitesConfig[ua.code];
        if (!Array.isArray(acts)) continue;
        for (const act of acts) {
          index.push({
            code: act.code,
            libelle: act.libelle,
            categorie: act.categorie,
            uaCode: ua.code,
            uaLabel: ua.label,
            programmeCode: programme.code,
            programmeLabel: programme.label,
            sectionCode: section.code,
            sectionLabel: section.label
          });
        }
      }
    }
  }
  return index;
}

export async function renderPPMCreateLine(params) {
  const registries = dataService.getAllRegistries();
  const currentYear = new Date().getFullYear();

  let uaActivitesConfig = {};
  try {
    const response = await fetch('/js/config/ua-activites.json');
    uaActivitesConfig = await response.json();
  } catch (err) {
    logger.warn('[PPM Create] Could not load UA-Activités config', err);
  }

  const activiteIndex = buildActiviteIndex(uaActivitesConfig, registries.CHAINE_BUDGETAIRE?.sections);
  if (activiteIndex.length === 0) {
    logger.warn('[PPM Create] activiteIndex is empty — aucune UA n\'a de mapping explicite dans ua-activites.json');
  }

  // Snapshots utilisés par l'indicateur de disponibilité budgétaire (modif #3)
  let mpBudgetLines = [];
  let mpOperations = [];
  try {
    [mpBudgetLines, mpOperations] = await Promise.all([
      dataService.query(ENTITIES.MP_BUDGET_LINE),
      dataService.query(ENTITIES.MP_OPERATION)
    ]);
    mpBudgetLines = mpBudgetLines || [];
    mpOperations = mpOperations || [];
  } catch (err) {
    logger.warn('[PPM Create] Failed to load budget lines / operations for indicator', err);
  }

  let livrablesList = [];
  let activiteWidget = null;

  async function handleSave(createAnother) {
    // Modif #52 — Un seul montant prévisionnel + N bailleurs (sans montant unitaire).
    // Le partage par bailleur se précisera dans la clé de répartition.
    const montantTotal = Number(document.getElementById('montant-previsionnel')?.value) || 0;
    const bailleurEntries = Array.from(document.querySelectorAll('.financement-bailleur'))
      .map(sel => {
        const val = (sel.value || '').trim();
        if (!val) return null;
        const [typeFinancement, bailleur] = val.split('|');
        return typeFinancement && bailleur ? { typeFinancement, bailleur } : null;
      })
      .filter(Boolean);

    // Dédoublonnage (un même bailleur ne doit pas être listé 2 fois)
    const seen = new Set();
    const dedupedBailleurs = bailleurEntries.filter(b => {
      const key = `${b.typeFinancement}|${b.bailleur}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Rétrocompat : on alimente `financements[]` avec montant = 0 (le partage se fera
    // en clé de répartition). Les écrans qui lisent `financements[].montant` continuent
    // de fonctionner mais retournent 0 pour les opérations créées sous ce nouveau mode.
    const financements = dedupedBailleurs.map(b => ({
      montant: 0,
      typeFinancement: b.typeFinancement,
      bailleur: b.bailleur
    }));
    const bailleurs = dedupedBailleurs.map(b => b.bailleur);

    const activiteCode = document.getElementById('activite')?.value || '';
    const natureEcoCode = document.getElementById('natureEco')?.value || '';
    const ligneBudgetaire = activiteCode && natureEcoCode ? `${activiteCode}${natureEcoCode}` : '';

    const formData = {
      exercice: Number(document.getElementById('exercice')?.value),
      unite: getSelectLabel('unite') || '',
      uniteCode: document.getElementById('unite')?.value || '',
      objet: document.getElementById('objet')?.value?.trim(),

      typeMarche: document.getElementById('typeMarche')?.value,
      modePassation: document.getElementById('modePassation')?.value,
      revue: document.getElementById('revue')?.value || null,
      naturePrix: document.getElementById('naturePrix')?.value,

      montantPrevisionnel: montantTotal,
      montantActuel: montantTotal,
      typeFinancement: financements[0]?.typeFinancement || '', // legacy
      sourceFinancement: financements[0]?.bailleur || '',      // legacy

      chaineBudgetaire: {
        section: getSelectLabel('section') || '',
        sectionCode: document.getElementById('section')?.value || '',
        programme: getSelectLabel('programme') || '',
        programmeCode: document.getElementById('programme')?.value || '',
        activite: document.getElementById('activite')?.dataset?.label || '',
        activiteCode,
        nature: getSelectLabel('natureEco') || '',
        natureCode: natureEcoCode,
        ligneBudgetaire,
        bailleur: financements[0]?.bailleur || '', // legacy
        bailleurs,
        financements
      },

      delaiExecution: Number(document.getElementById('delaiExecution')?.value) || 0,
      dureePrevisionnelle: Number(document.getElementById('delaiExecution')?.value) || 0,
      categoriePrestation: document.getElementById('categoriePrestation')?.value || '',
      beneficiaire: document.getElementById('beneficiaire')?.value?.trim() || '',
      livrables: livrablesList,

      localisation: {
        region: getSelectLabel('region') || '',
        regionCode: document.getElementById('region')?.value || '',
        departement: getSelectLabel('departement') || '',
        departementCode: document.getElementById('departement')?.value || '',
        sousPrefecture: getSelectLabel('sousPrefecture') || '',
        sousPrefectureCode: document.getElementById('sousPrefecture')?.value || '',
        localite: document.getElementById('localite')?.value || '',
        longitude: document.getElementById('longitude')?.value ? Number(document.getElementById('longitude')?.value) : null,
        latitude: document.getElementById('latitude')?.value ? Number(document.getElementById('latitude')?.value) : null,
        coordsOK: !!(document.getElementById('longitude')?.value && document.getElementById('latitude')?.value)
      }
    };

    if (!formData.objet || !formData.uniteCode || !formData.typeMarche || !formData.modePassation) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!activiteCode) {
      alert('⚠️ Veuillez sélectionner une Activité (chaîne programmatique)');
      return;
    }
    if (!natureEcoCode) {
      alert('⚠️ Veuillez sélectionner la Nature économique');
      return;
    }
    if (montantTotal <= 0) {
      alert('⚠️ Le montant prévisionnel doit être supérieur à 0');
      return;
    }
    if (dedupedBailleurs.length === 0) {
      alert('⚠️ Veuillez déclarer au moins un bailleur pour l\'opération');
      return;
    }

    // Modif #53 — Évaluation conformité du mode de passation aux règles
    // (matrice ADMIN_CENTRALE). Si écart : flag procDerogation pré-positionné,
    // que l'étape Procédure (ecr02a) consommera pour exiger le justificatif.
    const modeSuggestionCtx = computeModeSuggestion(mpBudgetLines);
    const isDerogationPPM = modeSuggestionCtx.ready
      && modeSuggestionCtx.suggestion
      && !modeSuggestionCtx.applicableCodes.includes(formData.modePassation);
    const procDerogation = isDerogationPPM
      ? {
          isDerogation: true,
          docId: null,
          comment: `Dérogation déclarée à la planification : mode ${formData.modePassation} retenu au lieu du mode recommandé ${modeSuggestionCtx.suggestion.mode} (tranche ${modeSuggestionCtx.suggestion.min ?? 0}–${modeSuggestionCtx.suggestion.max ?? '∞'} XOF, matrice ADMIN_CENTRALE). À justifier à l'étape Procédure.`,
          validatedAt: null,
          sourceEtape: 'PLANIF'
        }
      : null;

    const newOperationId = operationId();
    const operation = {
      id: newOperationId,
      planId: null,
      budgetLineId: null,
      ...formData,
      devise: 'XOF',
      timeline: ['PLANIF'],
      etat: 'PLANIFIE',
      procDerogation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await dataService.add(ENTITIES.MP_OPERATION, operation);

    if (!result.success) {
      alert('❌ Erreur lors de la création de l\'opération');
      logger.error('[PPM Create Line] Failed to create operation', result.error);
      return;
    }

    if (createAnother) {
      alert('✅ Opération créée avec succès');
      document.getElementById('form-ppm-line')?.reset();
      document.getElementById('exercice').value = new Date().getFullYear();
      activiteWidget?.reset();
      ['unite', 'programme', 'section'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.innerHTML = '<option value="">-- Auto (selon activité) --</option>';
      });
      const ligne = document.getElementById('ligneBudgetaire');
      if (ligne) ligne.value = '';
      const financementsList = document.getElementById('financements-list');
      if (financementsList && financementsList.__reset) financementsList.__reset();
      // Refresh ops snapshot so the indicator reflects the just-saved op
      try {
        mpOperations = await dataService.query(ENTITIES.MP_OPERATION) || [];
        if (financementsList && financementsList.__refresh) financementsList.__refresh();
      } catch (_) { /* noop */ }
    } else {
      alert('✅ Opération créée avec succès');
      router.navigate('/mp/fiche-marche', { idOperation: newOperationId });
    }
  }

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour liste PPM', () => router.navigate('/mp/ppm-list')),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, '➕ Créer une nouvelle ligne PPM'),
      el('p', { className: 'page-subtitle' }, 'Saisie manuelle d\'une opération au Plan de Passation des Marchés')
    ]),

    el('form', { id: 'form-ppm-line', onsubmit: (e) => e.preventDefault() }, [

      // ---- Identification : Activité = 1ʳᵉ saisie, déclenche les auto-sélections ----
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📋 Identification')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [

            // Exercice (info fixe et globale, lecture seule)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Exercice'),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'exercice',
                value: currentYear,
                readonly: 'readonly',
                style: { background: '#f3f4f6', cursor: 'not-allowed' }
              })
            ]),

            // Activité (chaîne programmatique) — combobox filtrable, full width
            el('div', { className: 'form-field', style: { gridColumn: '1 / -1' } }, [
              el('label', { className: 'form-label' }, ['Activité (chaîne programmatique)', el('span', { className: 'required' }, '*')]),
              el('div', { id: 'activite-search-container' })
            ]),

            // UA, Programme, Section : auto-remplis depuis Activité
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Unité Administrative (UA)'),
              el('select', { className: 'form-input', id: 'unite', disabled: 'disabled' }, [
                el('option', { value: '' }, '-- Auto (selon activité) --')
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Programme'),
              el('select', { className: 'form-input', id: 'programme', disabled: 'disabled' }, [
                el('option', { value: '' }, '-- Auto (selon activité) --')
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Section (Ministère)'),
              el('select', { className: 'form-input', id: 'section', disabled: 'disabled' }, [
                el('option', { value: '' }, '-- Auto (selon activité) --')
              ])
            ]),

            // Nature économique (sélection explicite)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Nature économique', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'natureEco', required: true },
                [el('option', { value: '' }, '-- Sélectionner --')]
                  .concat((registries.NATURE_ECO || []).map(n =>
                    el('option', { value: n.code, 'data-label': n.label }, n.label)
                  ))
              )
            ]),

            // Ligne budgétaire calculée (activité + nature éco)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Imputation budgétaire (calculée)'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'ligneBudgetaire',
                readonly: 'readonly',
                placeholder: '— activité + nature économique —',
                style: { background: '#f3f4f6', cursor: 'not-allowed' }
              })
            ]),

            // Objet du marché (full width)
            el('div', { className: 'form-field', style: { gridColumn: '1 / -1' } }, [
              el('label', { className: 'form-label' }, ['Objet du marché', el('span', { className: 'required' }, '*')]),
              el('textarea', {
                className: 'form-input',
                id: 'objet',
                rows: 3,
                placeholder: 'Description détaillée de l\'objet du marché...',
                required: true
              })
            ])
          ])
        ])
      ]),

      // ---- Classification du marché ----
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '🏷️ Classification du marché')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Type de marché', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'typeMarche', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_MARCHE || []).map(t => el('option', { value: t.code }, t.label))
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Mode de passation', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'modePassation', required: true }, [
                el('option', { value: '' }, '-- Auto (selon le montant et le type) --'),
                ...(registries.MODE_PASSATION || []).map(m => el('option', { value: m.code }, m.label))
              ]),
              // Modif #53 — Encart de motivation / dérogation (mis à jour dynamiquement)
              el('div', {
                id: 'mode-passation-rec',
                style: {
                  marginTop: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  background: '#f9fafb',
                  border: '1px dashed #d1d5db',
                  color: '#6b7280'
                }
              }, 'Renseignez Type de marché, Nature économique et Montant prévisionnel pour voir le mode recommandé.')
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Revue'),
              el('select', { className: 'form-input', id: 'revue' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_REVUE || []).map(r => el('option', { value: r.code }, r.label))
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Nature des prix', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'naturePrix', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.NATURE_PRIX || []).map(n => el('option', { value: n.code }, n.label))
              ])
            ])
          ])
        ])
      ]),

      // ---- Informations financières — Modif #52 ----
      // Un seul montant prévisionnel pour l'opération + N bailleurs (sans montant unitaire).
      // Les bailleurs proposés sont strictement ceux ouverts sur l'activité indexée
      // (MP_BUDGET_LINE.activiteCode = activité courante). Le partage entre bailleurs
      // se précisera plus tard dans la clé de répartition (où ils seront priorisés).
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '💰 Informations financières'),
          el('p', { style: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' } },
            'Un seul montant prévisionnel pour l\'opération. Les bailleurs sont déclarés en dessous (parmi ceux ouverts sur l\'activité). Le partage par bailleur se précisera dans la clé de répartition.')
        ]),
        el('div', { className: 'card-body' }, [
          // Bloc montant unique
          el('div', { style: { marginBottom: '18px' } }, [
            el('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: '12px', alignItems: 'end' } }, [
              el('div', { className: 'form-field' }, [
                el('label', { className: 'form-label' }, [
                  'Montant prévisionnel (XOF)',
                  el('span', { className: 'required' }, ' *')
                ]),
                el('input', {
                  type: 'number',
                  className: 'form-input',
                  id: 'montant-previsionnel',
                  min: '0',
                  step: '1',
                  placeholder: '0',
                  required: true
                })
              ]),
              el('div', { id: 'montant-dispo-indicator', style: { fontSize: '13px', minHeight: '40px' } })
            ])
          ]),

          // Bloc bailleurs (liste sans montant)
          el('div', {}, [
            el('div', { style: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' } }, '🏦 Bailleurs de l\'opération'),
            el('p', { style: { margin: '0 0 8px', fontSize: '12px', color: '#6b7280' } },
              'Sélectionner les bailleurs qui participeront au financement. La liste est restreinte à ceux ouverts sur l\'activité indexée.'),
            el('div', { id: 'financements-list' }),
            el('button', {
              type: 'button',
              className: 'btn btn-sm btn-accent',
              id: 'add-financement-btn',
              style: { marginTop: '8px' }
            }, '+ Ajouter un bailleur')
          ]),

          el('div', {
            id: 'financements-total',
            style: {
              marginTop: '14px', padding: '10px 14px', background: '#f9fafb',
              borderRadius: '6px', fontSize: '14px', borderLeft: '4px solid #6b7280'
            }
          })
        ])
      ]),

      // ---- Informations techniques ----
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '⚙️ Informations techniques')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Délai d\'exécution (jours)'),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'delaiExecution',
                min: 0,
                placeholder: '30'
              })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Catégorie de prestation'),
              el('select', { className: 'form-input', id: 'categoriePrestation' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.CATEGORIE_PRESTATION || []).map(c => el('option', { value: c.code }, c.label))
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Bénéficiaire'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'beneficiaire',
                placeholder: 'Nom du bénéficiaire'
              })
            ])
          ])
        ])
      ]),

      // ---- Livrables ----
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📦 Livrables')
        ]),
        el('div', { className: 'card-body', id: 'livrables-container' })
      ]),

      // ---- Localisation géographique (cascade région→dpt→SP→localité, inchangée) ----
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📍 Localisation géographique')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Région'),
              el('select', { className: 'form-input', id: 'region' }, [
                el('option', { value: '' }, '-- Sélectionner une région --'),
                ...(registries.LOCALITE_CI?.regions || []).map(r => el('option', { value: r.code, 'data-label': r.label }, r.label))
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Département'),
              el('select', { className: 'form-input', id: 'departement', disabled: true }, [
                el('option', { value: '' }, '-- Sélectionner une région d\'abord --')
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Sous-préfecture'),
              el('select', { className: 'form-input', id: 'sousPrefecture', disabled: true }, [
                el('option', { value: '' }, '-- Sélectionner un département d\'abord --')
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Localité'),
              el('select', { className: 'form-input', id: 'localite', disabled: true }, [
                el('option', { value: '' }, '-- Sélectionner une sous-préfecture d\'abord --')
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Longitude'),
              el('input', { type: 'number', className: 'form-input', id: 'longitude', step: '0.000001', placeholder: 'Ex: -4.02290' })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Latitude'),
              el('input', { type: 'number', className: 'form-input', id: 'latitude', step: '0.000001', placeholder: 'Ex: 5.33255' })
            ])
          ])
        ])
      ]),

      // ---- Actions ----
      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'space-between' } }, [
            createButton('btn btn-secondary', 'Annuler', () => router.navigate('/mp/ppm-list')),
            el('div', { style: { display: 'flex', gap: '12px' } }, [
              createButton('btn btn-accent', 'Enregistrer et créer nouveau', () => handleSave(true)),
              createButton('btn btn-primary', '✓ Enregistrer', () => handleSave(false))
            ])
          ])
        ])
      ])
    ])
  ]);

  mount('#app', page);

  // Init searchable activité combobox (must precede the cascade setup, since
  // the cascade listens to the hidden #activite input that the widget creates)
  const activiteContainer = document.getElementById('activite-search-container');
  if (activiteContainer) {
    activiteWidget = renderSearchableSelect(activiteContainer, {
      id: 'activite',
      placeholder: 'Rechercher par libellé d\'activité, UA, programme ou code…',
      required: true,
      options: activiteIndex.map(a => ({
        value: a.code,
        label: a.libelle,
        secondary: `UA ${a.uaCode} — ${a.uaLabel} · ${a.programmeLabel}`,
        group: a.sectionLabel
      }))
    });
  }

  setupActiviteReverseCascade(activiteIndex);
  setupNatureEcoLigneBudgetaire();
  setupFinancementsMulti(registries, mpBudgetLines, mpOperations);
  // Modif #53c — Suggestion auto du mode de passation basée sur le MONTANT DE LA
  // LIGNE BUDGÉTAIRE (somme des AE des MP_BUDGET_LINE pour activité + nature),
  // pas sur le montant prévisionnel de l'opération.
  setupModePassationSuggestion(registries, mpBudgetLines);
  setupLocalisationCascades(registries);

  const livrablesContainer = document.getElementById('livrables-container');
  if (livrablesContainer) {
    const livrableWidget = renderLivrableManagerMP(livrablesList, registries, (updatedList) => {
      livrablesList = updatedList;
    });
    livrablesContainer.appendChild(livrableWidget);
  }
}

/* ----------------------------------------------------------------------- */
/* Reverse cascade : Activité → UA, Programme, Section (auto-rempli)        */
/* ----------------------------------------------------------------------- */
function setupActiviteReverseCascade(activiteIndex) {
  const activiteSelect = document.getElementById('activite');
  const uniteSelect = document.getElementById('unite');
  const programmeSelect = document.getElementById('programme');
  const sectionSelect = document.getElementById('section');
  if (!activiteSelect || !uniteSelect || !programmeSelect || !sectionSelect) return;

  const resetTo = (select, placeholder) => {
    select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    select.appendChild(opt);
  };

  const fillSingle = (select, code, label) => {
    select.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = label;
    select.appendChild(opt);
    select.value = code;
  };

  activiteSelect.addEventListener('change', (e) => {
    const code = e.target.value;
    if (!code) {
      resetTo(uniteSelect, '-- Auto (selon activité) --');
      resetTo(programmeSelect, '-- Auto (selon activité) --');
      resetTo(sectionSelect, '-- Auto (selon activité) --');
      computeLigneBudgetaire();
      return;
    }
    const entry = activiteIndex.find(a => a.code === code);
    if (!entry) {
      logger.warn('[PPM Create] Activité sans entrée dans activiteIndex :', code);
      return;
    }
    fillSingle(uniteSelect, entry.uaCode, entry.uaLabel);
    fillSingle(programmeSelect, entry.programmeCode, entry.programmeLabel);
    fillSingle(sectionSelect, entry.sectionCode, entry.sectionLabel);
    computeLigneBudgetaire();
  });
}

function computeLigneBudgetaire() {
  const actCode = document.getElementById('activite')?.value || '';
  const natCode = document.getElementById('natureEco')?.value || '';
  const input = document.getElementById('ligneBudgetaire');
  if (!input) return;
  input.value = actCode && natCode ? `${actCode}${natCode}` : '';
}

function setupNatureEcoLigneBudgetaire() {
  const natureEcoSelect = document.getElementById('natureEco');
  if (!natureEcoSelect) return;
  natureEcoSelect.addEventListener('change', computeLigneBudgetaire);
}

/* ----------------------------------------------------------------------- */
/* Lignes de financement multi (Montant + Type + Bailleur) + indicateur    */
/* de disponibilité budgétaire (Initial / Programmé / Disponible après).   */
/* ----------------------------------------------------------------------- */
function findBudgetLine(activiteCode, typeFinancement, bailleur, mpBudgetLines) {
  if (!activiteCode || !typeFinancement || !bailleur) return null;
  return (mpBudgetLines || []).find(b =>
    (b.activiteCode || '') === activiteCode &&
    (b.typeFinancement || '') === typeFinancement &&
    (b.sourceFinancement || '') === bailleur
  ) || null;
}

function computeBudgetUsageOther(activiteCode, typeFinancement, bailleur, mpOperations, excludeOperationId = null) {
  let used = 0;
  for (const op of (mpOperations || [])) {
    if (excludeOperationId && op.id === excludeOperationId) continue;
    const opActivite = op?.chaineBudgetaire?.activiteCode || '';
    if (opActivite !== activiteCode) continue;

    if (Array.isArray(op?.chaineBudgetaire?.financements) && op.chaineBudgetaire.financements.length > 0) {
      for (const f of op.chaineBudgetaire.financements) {
        if ((f.typeFinancement || '') === typeFinancement && (f.bailleur || '') === bailleur) {
          used += Number(f.montant) || 0;
        }
      }
    } else {
      // legacy : 1 seul financement par opération
      if ((op.typeFinancement || '') === typeFinancement && (op.sourceFinancement || '') === bailleur) {
        used += Number(op.montantPrevisionnel) || 0;
      }
    }
  }
  return used;
}

function formatXOF(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('fr-FR').format(v) + ' XOF';
}

// Modif #52 — Refonte : 1 montant unique pour l'opération + N bailleurs (sans montant unitaire).
// Les bailleurs proposés viennent des MP_BUDGET_LINE filtrées par activité indexée.
function setupFinancementsMulti(registries, mpBudgetLines, mpOperations) {
  const list = document.getElementById('financements-list');
  const addBtn = document.getElementById('add-financement-btn');
  const totalDiv = document.getElementById('financements-total');
  const montantInput = document.getElementById('montant-previsionnel');
  const dispoIndicator = document.getElementById('montant-dispo-indicator');
  if (!list || !addBtn || !montantInput) return;

  /**
   * Retourne les tuples {typeFinancement, bailleur} ouverts sur l'activité courante
   * — c.-à-d. les MP_BUDGET_LINE existant avec cette activité.
   */
  const getOptionsForActivite = (activiteCode) => {
    if (!activiteCode) return [];
    const seen = new Set();
    const opts = [];
    for (const b of (mpBudgetLines || [])) {
      if ((b.activiteCode || '') !== activiteCode) continue;
      const key = `${b.typeFinancement || ''}|${b.sourceFinancement || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      opts.push({
        typeFinancement: b.typeFinancement || '',
        bailleur: b.sourceFinancement || '',
        ae: Number(b.ae) || 0
      });
    }
    return opts;
  };

  /**
   * Peuple un select de bailleur avec uniquement ceux ouverts sur l'activité courante.
   * Si activité non renseignée : un seul placeholder « -- Choisir l'activité d'abord -- ».
   */
  const populateBailleurSelect = (bailleurSelect) => {
    const previous = bailleurSelect.value;
    const activiteCode = document.getElementById('activite')?.value || '';
    const opts = getOptionsForActivite(activiteCode);
    const bailleursLabels = registries.BAILLEUR || [];
    const typesLabels = registries.TYPE_FINANCEMENT || [];

    bailleurSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    if (!activiteCode) {
      placeholder.textContent = '-- Choisir l\'activité d\'abord --';
    } else if (opts.length === 0) {
      placeholder.textContent = '-- Aucun bailleur ouvert sur cette activité --';
    } else {
      placeholder.textContent = '-- Sélectionner un bailleur --';
    }
    bailleurSelect.appendChild(placeholder);

    opts.forEach(o => {
      const bLabel = bailleursLabels.find(b => b.code === o.bailleur)?.label || o.bailleur;
      const tLabel = typesLabels.find(t => t.code === o.typeFinancement)?.label || o.typeFinancement;
      const option = document.createElement('option');
      option.value = `${o.typeFinancement}|${o.bailleur}`;
      option.dataset.type = o.typeFinancement;
      option.dataset.bailleur = o.bailleur;
      option.textContent = `${bLabel} — ${tLabel}`;
      bailleurSelect.appendChild(option);
    });

    if (previous && Array.from(bailleurSelect.options).some(o => o.value === previous)) {
      bailleurSelect.value = previous;
    }
  };

  const buildRow = (isFirst) => {
    const row = document.createElement('div');
    row.className = 'financement-row';
    Object.assign(row.style, {
      border: '1px solid #e5e7eb', borderRadius: '8px',
      padding: '10px', marginBottom: '8px', background: 'white',
      display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center'
    });

    const bailleurSelect = document.createElement('select');
    bailleurSelect.className = 'form-input financement-bailleur';
    if (isFirst) bailleurSelect.required = true;
    populateBailleurSelect(bailleurSelect);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-secondary';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Retirer ce bailleur';
    Object.assign(removeBtn.style, { padding: '6px 12px' });
    removeBtn.addEventListener('click', () => {
      if (list.querySelectorAll('.financement-row').length > 1) {
        row.remove();
        refreshAll();
      }
    });

    row.appendChild(bailleurSelect);
    row.appendChild(removeBtn);

    bailleurSelect.addEventListener('change', refreshAll);
    return row;
  };

  /**
   * Lit les bailleurs déclarés sur les lignes courantes.
   * @returns {Array<{typeFinancement, bailleur, ae}>}
   */
  const readDeclaredBailleurs = () => {
    const activiteCode = document.getElementById('activite')?.value || '';
    const opts = getOptionsForActivite(activiteCode);
    const declared = [];
    const seen = new Set();
    list.querySelectorAll('.financement-bailleur').forEach(sel => {
      const val = sel.value || '';
      if (!val) return;
      const [type, bailleur] = val.split('|');
      const key = `${type}|${bailleur}`;
      if (seen.has(key)) return;
      seen.add(key);
      const match = opts.find(o => o.typeFinancement === type && o.bailleur === bailleur);
      declared.push({
        typeFinancement: type,
        bailleur,
        ae: match?.ae || 0
      });
    });
    return declared;
  };

  /**
   * Recalcule l'indicateur de disponibilité budgétaire global et le bandeau total.
   * Affiché en haut, sous l'input montant prévisionnel.
   */
  const refreshAll = () => {
    const activiteCode = document.getElementById('activite')?.value || '';
    const montant = Number(montantInput.value) || 0;
    const declared = readDeclaredBailleurs();

    // Indicateur sous le montant : couverture des enveloppes vs montant saisi
    if (dispoIndicator) {
      if (!activiteCode) {
        dispoIndicator.innerHTML = '<span style="color:#6b7280;">Sélectionnez l\'activité dans la section Identification pour voir la disponibilité budgétaire.</span>';
      } else if (declared.length === 0) {
        dispoIndicator.innerHTML = '<span style="color:#92400e;">Ajoutez au moins un bailleur ci-dessous pour évaluer la couverture.</span>';
      } else {
        // Somme des enveloppes AE des bailleurs déclarés
        const totalEnveloppes = declared.reduce((s, d) => s + (d.ae || 0), 0);
        // Cumul des autres opérations PPM sur la même activité (toutes combinaisons)
        const usedOnActivite = (mpOperations || []).reduce((acc, op) => {
          const opActivite = op?.chaineBudgetaire?.activiteCode || '';
          if (opActivite !== activiteCode) return acc;
          return acc + (Number(op.montantPrevisionnel) || 0);
        }, 0);
        const restant = totalEnveloppes - usedOnActivite - montant;
        const ok = restant >= 0;
        const color = ok ? '#065f46' : '#b91c1c';
        const bg = ok ? '#ecfdf5' : '#fef2f2';
        dispoIndicator.innerHTML = `
          <div style="padding:8px 12px; background:${bg}; border-left:3px solid ${color}; border-radius:4px;">
            <div style="color:${color}; font-weight:600;">
              ${ok ? '✓ Couverture OK' : '⚠ Couverture insuffisante'}
            </div>
            <div style="color:#374151; font-size:12px; margin-top:2px;">
              Enveloppes cumulées (${declared.length} bailleur${declared.length > 1 ? 's' : ''}) : ${formatXOF(totalEnveloppes)}
              · Autres opérations sur l'activité : ${formatXOF(usedOnActivite)}
              · Disponible après celle-ci : <strong>${formatXOF(restant)}</strong>
            </div>
          </div>
        `;
      }
    }

    if (totalDiv) {
      totalDiv.innerHTML =
        `<strong>Montant prévisionnel de l'opération :</strong> ` +
        `<span style="font-size:1.05em; font-weight:700;">${formatXOF(montant)}</span>` +
        ` <span style="margin-left:12px; color:#6b7280; font-size:12px;">` +
        `Bailleurs déclarés : ${declared.length}` +
        `</span>`;
      totalDiv.style.borderLeftColor = '#6b7280';
      totalDiv.style.background = '#f9fafb';
    }
  };

  // Recalcule + repopule les selects bailleurs (à appeler quand l'activité change)
  const repopulateAllBailleurSelects = () => {
    list.querySelectorAll('.financement-bailleur').forEach(sel => populateBailleurSelect(sel));
    refreshAll();
  };

  list.__reset = () => {
    list.innerHTML = '';
    list.appendChild(buildRow(true));
    if (montantInput) montantInput.value = '';
    refreshAll();
  };
  list.__refresh = refreshAll;
  list.__repopulateBailleurs = repopulateAllBailleurSelects;

  list.appendChild(buildRow(true));
  addBtn.addEventListener('click', () => {
    list.appendChild(buildRow(false));
    refreshAll();
  });

  // L'indicateur et les options dépendent de l'activité — on rafraîchit quand elle change.
  const activiteHidden = document.getElementById('activite');
  if (activiteHidden) activiteHidden.addEventListener('change', repopulateAllBailleurSelects);
  if (montantInput) montantInput.addEventListener('input', refreshAll);

  refreshAll();
}

/* ----------------------------------------------------------------------- */
/* Localisation cascade (région→département→sous-préf→localité)            */
/* ----------------------------------------------------------------------- */
function setupLocalisationCascades(registries) {
  const regionSelect = document.getElementById('region');
  const deptSelect = document.getElementById('departement');
  const spSelect = document.getElementById('sousPrefecture');
  const localiteSelect = document.getElementById('localite');
  if (!regionSelect || !deptSelect || !spSelect || !localiteSelect) return;

  regionSelect.addEventListener('change', (e) => {
    const regionCode = e.target.value;
    deptSelect.innerHTML = '<option value="">-- Sélectionner un département --</option>';
    deptSelect.disabled = !regionCode;
    spSelect.innerHTML = '<option value="">-- Sélectionner un département d\'abord --</option>';
    spSelect.disabled = true;
    localiteSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture d\'abord --</option>';
    localiteSelect.disabled = true;
    if (!regionCode) return;
    const region = registries.LOCALITE_CI?.regions?.find(r => r.code === regionCode);
    if (region?.departements) {
      region.departements.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.code;
        option.textContent = dept.label;
        option.dataset.label = dept.label;
        deptSelect.appendChild(option);
      });
      deptSelect.disabled = false;
    }
  });

  deptSelect.addEventListener('change', (e) => {
    const regionCode = regionSelect.value;
    const deptCode = e.target.value;
    spSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture --</option>';
    spSelect.disabled = !deptCode;
    localiteSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture d\'abord --</option>';
    localiteSelect.disabled = true;
    if (!deptCode) return;
    const region = registries.LOCALITE_CI?.regions?.find(r => r.code === regionCode);
    const dept = region?.departements?.find(d => d.code === deptCode);
    if (dept?.sousPrefectures) {
      dept.sousPrefectures.forEach(sp => {
        const option = document.createElement('option');
        option.value = sp.code;
        option.textContent = sp.label;
        option.dataset.label = sp.label;
        spSelect.appendChild(option);
      });
      spSelect.disabled = false;
    }
  });

  spSelect.addEventListener('change', (e) => {
    const regionCode = regionSelect.value;
    const deptCode = deptSelect.value;
    const spCode = e.target.value;
    localiteSelect.innerHTML = '<option value="">-- Sélectionner une localité --</option>';
    localiteSelect.disabled = !spCode;
    if (!spCode) return;
    const region = registries.LOCALITE_CI?.regions?.find(r => r.code === regionCode);
    const dept = region?.departements?.find(d => d.code === deptCode);
    const sp = dept?.sousPrefectures?.find(s => s.code === spCode);
    if (sp?.localites && Array.isArray(sp.localites)) {
      sp.localites.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        localiteSelect.appendChild(option);
      });
      localiteSelect.disabled = false;
    }
  });
}

/* ----------------------------------------------------------------------- */
/* Modif #53 — Suggestion automatique du Mode de Passation                 */
/*                                                                         */
/* À partir du montant prévisionnel, du type de marché et de la nature     */
/* économique, on calcule le mode de passation conforme aux seuils du     */
/* Code des Marchés Publics CI (matrice ADMIN_CENTRALE par défaut).        */
/*                                                                         */
/* Comportement :                                                          */
/*   - Auto-pré-sélection du mode recommandé tant que l'utilisateur n'a    */
/*     pas modifié manuellement le dropdown (flag _userTouched).           */
/*   - Encart informatif sous le dropdown avec la motivation (montant +    */
/*     type + seuil + matrice institution).                                */
/*   - Si l'utilisateur choisit autre chose : alerte « dérogation requise »*/
/*     et persistance dans operation.procDerogation à la sauvegarde.       */
/* ----------------------------------------------------------------------- */

/**
 * Calcule le montant total de la « ligne budgétaire » = somme des AE de toutes
 * les MP_BUDGET_LINE matchant l'activiteCode courant (toutes natures confondues).
 *
 * Note : le modèle MP_BUDGET_LINE actuel ne stocke pas le natureCode (le champ
 * ligne_code de la migration 015 contient « ACT_XXX-ETAT » et non un code
 * NATURE_ECO comme « 231 »). Le matching se fait donc sur l'activité seule, ce
 * qui correspond au plafond budgétaire de l'activité tous bailleurs confondus.
 * Le natureCode reste utile en aval pour filtrer les seuils applicables (PSD
 * autorise nature 22X/232/233 mais pas 231, etc.).
 *
 * C'est CE montant qui pilote la recommandation de mode de passation selon le
 * Code des MP CI, pas le montant prévisionnel de l'opération.
 */
function computeLigneBudgetaireAmount(mpBudgetLines, activiteCode) {
  if (!activiteCode) return { total: 0, lines: [] };
  const matches = (mpBudgetLines || []).filter(b => (b.activiteCode || '') === activiteCode);
  // Compat données : certains imports utilisent `ae` (minuscule) au lieu de `AE`
  const total = matches.reduce((s, b) => s + (Number(b.AE) || Number(b.ae) || 0), 0);
  return { total, lines: matches };
}

/**
 * Construit un payload de suggestion à partir du contexte courant lu dans le DOM.
 * Modif #53c — le montant utilisé pour la recommandation est désormais celui de
 * la LIGNE BUDGÉTAIRE (somme des AE), pas le montant prévisionnel de l'opération.
 *
 * @param {Array} mpBudgetLines Liste des MP_BUDGET_LINE chargées
 * @returns {Object} { ready, suggestion, applicableCodes, montantLigne, lignesCount, typeMarche, natureCode, selected }
 */
function computeModeSuggestion(mpBudgetLines) {
  const typeMarche = document.getElementById('typeMarche')?.value || '';
  const natureCode = document.getElementById('natureEco')?.value || '';
  const activiteCode = document.getElementById('activite')?.value || '';
  const selected = document.getElementById('modePassation')?.value || '';

  const { total: montantLigne, lines } = computeLigneBudgetaireAmount(mpBudgetLines, activiteCode);

  // Construire une « pseudo-opération » que getSuggestedProcedures() sait consommer.
  // On lui passe le MONTANT DE LA LIGNE, pas un montant d'opération.
  const pseudoOp = {
    typeMarche,
    montantPrevisionnel: montantLigne,
    chaineBudgetaire: { natureCode, nature: natureCode },
    typeInstitution: 'ADMIN_CENTRALE'
  };

  const ready = montantLigne > 0 && !!typeMarche && !!natureCode;
  if (!ready) {
    return {
      ready: false, suggestion: null, applicableCodes: [],
      selected, montantLigne, lignesCount: lines.length,
      typeMarche, natureCode, activiteCode
    };
  }

  let suggestions = [];
  try {
    suggestions = dataService.getSuggestedProcedures(pseudoOp) || [];
  } catch (err) {
    logger.warn('[ModeSuggestion] getSuggestedProcedures a échoué', err);
  }

  const applicableCodes = suggestions.map(s => s.mode);
  const suggestion = suggestions[0] || null;
  return {
    ready, suggestion, applicableCodes, selected,
    montantLigne, lignesCount: lines.length,
    typeMarche, natureCode, activiteCode
  };
}

/**
 * Calcule la liste des modes applicables à un couple (typeMarche, natureCode)
 * SANS contrainte de montant — lit directement la matrice ADMIN_CENTRALE du
 * fichier rules-config.json. Permet d'afficher le tableau des seuils dès que
 * Type + Nature sont renseignés (avant que le montant ne soit saisi).
 */
function listApplicableModesForTypeNature(typeMarche, natureCode) {
  const rules = dataService.getRulesConfig?.() || null;
  const matrice = rules?.matrices_procedures?.ADMIN_CENTRALE;
  if (!matrice) return [];
  return (matrice.seuils_montants || []).filter(seuil => {
    const natureOK =
      !natureCode ||
      seuil.natureEco.includes('all') ||
      seuil.natureEco.includes(natureCode) ||
      seuil.natureEco.some(code => code.startsWith(natureCode)) ||
      seuil.natureEco.some(code => natureCode.startsWith(code));
    const typeOK =
      !typeMarche ||
      seuil.typeMarche.includes('all') ||
      seuil.typeMarche.includes(typeMarche);
    return natureOK && typeOK;
  });
}

/**
 * Met à jour l'encart de recommandation. Réactivité progressive :
 *   - 0 critère renseigné        → message neutre « Renseignez… »
 *   - Type + Nature seulement    → tableau des tranches applicables (montant
 *                                  attendu pour préciser la recommandation)
 *   - Type + Nature + Montant    → recommandation précise + statut conformité
 *                                  vs mode sélectionné
 */
function refreshModePassationRec(registries, mpBudgetLines) {
  const box = document.getElementById('mode-passation-rec');
  const modeSelect = document.getElementById('modePassation');
  if (!box || !modeSelect) return;

  const ctx = computeModeSuggestion(mpBudgetLines);
  const modeLabels = registries.MODE_PASSATION || [];
  const typeLabels = registries.TYPE_MARCHE || [];
  const natureLabels = registries.NATURE_ECO || [];

  const formatXOFInline = (n) => new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' XOF';
  const labelFor = (list, code) => list.find(x => x.code === code)?.label || code || '—';

  const typeMarche = ctx.typeMarche;
  const natureCode = ctx.natureCode;
  const montantLigne = ctx.montantLigneLigne;
  const currentSelected = modeSelect.value;

  // Helper : rendu d'un tableau HTML des tranches (mode / tranche / description)
  const renderTranchesTable = (tranches, highlightMode = null, highlightAmount = null) => {
    if (!tranches.length) {
      return '<div style="margin-top:6px;">Aucune tranche standard pour cette combinaison.</div>';
    }
    const rows = tranches.map(t => {
      const tranche = `${t.min != null ? formatXOFInline(t.min) : '0'} – ${t.max != null ? formatXOFInline(t.max) : '∞'}`;
      const modeLib = labelFor(modeLabels, t.mode);
      const isHi = highlightMode && t.mode === highlightMode;
      const isInRange = highlightAmount > 0
        && (t.min == null || highlightAmount >= t.min)
        && (t.max == null || highlightAmount <= t.max);
      const bg = isHi ? '#dcfce7' : (isInRange ? '#ecfdf5' : 'transparent');
      const weight = isHi || isInRange ? '600' : '400';
      return `<tr style="background:${bg};">
        <td style="padding:3px 6px; font-weight:${weight}; font-family:monospace;">${t.mode}</td>
        <td style="padding:3px 6px;">${modeLib}</td>
        <td style="padding:3px 6px; text-align:right; white-space:nowrap;">${tranche}</td>
      </tr>`;
    }).join('');
    return `
      <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="border-bottom:1px solid #d1d5db;">
            <th style="padding:3px 6px; text-align:left;">Mode</th>
            <th style="padding:3px 6px; text-align:left;">Libellé</th>
            <th style="padding:3px 6px; text-align:right;">Tranche de montant</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };

  // ----- État 1 : rien ou presque rien de renseigné -----
  if (!typeMarche && !natureCode) {
    box.style.background = '#f9fafb';
    box.style.borderColor = '#d1d5db';
    box.style.color = '#6b7280';
    box.innerHTML = '<em>💡 Renseignez le Type de marché et la Nature économique pour voir les modes applicables selon le Code des Marchés Publics CI.</em>';
    return;
  }

  // ----- État 2 : Type + Nature OK mais la ligne budgétaire n'a pas de montant -----
  // (cas typique : l'activité n'est pas encore renseignée, ou la combinaison
  // activité + nature n'a aucune MP_BUDGET_LINE ouverte.)
  if (!ctx.ready) {
    const tranches = listApplicableModesForTypeNature(typeMarche, natureCode);

    // Feedback sur le mode déjà sélectionné (sans pouvoir vérifier la conformité)
    let modeFeedback = '';
    if (currentSelected) {
      const t = tranches.find(x => x.mode === currentSelected);
      if (t) {
        const tFmt = `${t.min != null ? formatXOFInline(t.min) : '0'} – ${t.max != null ? formatXOFInline(t.max) : '∞'}`;
        modeFeedback = `<div style="margin-top:6px; padding:6px 8px; background:rgba(16,185,129,0.08); border-left:3px solid #10b981;">
          <strong>Mode sélectionné :</strong> ${currentSelected} — ${labelFor(modeLabels, currentSelected)}<br>
          <span style="font-size:11px;">Applicable pour les marchés de la tranche <strong>${tFmt}</strong>. La conformité sera évaluée dès que le montant de la ligne budgétaire sera connu.</span>
        </div>`;
      } else {
        modeFeedback = `<div style="margin-top:6px; padding:6px 8px; background:rgba(220,38,38,0.08); border-left:3px solid #dc2626;">
          <strong>Mode sélectionné :</strong> ${currentSelected} — ${labelFor(modeLabels, currentSelected)}<br>
          <span style="font-size:11px;">⚠ Ce mode n'est <strong>pas listé</strong> dans les tranches standard pour ${labelFor(typeLabels, typeMarche)} / ${labelFor(natureLabels, natureCode)}. Une dérogation sera nécessairement requise.</span>
        </div>`;
      }
    }

    // Diagnostic : pourquoi le montant est-il à 0 ?
    let raisonMontant;
    if (!ctx.activiteCode) {
      raisonMontant = 'Renseignez l\'<strong>Activité</strong> ci-dessus pour calculer le montant de la ligne budgétaire.';
    } else if (ctx.lignesCount === 0) {
      raisonMontant = `Aucune ligne budgétaire ouverte pour l'activité <code>${ctx.activiteCode}</code>. Vérifiez la disponibilité budgétaire.`;
    } else {
      raisonMontant = `Les ${ctx.lignesCount} ligne(s) budgétaire(s) trouvée(s) ont un AE total à 0 XOF.`;
    }

    box.style.background = '#eff6ff';
    box.style.borderColor = '#3b82f6';
    box.style.color = '#1e3a8a';
    box.innerHTML = `
      <strong>📋 Modes applicables pour ${labelFor(typeLabels, typeMarche)} / ${labelFor(natureLabels, natureCode)}</strong>
      <div style="font-size:11px; margin-top:3px;">Selon les seuils du Code des Marchés Publics CI (matrice <em>ADMIN_CENTRALE</em>) :</div>
      ${renderTranchesTable(tranches, null, 0)}
      <div style="margin-top:6px; font-size:11px;">➡ <em>${raisonMontant}</em></div>
      ${modeFeedback}
    `;
    return;
  }

  // ----- État 3 : tout renseigné mais aucune suggestion (combinaison hors barème) -----
  if (!ctx.suggestion) {
    box.style.background = '#fef3c7';
    box.style.borderColor = '#f59e0b';
    box.style.color = '#92400e';
    box.innerHTML = `⚠ Aucun mode standard ne correspond à <strong>${labelFor(typeLabels, ctx.typeMarche)}</strong> / <strong>${labelFor(natureLabels, ctx.natureCode)}</strong> au montant <strong>${formatXOFInline(ctx.montantLigne)}</strong>. Une dérogation sera nécessairement requise quel que soit le mode choisi.`;
    return;
  }

  // ----- État 4 : recommandation précise -----
  const recommendedCode = ctx.suggestion.mode;
  const recommendedLabel = labelFor(modeLabels, recommendedCode);

  // Auto-pré-sélection initiale tant que l'utilisateur n'a pas touché le select
  if (!modeSelect.dataset.userTouched) {
    if (modeSelect.value !== recommendedCode) {
      modeSelect.value = recommendedCode;
    }
  }

  const stillSelected = modeSelect.value;
  const isConforme = ctx.applicableCodes.includes(stillSelected);
  const seuilMin = ctx.suggestion.min;
  const seuilMax = ctx.suggestion.max;
  const seuilFmt = `${seuilMin != null ? formatXOFInline(seuilMin) : '0'} – ${seuilMax != null ? formatXOFInline(seuilMax) : '∞'}`;
  const allTranches = listApplicableModesForTypeNature(typeMarche, natureCode);

  const motivation = `
    <strong>📌 Mode recommandé :</strong> <code style="background:rgba(0,0,0,0.06); padding:1px 4px; border-radius:3px;">${recommendedCode}</code> — ${recommendedLabel}<br>
    <span style="font-size:11px;">
      <strong>Pourquoi ?</strong>
      Montant de la <strong>ligne budgétaire</strong> <strong>${formatXOFInline(ctx.montantLigne)}</strong>
      (somme des AE de ${ctx.lignesCount} ligne${ctx.lignesCount > 1 ? 's' : ''} pour l'activité <code>${ctx.activiteCode}</code>, tous bailleurs confondus)
      · Type ${labelFor(typeLabels, ctx.typeMarche)}
      · Nature ${labelFor(natureLabels, ctx.natureCode)}
      ⇒ tranche ${seuilFmt}
      ⇒ matrice <em>ADMIN_CENTRALE</em> du Code des MP CI.
    </span>
    ${renderTranchesTable(allTranches, recommendedCode, ctx.montantLigne)}
  `;

  if (isConforme) {
    box.style.background = '#ecfdf5';
    box.style.borderColor = '#10b981';
    box.style.color = '#065f46';
    const conformLine = stillSelected === recommendedCode
      ? '✓ <strong>Mode conforme à la recommandation.</strong>'
      : `✓ <strong>Mode conforme</strong> (alternative également admise : ${stillSelected}).`;
    box.innerHTML = `${motivation}<div style="margin-top:6px;">${conformLine}</div>`;
  } else {
    box.style.background = '#fef2f2';
    box.style.borderColor = '#dc2626';
    box.style.color = '#7f1d1d';
    box.innerHTML = `
      ${motivation}
      <div style="margin-top:6px;">
        ⚠ <strong>Vous avez choisi <code style="background:rgba(0,0,0,0.06); padding:1px 4px;">${stillSelected || '(vide)'}</code></strong>.
        Ce choix constitue une <strong>dérogation aux règles du Code des Marchés Publics CI</strong>.
        Une justification de dérogation sera obligatoirement demandée à l'étape Procédure.
      </div>
      <div style="margin-top:6px;">
        <button type="button" class="btn btn-sm btn-secondary" id="btn-apply-recommended" style="font-size:11px; padding:3px 8px;">↩ Appliquer le mode recommandé (${recommendedCode})</button>
      </div>
    `;
    const applyBtn = document.getElementById('btn-apply-recommended');
    if (applyBtn) applyBtn.addEventListener('click', () => {
      modeSelect.value = recommendedCode;
      delete modeSelect.dataset.userTouched;
      refreshModePassationRec(registries);
    });
  }
}

function setupModePassationSuggestion(registries, mpBudgetLines) {
  const modeSelect = document.getElementById('modePassation');
  const typeSelect = document.getElementById('typeMarche');
  const natureSelect = document.getElementById('natureEco');
  const activiteHidden = document.getElementById('activite');

  if (!modeSelect) return;

  const refresh = () => refreshModePassationRec(registries, mpBudgetLines);

  // Tracking du choix utilisateur : à partir du moment où l'utilisateur sélectionne
  // manuellement un mode, on cesse de l'auto-pré-sélectionner.
  modeSelect.addEventListener('change', () => {
    modeSelect.dataset.userTouched = '1';
    refresh();
  });

  if (typeSelect)     typeSelect.addEventListener('change', refresh);
  if (natureSelect)   natureSelect.addEventListener('change', refresh);
  // Modif #53c — le montant utilisé vient désormais des MP_BUDGET_LINE liées à
  // l'activité, donc tout changement d'activité doit déclencher un refresh.
  if (activiteHidden) activiteHidden.addEventListener('change', refresh);

  // Premier rendu (utile si la page est chargée avec un brouillon)
  refresh();
}

export default renderPPMCreateLine;
