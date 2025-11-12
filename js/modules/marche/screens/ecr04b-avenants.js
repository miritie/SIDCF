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

  const montantInitial = operation?.montantPrevisionnel || 0;
  const totalAvenants = avenants.reduce((sum, av) => sum + (av.variationMontant || 0), 0);
  const montantActuel = montantInitial + totalAvenants;
  const pourcentage = montantInitial > 0 ? (totalAvenants / montantInitial) * 100 : 0;

  const seuilAlerte = 25;
  const seuilBlock = 30;

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title' }, 'Avenants'),
      el('p', { className: 'page-subtitle' }, operation?.objet || idOperation)
    ]),

    // Alert si seuil dépassé
    pourcentage >= seuilAlerte ? el('div', { className: `alert ${pourcentage >= seuilBlock ? 'alert-error' : 'alert-warning'}` }, [
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
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `Liste des avenants (${avenants.length})`)
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
                { key: 'motifRef', label: 'Motif' }
              ],
              avenants
            )
          : el('p', { className: 'text-muted' }, 'Aucun avenant')
      ])
    ])
  ]);

  mount('#app', page);
}

export default renderAvenants;
