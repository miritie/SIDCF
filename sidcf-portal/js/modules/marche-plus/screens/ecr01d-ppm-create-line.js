/* ============================================
   ECR01D - Créer Ligne PPM (Marché+)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { operationId } from '../../../lib/uid.js';
import logger from '../../../lib/logger.js';
import { renderLivrableManager } from '../../../ui/widgets/livrable-manager.js';
import { renderSearchableSelect } from '../../../ui/widgets/searchable-select.js';

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

  let livrablesList = [];
  let activiteWidget = null;

  async function handleSave(createAnother) {
    const bailleurs = Array.from(document.querySelectorAll('.bailleur-select'))
      .map(s => s.value)
      .filter(v => v);

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

      montantPrevisionnel: Number(document.getElementById('montantPrevisionnel')?.value) || 0,
      montantActuel: Number(document.getElementById('montantPrevisionnel')?.value) || 0,
      typeFinancement: document.getElementById('typeFinancement')?.value,
      sourceFinancement: bailleurs[0] || '',

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
        bailleur: bailleurs[0] || '',
        bailleurs
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
    if (bailleurs.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins un bailleur');
      return;
    }
    if (formData.montantPrevisionnel <= 0) {
      alert('⚠️ Le montant prévisionnel doit être supérieur à 0');
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
      const bailleursList = document.getElementById('bailleurs-list');
      if (bailleursList && bailleursList.__reset) bailleursList.__reset();
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
              el('label', { className: 'form-label' }, 'Ligne budgétaire (calculée)'),
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

      // ---- Informations financières (multi-bailleurs) ----
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '💰 Informations financières')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Montant prévisionnel (XOF)', el('span', { className: 'required' }, '*')]),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'montantPrevisionnel',
                min: 0,
                step: 1,
                placeholder: '0',
                required: true
              })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Type de financement', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'typeFinancement', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_FINANCEMENT || []).map(t => el('option', { value: t.code }, t.label))
              ])
            ])
          ]),

          el('div', { className: 'form-field', style: { marginTop: '16px' } }, [
            el('label', { className: 'form-label' }, ['Bailleurs', el('span', { className: 'required' }, '*')]),
            el('div', { id: 'bailleurs-list' }),
            el('button', {
              type: 'button',
              className: 'btn btn-sm btn-accent',
              id: 'add-bailleur-btn',
              style: { marginTop: '4px' }
            }, '+ Ajouter un bailleur')
          ])
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
  setupBailleursMulti(registries);
  setupLocalisationCascades(registries);

  const livrablesContainer = document.getElementById('livrables-container');
  if (livrablesContainer) {
    const livrableWidget = renderLivrableManager(livrablesList, registries, (updatedList) => {
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
/* Multi-bailleurs : liste de selects + bouton "+ Ajouter un bailleur"     */
/* ----------------------------------------------------------------------- */
function setupBailleursMulti(registries) {
  const list = document.getElementById('bailleurs-list');
  const addBtn = document.getElementById('add-bailleur-btn');
  const typeFinancementSelect = document.getElementById('typeFinancement');
  if (!list || !addBtn || !typeFinancementSelect) return;

  const getBailleurOptions = () => {
    const typeFin = typeFinancementSelect.value;
    if (!typeFin) return [];
    if (typeFin === 'ETAT') {
      return (registries.BAILLEUR || []).filter(b => b.typeFinancement === 'ETAT');
    }
    return (registries.BAILLEUR || []).filter(b => b.typeFinancement === 'EXTERNE');
  };

  const populateSelect = (select) => {
    const previous = select.value;
    const opts = getBailleurOptions();
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = opts.length === 0
      ? '-- Sélectionner type financement d\'abord --'
      : '-- Sélectionner un bailleur --';
    select.appendChild(placeholder);
    opts.forEach(b => {
      const o = document.createElement('option');
      o.value = b.code;
      o.textContent = b.label;
      select.appendChild(o);
    });
    if (previous && opts.find(b => b.code === previous)) select.value = previous;
  };

  const refreshAll = () => list.querySelectorAll('.bailleur-select').forEach(populateSelect);

  const buildRow = (isFirst) => {
    const row = document.createElement('div');
    row.className = 'bailleur-row';
    Object.assign(row.style, { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' });

    const select = document.createElement('select');
    select.className = 'form-input bailleur-select';
    select.style.flex = '1';
    if (isFirst) select.required = true;
    populateSelect(select);
    row.appendChild(select);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-secondary';
    removeBtn.textContent = '✕';
    removeBtn.style.padding = '4px 10px';
    removeBtn.title = 'Retirer ce bailleur';
    removeBtn.addEventListener('click', () => {
      if (list.querySelectorAll('.bailleur-row').length > 1) row.remove();
    });
    row.appendChild(removeBtn);
    return row;
  };

  // expose reset for handleSave's "Enregistrer et créer nouveau" branch
  list.__reset = () => {
    list.innerHTML = '';
    list.appendChild(buildRow(true));
  };

  list.appendChild(buildRow(true));
  addBtn.addEventListener('click', () => list.appendChild(buildRow(false)));
  typeFinancementSelect.addEventListener('change', refreshAll);
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
