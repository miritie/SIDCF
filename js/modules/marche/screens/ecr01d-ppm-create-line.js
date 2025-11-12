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

            // Unité opérationnelle
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, ['Unité opérationnelle', el('span', { className: 'required' }, '*')]),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'unite',
                placeholder: 'Ex: Centre de Promotion des logements sociaux',
                required: true
              })
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

            // Source financement
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Source de financement'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'sourceFinancement',
                placeholder: 'Ex: BADEA, BM, AFD...'
              })
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

            // Infrastructure
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Type d\'infrastructure'),
              el('select', { className: 'form-input', id: 'infrastructure' }, [
                el('option', { value: '' }, '-- Sélectionner --'),
                ...(registries.TYPE_INFRASTRUCTURE || []).map(i =>
                  el('option', { value: i.code }, i.label)
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

      // Section: Localisation géographique
      el('div', { className: 'card', style: { marginBottom: '24px' } }, [
        el('div', { className: 'card-header' }, [
          el('h3', { className: 'card-title' }, '📍 Localisation géographique')
        ]),
        el('div', { className: 'card-body' }, [
          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } }, [
            // Région
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Région'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'region',
                placeholder: 'Ex: Kabadougou'
              })
            ]),

            // Code région
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Code région'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'regionCode',
                placeholder: 'Ex: 23'
              })
            ]),

            // Département
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Département'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'departement',
                placeholder: 'Ex: Département d\'Odiénné'
              })
            ]),

            // Code département
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Code département'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'departementCode',
                placeholder: 'Ex: 2301'
              })
            ]),

            // Sous-préfecture
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Sous-préfecture'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'sousPrefecture',
                placeholder: 'Ex: Sous-préfecture d\'Odiénné'
              })
            ]),

            // Code sous-préfecture
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Code sous-préfecture'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'sousPrefectureCode',
                placeholder: 'Ex: 230101'
              })
            ]),

            // Localité
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Localité'),
              el('input', {
                type: 'text',
                className: 'form-input',
                id: 'localite',
                placeholder: 'Ex: Tieme'
              })
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
}

async function handleSave(createAnother) {
  // Collect form data
  const formData = {
    // Identification
    exercice: Number(document.getElementById('exercice')?.value),
    unite: document.getElementById('unite')?.value?.trim(),
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

    // Chaîne budgétaire
    chaineBudgetaire: {
      activite: document.getElementById('activite')?.value?.trim() || '',
      activiteCode: document.getElementById('activiteCode')?.value?.trim() || '',
      ligneBudgetaire: document.getElementById('ligneBudgetaire')?.value?.trim() || '',
      section: '',
      programme: '',
      nature: '',
      bailleur: ''
    },

    // Technique
    delaiExecution: Number(document.getElementById('delaiExecution')?.value) || 0,
    dureePrevisionnelle: Number(document.getElementById('delaiExecution')?.value) || 0,
    infrastructure: document.getElementById('infrastructure')?.value || '',
    beneficiaire: document.getElementById('beneficiaire')?.value?.trim() || '',
    livrables: document.getElementById('livrable')?.value?.trim()
      ? [document.getElementById('livrable')?.value?.trim()]
      : [],

    // Localisation
    localisation: {
      region: document.getElementById('region')?.value?.trim() || '',
      regionCode: document.getElementById('regionCode')?.value?.trim() || '',
      departement: document.getElementById('departement')?.value?.trim() || '',
      departementCode: document.getElementById('departementCode')?.value?.trim() || '',
      sousPrefecture: document.getElementById('sousPrefecture')?.value?.trim() || '',
      sousPrefectureCode: document.getElementById('sousPrefectureCode')?.value?.trim() || '',
      localite: document.getElementById('localite')?.value?.trim() || '',
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
