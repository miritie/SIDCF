/* ============================================
   ECR01B - PPM List & Operations
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { money } from '../../../lib/format.js';
import { dataTable, emptyState } from '../../../ui/widgets/table.js';
import { kpiGrid } from '../../../ui/widgets/kpis.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderPPMList() {
  // Load data
  const operations = await dataService.query(ENTITIES.OPERATION);
  const registries = dataService.getAllRegistries();

  // Calculate stats
  const stats = {
    totalOperations: operations.length,
    totalMontant: operations.reduce((sum, op) => sum + op.montantPrevisionnel, 0),
    enExecution: operations.filter(op => op.etat === 'EXECUTION').length,
    planifies: operations.filter(op => op.etat === 'PLANIFIE').length
  };

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'PPM & Opérations'),
      el('p', { className: 'page-subtitle' }, 'Liste des Plans de Passation des Marchés et opérations'),
      el('div', { className: 'page-actions' }, [
        createButton('btn btn-secondary', '📤 Importer PPM (Excel)', () => router.navigate('/ppm-import')),
        createButton('btn btn-primary', '➕ Créer ligne PPM', () => router.navigate('/ppm-create-line'))
      ])
    ]),

    kpiGrid([
      { label: 'Total Opérations', value: stats.totalOperations },
      { label: 'Montant Total', value: stats.totalMontant, options: { format: 'money' } },
      { label: 'En exécution', value: stats.enExecution },
      { label: 'Planifiées', value: stats.planifies }
    ]),

    operations.length > 0
      ? dataTable(
          [
            { key: 'id', label: 'ID' },
            { key: 'objet', label: 'Objet' },
            {
              key: 'typeMarche',
              label: 'Type',
              render: (val) => {
                const type = registries.TYPE_MARCHE.find(t => t.code === val);
                return type?.label || val;
              }
            },
            {
              key: 'montantPrevisionnel',
              label: 'Montant',
              render: (val) => money(val)
            },
            {
              key: 'etat',
              label: 'État',
              render: (val) => {
                const etat = registries.ETAT_MARCHE.find(e => e.code === val);
                const color = etat?.color || 'gray';
                return el('span', { className: `badge badge-${color}` }, etat?.label || val);
              }
            }
          ],
          operations,
          {
            onRowClick: (op) => router.navigate('/fiche-marche', { idOperation: op.id }),
            actions: [
              {
                label: '👁️',
                className: 'btn-secondary',
                onClick: (op) => router.navigate('/fiche-marche', { idOperation: op.id })
              }
            ]
          }
        )
      : emptyState(
          'Aucune opération trouvée',
          'Importer un PPM',
          () => router.navigate('/ppm-import')
        )
  ]);

  mount('#app', page);
}

export default renderPPMList;
