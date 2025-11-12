/* ============================================
   ECR01D - Créer Ligne PPM
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { operationId } from '../../../lib/uid.js';
import logger from '../../../lib/logger.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Get selected option label from a select element
 */
function getSelectLabel(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return '';
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption?.textContent || '';
}

export async function renderPPMCreateLine(params) {
  const registries = dataService.getAllRegistries();
  const currentYear = new Date().getFullYear();

  const page = el('div', { className: 'page' }, [
    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour liste PPM', () => router.navigate('/ppm-list')),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, '➕ Créer une nouvelle ligne PPM'),
      el('p', { className: 'page-subtitle' }, 'Saisie manuelle d\'une opération au Plan de Passation des Marchés')
    ]),

    // Form
    el('form', { id: 'form-ppm-line', onsubmit: (e) => e.preventDefault() }, [

      // Section: Identification
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📋 Identification')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Exercice
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Exercice', el('span', { className: 'required' }, '*')]),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'exercice',
                value: currentYear,
                min: currentYear - 5,
                max: currentYear + 5,
                required: true
              })
            ]),

            // Section (Ministère)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Section (Ministère)', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'section', required: true }, [
                el('option', { value: '' }, '-- Sélectionner une section --'),
                ...(registries.CHAINE_BUDGETAIRE?.sections || []).map(s =>
                  el('option', { value: s.code, 'data-label': s.label }, s.label)
                )
              ])
            ]),

            // Programme
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Programme', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'programme', disabled: true, required: true }, [
                el('option', { value: '' }, '-- Sélectionner une section d\'abord --')
              ])
            ]),

            // Unité Administrative (UA)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Unité Administrative (UA)', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'unite', disabled: true, required: true }, [
                el('option', { value: '' }, '-- Sélectionner un programme d\'abord --')
              ])
            ]),

            // Objet marché
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

      // Section: Classification
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '🏷️ Classification du marché')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Type marché
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Type de marché', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'typeMarche', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_MARCHE || []).map(t =>
                  el('option', { value: t.code }, t.label)
                )
              ])
            ]),

            // Mode passation
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Mode de passation', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'modePassation', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.MODE_PASSATION || []).map(m =>
                  el('option', { value: m.code }, m.label)
                )
              ])
            ]),

            // Revue
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Revue'),
              el('select', { className: 'form-input', id: 'revue' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_REVUE || []).map(r =>
                  el('option', { value: r.code }, r.label)
                )
              ])
            ]),

            // Nature prix
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Nature des prix', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'naturePrix', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.NATURE_PRIX || []).map(n =>
                  el('option', { value: n.code }, n.label)
                )
              ])
            ])
          ])
        ])
      ]),

      // Section: Financier
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '💰 Informations financières')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Montant prévisionnel
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

            // Type financement
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Type de financement', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'typeFinancement', required: true }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_FINANCEMENT || []).map(t =>
                  el('option', { value: t.code }, t.label)
                )
              ])
            ]),

            // Bailleur (Source financement)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Bailleur', el('span', { className: 'required' }, '*')]),
              el('select', { className: 'form-input', id: 'sourceFinancement', disabled: true, required: true }, [
                el('option', { value: '' }, '-- Sélectionner type financement d\'abord --')
              ])
            ])
          ])
        ])
      ]),

      // Section: Chaîne budgétaire
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '🔗 Chaîne budgétaire')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Activité
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Activité'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'activite',
                placeholder: 'Libellé activité'
              })
            ]),

            // Code activité
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Code activité'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'activiteCode',
                placeholder: 'Ex: 11011100015'
              })
            ]),

            // Ligne budgétaire
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Ligne budgétaire'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'ligneBudgetaire',
                placeholder: 'Ex: 62200000'
              })
            ])
          ])
        ])
      ]),

      // Section: Technique
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '⚙️ Informations techniques')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Délai exécution
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

            // Catégorie prestation
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Catégorie de prestation'),
              el('select', { className: 'form-input', id: 'categoriePrestation' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.CATEGORIE_PRESTATION || []).map(c =>
                  el('option', { value: c.code }, c.label)
                )
              ])
            ]),

            // Bénéficiaire
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Bénéficiaire'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'beneficiaire',
                placeholder: 'Nom du bénéficiaire'
              })
            ]),

            // Livrable
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Livrable'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'livrable',
                placeholder: 'Description du livrable'
              })
            ])
          ])
        ])
      ]),

      // Section: Localisation géographique (Cascading)
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📍 Localisation géographique')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Région (cascading root)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Région'),
              el('select', { className: 'form-input', id: 'region' }, [
                el('option', { value: '' }, '-- Sélectionner une région --'),
                ...(registries.LOCALITE_CI?.regions || []).map(r =>
                  el('option', { value: r.code, 'data-label': r.label }, r.label)
                )
              ])
            ]),

            // Département (cascading level 2)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Département'),
              el('select', { className: 'form-input', id: 'departement', disabled: true }, [
                el('option', { value: '' }, '-- Sélectionner une région d\'abord --')
              ])
            ]),

            // Sous-préfecture (cascading level 3)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Sous-préfecture'),
              el('select', { className: 'form-input', id: 'sousPrefecture', disabled: true }, [
                el('option', { value: '' }, '-- Sélectionner un département d\'abord --')
              ])
            ]),

            // Localité (cascading level 4)
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Localité'),
              el('select', { className: 'form-input', id: 'localite', disabled: true }, [
                el('option', { value: '' }, '-- Sélectionner une sous-préfecture d\'abord --')
              ])
            ]),

            // Longitude
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Longitude'),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'longitude',
                step: '0.000001',
                placeholder: 'Ex: -4.02290'
              })
            ]),

            // Latitude
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Latitude'),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'latitude',
                step: '0.000001',
                placeholder: 'Ex: 5.33255'
              })
            ])
          ])
        ])
      ]),

      // Actions
      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'space-between' } }, [
            createButton('btn btn-secondary', 'Annuler', () => router.navigate('/ppm-list')),
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

  // Setup cascading dropdowns
  setupChaineBudgetaireCascades(registries);
  setupLocalisationCascades(registries);
  setupBailleurLogic(registries);
}

/**
 * Setup cascading budget chain dropdowns (Section → Programme → UA)
 */
function setupChaineBudgetaireCascades(registries) {
  const sectionSelect = document.getElementById('section');
  const programmeSelect = document.getElementById('programme');
  const uniteSelect = document.getElementById('unite');

  if (!sectionSelect || !programmeSelect || !uniteSelect) return;

  // Section change → populate Programme
  sectionSelect.addEventListener('change', (e) => {
    const sectionCode = e.target.value;

    // Reset downstream selects
    programmeSelect.innerHTML = '<option value="">-- Sélectionner un programme --</option>';
    programmeSelect.disabled = !sectionCode;
    uniteSelect.innerHTML = '<option value="">-- Sélectionner un programme d\'abord --</option>';
    uniteSelect.disabled = true;

    if (!sectionCode) return;

    // Find section and populate programmes
    const section = registries.CHAINE_BUDGETAIRE?.sections?.find(s => s.code === sectionCode);
    if (section?.programmes) {
      section.programmes.forEach(prog => {
        const option = document.createElement('option');
        option.value = prog.code;
        option.textContent = prog.label;
        option.dataset.label = prog.label;
        programmeSelect.appendChild(option);
      });
      programmeSelect.disabled = false;
    }
  });

  // Programme change → populate UA
  programmeSelect.addEventListener('change', (e) => {
    const sectionCode = sectionSelect.value;
    const progCode = e.target.value;

    // Reset downstream select
    uniteSelect.innerHTML = '<option value="">-- Sélectionner une unité administrative --</option>';
    uniteSelect.disabled = !progCode;

    if (!progCode) return;

    // Find programme and populate UAs
    const section = registries.CHAINE_BUDGETAIRE?.sections?.find(s => s.code === sectionCode);
    const programme = section?.programmes?.find(p => p.code === progCode);
    if (programme?.unites && Array.isArray(programme.unites)) {
      programme.unites.forEach(ua => {
        const option = document.createElement('option');
        option.value = ua.code;
        option.textContent = ua.label;
        option.dataset.label = ua.label;
        option.dataset.zone = ua.zone;
        uniteSelect.appendChild(option);
      });
      uniteSelect.disabled = false;
    }
  });
}

/**
 * Setup bailleur logic based on type de financement
 */
function setupBailleurLogic(registries) {
  const typeFinancementSelect = document.getElementById('typeFinancement');
  const sourceFinancementSelect = document.getElementById('sourceFinancement');

  if (!typeFinancementSelect || !sourceFinancementSelect) return;

  typeFinancementSelect.addEventListener('change', (e) => {
    const typeFin = e.target.value;

    // Clear current selection
    sourceFinancementSelect.innerHTML = '<option value="">-- Sélectionner un bailleur --</option>';

    if (!typeFin) return;

    // Filter bailleurs based on type financement
    let bailleurs = [];
    if (typeFin === 'ETAT') {
      // Only Trésor for Budget de l'État
      bailleurs = (registries.BAILLEUR || []).filter(b => b.typeFinancement === 'ETAT');
    } else {
      // All external bailleurs for Emprunt/Don
      bailleurs = (registries.BAILLEUR || []).filter(b => b.typeFinancement === 'EXTERNE');
    }

    bailleurs.forEach(b => {
      const option = document.createElement('option');
      option.value = b.code;
      option.textContent = b.label;
      sourceFinancementSelect.appendChild(option);
    });

    // Auto-select if only one option
    if (bailleurs.length === 1) {
      sourceFinancementSelect.value = bailleurs[0].code;
    }
  });
}

/**
 * Setup cascading location dropdowns
 */
function setupLocalisationCascades(registries) {
  const regionSelect = document.getElementById('region');
  const deptSelect = document.getElementById('departement');
  const spSelect = document.getElementById('sousPrefecture');
  const localiteSelect = document.getElementById('localite');

  if (!regionSelect || !deptSelect || !spSelect || !localiteSelect) return;

  // Région change → populate Département
  regionSelect.addEventListener('change', (e) => {
    const regionCode = e.target.value;

    // Reset downstream selects
    deptSelect.innerHTML = '<option value="">-- Sélectionner un département --</option>';
    deptSelect.disabled = !regionCode;
    spSelect.innerHTML = '<option value="">-- Sélectionner un département d\'abord --</option>';
    spSelect.disabled = true;
    localiteSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture d\'abord --</option>';
    localiteSelect.disabled = true;

    if (!regionCode) return;

    // Find region and populate départements
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

  // Département change → populate Sous-préfecture
  deptSelect.addEventListener('change', (e) => {
    const regionCode = regionSelect.value;
    const deptCode = e.target.value;

    // Reset downstream selects
    spSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture --</option>';
    spSelect.disabled = !deptCode;
    localiteSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture d\'abord --</option>';
    localiteSelect.disabled = true;

    if (!deptCode) return;

    // Find département and populate sous-préfectures
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

  // Sous-préfecture change → populate Localité
  spSelect.addEventListener('change', (e) => {
    const regionCode = regionSelect.value;
    const deptCode = deptSelect.value;
    const spCode = e.target.value;

    // Reset downstream select
    localiteSelect.innerHTML = '<option value="">-- Sélectionner une localité --</option>';
    localiteSelect.disabled = !spCode;

    if (!spCode) return;

    // Find sous-préfecture and populate localités
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

async function handleSave(createAnother) {
  // Collect form data
  const formData = {
    // Identification
    exercice: Number(document.getElementById('exercice')?.value),
    unite: getSelectLabel('unite') || '', // UA label
    uniteCode: document.getElementById('unite')?.value || '', // UA code
    objet: document.getElementById('objet')?.value?.trim(),

    // Classification
    typeMarche: document.getElementById('typeMarche')?.value,
    modePassation: document.getElementById('modePassation')?.value,
    revue: document.getElementById('revue')?.value || null,
    naturePrix: document.getElementById('naturePrix')?.value,

    // Financier
    montantPrevisionnel: Number(document.getElementById('montantPrevisionnel')?.value) || 0,
    montantActuel: Number(document.getElementById('montantPrevisionnel')?.value) || 0,
    typeFinancement: document.getElementById('typeFinancement')?.value,
    sourceFinancement: document.getElementById('sourceFinancement')?.value?.trim() || '',

    // Chaîne budgétaire (avec cascades Section→Programme→UA)
    chaineBudgetaire: {
      section: getSelectLabel('section') || '',
      sectionCode: document.getElementById('section')?.value || '',
      programme: getSelectLabel('programme') || '',
      programmeCode: document.getElementById('programme')?.value || '',
      activite: document.getElementById('activite')?.value?.trim() || '',
      activiteCode: document.getElementById('activiteCode')?.value?.trim() || '',
      ligneBudgetaire: document.getElementById('ligneBudgetaire')?.value?.trim() || '',
      nature: '',
      bailleur: document.getElementById('sourceFinancement')?.value || ''
    },

    // Technique
    delaiExecution: Number(document.getElementById('delaiExecution')?.value) || 0,
    dureePrevisionnelle: Number(document.getElementById('delaiExecution')?.value) || 0,
    categoriePrestation: document.getElementById('categoriePrestation')?.value || '',
    beneficiaire: document.getElementById('beneficiaire')?.value?.trim() || '',
    livrables: document.getElementById('livrable')?.value?.trim()
      ? [document.getElementById('livrable')?.value?.trim()]
      : [],

    // Localisation (cascading selects)
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

  // Validation
  if (!formData.objet || !formData.unite || !formData.typeMarche || !formData.modePassation) {
    alert('⚠️ Veuillez remplir tous les champs obligatoires');
    return;
  }

  if (formData.montantPrevisionnel <= 0) {
    alert('⚠️ Le montant prévisionnel doit être supérieur à 0');
    return;
  }

  // Create operation
  const newOperationId = operationId();
  const operation = {
    id: newOperationId,
    planId: null, // Unitaire, pas lié à un plan importé
    budgetLineId: null,
    ...formData,
    devise: 'XOF',
    timeline: ['PLANIF'],
    etat: 'PLANIFIE',
    procDerogation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const result = await dataService.create(ENTITIES.OPERATION, operation);

  if (!result.success) {
    alert('❌ Erreur lors de la création de l\'opération');
    logger.error('[PPM Create Line] Failed to create operation', result.error);
    return;
  }

  if (createAnother) {
    alert('✅ Opération créée avec succès');
    // Reset form
    document.getElementById('form-ppm-line')?.reset();
    document.getElementById('exercice').value = new Date().getFullYear();
  } else {
    alert('✅ Opération créée avec succès');
    router.navigate('/fiche-marche', { idOperation: newOperationId });
  }
}

export default renderPPMCreateLine;
