/* ============================================
   ECR04B - Avenants
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { money, percent } from '../../../lib/format.js';
import { kpiGrid } from '../../../ui/widgets/kpis.js';
import { dataTable } from '../../../ui/widgets/table.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderAvenants(params) {
  const { idOperation } = params;

  const operation = await dataService.get(ENTITIES.OPERATION, idOperation);
  const avenants = await dataService.query(ENTITIES.AVENANT, { operationId: idOperation });
  const resiliations = await dataService.query(ENTITIES.RESILIATION, { operationId: idOperation });
  const registries = dataService.getAllRegistries();

  // Check if market is already terminated (resiliée)
  const isResilie = resiliations && resiliations.length > 0;

  const montantInitial = operation?.montantPrevisionnel || 0;
  const totalAvenants = avenants.reduce((sum, av) => sum + (av.variationMontant || 0), 0);
  const montantActuel = montantInitial + totalAvenants;
  const pourcentage = montantInitial > 0 ? (totalAvenants / montantInitial) * 100 : 0;

  const seuilAlerte = 25;
  const seuilBlock = 30;

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title' }, 'Avenants & Résiliation'),
      el('p', { className: 'page-subtitle' }, operation?.objet || idOperation)
    ]),

    // Alert si marché résilié
    isResilie ? el('div', { className: 'alert alert-error', style: { marginBottom: '24px' } }, [
      el('div', { className: 'alert-icon' }, '🚫'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Marché résilié'),
        el('div', { className: 'alert-message' }, [
          el('p', {}, `Ce marché a été résilié le ${new Date(resiliations[0].dateResiliation).toLocaleDateString()}`),
          el('p', { style: { marginTop: '8px' } }, `Motif: ${resiliations[0].motifRef || resiliations[0].motifAutre || 'Non spécifié'}`)
        ])
      ])
    ]) : null,

    // Alert si seuil dépassé
    !isResilie && pourcentage >= seuilAlerte ? el('div', { className: `alert ${pourcentage >= seuilBlock ? 'alert-error' : 'alert-warning'}` }, [
      el('div', { className: 'alert-icon' }, pourcentage >= seuilBlock ? '🚫' : '⚠️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, pourcentage >= seuilBlock ? 'Seuil dépassé' : 'Alerte seuil'),
        el('div', { className: 'alert-message' }, `Le cumul des avenants (${pourcentage.toFixed(1)}%) ${pourcentage >= seuilBlock ? 'dépasse' : 'approche'} le seuil autorisé (${seuilBlock}%)`)
      ])
    ]) : null,

    // KPIs
    kpiGrid([
      { label: 'Montant initial', value: montantInitial, options: { format: 'money' } },
      { label: 'Total avenants', value: totalAvenants, options: { format: 'money' } },
      { label: 'Montant actuel', value: montantActuel, options: { format: 'money' } },
      { label: 'Cumul (%)', value: pourcentage.toFixed(1) + '%' }
    ]),

    // Table avenants
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `📑 Liste des avenants (${avenants.length})`)
      ]),
      el('div', { className: 'card-body' }, [
        avenants.length > 0
          ? dataTable(
              [
                { key: 'numero', label: 'N°' },
                { key: 'type', label: 'Type' },
                { key: 'variationMontant', label: 'Montant', render: v => money(v) },
                {
                  key: 'variationMontant',
                  label: '%',
                  render: (v) => percent((v / montantInitial) * 100, 1)
                },
                { key: 'motifRef', label: 'Motif' },
                { key: 'dateSignature', label: 'Date', render: d => d ? new Date(d).toLocaleDateString() : '-' }
              ],
              avenants
            )
          : el('p', { className: 'text-muted' }, 'Aucun avenant')
      ])
    ]),

    // Section Résiliation
    !isResilie ? el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🚫 Résiliation du marché')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-warning', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, '⚠️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Action irréversible'),
            el('div', { className: 'alert-message' }, 'La résiliation d\'un marché est une action définitive qui met fin au contrat.')
          ])
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Date de résiliation',
              el('span', { className: 'required' }, '*')
            ]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'resiliation-date',
              value: new Date().toISOString().split('T')[0]
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, [
              'Motif de résiliation',
              el('span', { className: 'required' }, '*')
            ]),
            el('select', { className: 'form-input', id: 'resiliation-motif' }, [
              el('option', { value: '' }, '-- Sélectionnez --'),
              el('option', { value: 'NON_EXECUTION' }, 'Non-exécution des travaux'),
              el('option', { value: 'MALFACON' }, 'Malfaçons graves'),
              el('option', { value: 'RETARD' }, 'Retards importants'),
              el('option', { value: 'ABANDON' }, 'Abandon du chantier'),
              el('option', { value: 'FORCE_MAJEURE' }, 'Force majeure'),
              el('option', { value: 'INTERET_PUBLIC' }, 'Intérêt public'),
              el('option', { value: 'AUTRE' }, 'Autre motif')
            ])
          ])
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Précisions (si Autre motif)'),
          el('textarea', {
            className: 'form-input',
            id: 'resiliation-motif-autre',
            rows: 3,
            placeholder: 'Détails du motif de résiliation...'
          })
        ]),

        el('div', { className: 'form-field', style: { marginBottom: '16px' } }, [
          el('label', { className: 'form-label' }, 'Document de résiliation (PDF)'),
          el('input', {
            type: 'file',
            className: 'form-input',
            id: 'resiliation-document',
            accept: '.pdf'
          })
        ]),

        el('div', { style: { display: 'flex', justifyContent: 'flex-end' } }, [
          createButton('btn btn-error', '🚫 Résilier le marché', async () => {
            await handleResiliation(idOperation);
          })
        ])
      ])
    ]) : null,

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        createButton('btn btn-secondary', '← Retour', () => router.navigate('/fiche-marche', { idOperation }))
      ])
    ])
  ]);

  mount('#app', page);
}

/**
 * Handle résiliation
 */
async function handleResiliation(idOperation) {
  const dateResiliation = document.getElementById('resiliation-date')?.value;
  const motifRef = document.getElementById('resiliation-motif')?.value;
  const motifAutre = document.getElementById('resiliation-motif-autre')?.value;
  const docInput = document.getElementById('resiliation-document');

  // Validation
  if (!dateResiliation) {
    alert('⚠️ Veuillez renseigner la date de résiliation');
    return;
  }

  if (!motifRef) {
    alert('⚠️ Veuillez sélectionner un motif de résiliation');
    return;
  }

  if (motifRef === 'AUTRE' && !motifAutre) {
    alert('⚠️ Veuillez préciser le motif de résiliation');
    return;
  }

  // Confirmation
  if (!confirm('⚠️ ATTENTION : La résiliation est une action irréversible.\n\nVoulez-vous vraiment résilier ce marché ?')) {
    return;
  }

  // Handle document
  let documentRef = null;
  if (docInput?.files?.[0]) {
    documentRef = 'DOC_RESILIATION_' + Date.now() + '.pdf';
    console.log('[Résiliation] Document uploadé:', documentRef);
  }

  // Create résiliation entity
  const resiliationId = `RESIL-${idOperation}-${Date.now()}`;
  const resiliationData = {
    id: resiliationId,
    operationId: idOperation,
    dateResiliation,
    motifRef,
    motifAutre: motifRef === 'AUTRE' ? motifAutre : '',
    documentRef,
    createdAt: new Date().toISOString()
  };

  const result = await dataService.create(ENTITIES.RESILIATION, resiliationData);

  if (!result.success) {
    alert('❌ Erreur lors de la résiliation');
    return;
  }

  // Update operation status
  const updateData = {
    etat: 'RESILIE',
    updatedAt: new Date().toISOString()
  };

  await dataService.update(ENTITIES.OPERATION, idOperation, updateData);

  alert('✅ Marché résilié avec succès');
  router.navigate('/fiche-marche', { idOperation });
}

export default renderAvenants;
