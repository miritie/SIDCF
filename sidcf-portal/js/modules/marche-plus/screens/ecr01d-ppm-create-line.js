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

    const newOperationId = operationId();
    const operation = {
      id: newOperationId,
      planId: null,
      budgetLineId: null,
      ...formData,
      devise: 'XOF',
      timeline: ['PLANIF'],
      etat: 'PLANIFIE',
      procDerogation: null,
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
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.MODE_PASSATION || []).map(m => el('option', { value: m.code }, m.label))
              ])
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

export default renderPPMCreateLine;
