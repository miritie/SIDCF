/* ============================================
   ECR01C - Fiche Marché (Détail Opération)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { money, date } from '../../../lib/format.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';
import { renderBudgetLineSummary } from '../../../ui/widgets/budget-line-viewer.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderFicheMarche(params) {
  const { idOperation } = params;

  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  // Load full operation data
  const fullData = await dataService.getOperationFull(idOperation);

  if (!fullData || !fullData.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
    ]));
    return;
  }

  const { operation, procedure, attribution, avenants, garanties } = fullData;
  const registries = dataService.getAllRegistries();

  // Check rules
  const rulesResult = dataService.checkRules(operation, operation.etat, {
    avenants,
    garanties,
    attribution
  });

  // Load budget line if linked
  const budgetLine = operation.budgetLineId
    ? await dataService.get(ENTITIES.BUDGET_LINE, operation.budgetLineId)
    : null;

  const page = el('div', { className: 'page' }, [
    // Timeline Steps (nouveau!)
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      el('div', {}, [
        createButton('btn btn-secondary btn-sm', '← Retour PPM', () => router.navigate('/ppm-list')),
        el('h1', { className: 'page-title', style: { marginTop: '12px' } }, operation.objet),
        el('p', { className: 'page-subtitle' }, `Marché ${operation.id} • ${operation.typeMarche}`)
      ]),
      el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
        el('span', {
          className: `badge badge-${registries.ETAT_MARCHE.find(e => e.code === operation.etat)?.color || 'gray'}`
        }, registries.ETAT_MARCHE.find(e => e.code === operation.etat)?.label || operation.etat),
        // Badge dérogation si présent
        operation.procDerogation?.isDerogation ? el('span', { className: 'badge-derogation' }, '⚠️ Dérogation') : null
      ])
    ]),

    // Rules alerts
    ...rulesResult.messages.map(msg => {
      const alertClass = msg.severity === 'BLOCK' ? 'alert-error' :
                         msg.severity === 'WARN' ? 'alert-warning' : 'alert-info';

      return el('div', { className: `alert ${alertClass}` }, [
        el('div', { className: 'alert-icon' }, msg.severity === 'BLOCK' ? '🚫' : '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, msg.code),
          el('div', { className: 'alert-message' }, msg.message)
        ])
      ]);
    }),

    // Navigation tabs
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-body', style: { padding: '16px' } }, [
        el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
          el('button', { className: 'btn btn-sm btn-secondary' }, '📋 Identité'),
          createButton('btn btn-sm btn-secondary', '⚖️ Procédure', () => router.navigate('/procedure', { idOperation })),
          createButton('btn btn-sm btn-secondary', '👥 Attribution', () => router.navigate('/attribution', { idOperation })),
          createButton('btn btn-sm btn-secondary', '📝 Avenants', () => router.navigate('/avenants', { idOperation })),
          createButton('btn btn-sm btn-secondary', '🔒 Garanties', () => router.navigate('/garanties', { idOperation })),
          createButton('btn btn-sm btn-secondary', '✅ Clôture', () => router.navigate('/cloture', { idOperation }))
        ])
      ])
    ]),

    // Identité marché
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Identité du marché')
      ]),
      el('div', { className: 'card-body' }, [
        renderInfoGrid([
          { label: 'Objet', value: operation.objet },
          { label: 'Type de marché', value: registries.TYPE_MARCHE.find(t => t.code === operation.typeMarche)?.label },
          { label: 'Mode de passation', value: registries.MODE_PASSATION.find(m => m.code === operation.modePassation)?.label },
          { label: 'Montant prévisionnel', value: money(operation.montantPrevisionnel) },
          { label: 'Devise', value: operation.devise },
          { label: 'Durée', value: `${operation.dureePrevisionnelle} jours` },
          { label: 'Exercice', value: operation.exercice },
          { label: 'État', value: registries.ETAT_MARCHE.find(e => e.code === operation.etat)?.label }
        ])
      ])
    ]),

    // Ligne budgétaire (si présente, remplace Chaîne budgétaire)
    budgetLine ? renderBudgetLineSummary(budgetLine) : el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Chaîne budgétaire')
      ]),
      el('div', { className: 'card-body' }, [
        renderInfoGrid([
          { label: 'Section', value: operation.chaineBudgetaire?.section },
          { label: 'Programme', value: operation.chaineBudgetaire?.programme },
          { label: 'Activité', value: operation.chaineBudgetaire?.activite },
          { label: 'Nature économique', value: operation.chaineBudgetaire?.nature },
          { label: 'Bailleur', value: registries.BAILLEUR.find(b => b.code === operation.chaineBudgetaire?.bailleur)?.label }
        ])
      ])
    ]),

    // Livrables
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, `📦 Livrables (${operation.livrables?.length || 0})`)
      ]),
      el('div', { className: 'card-body' }, [
        operation.livrables && operation.livrables.length > 0
          ? el('table', { className: 'table', style: { width: '100%' } }, [
              el('thead', {}, [
                el('tr', {}, [
                  el('th', {}, 'Type'),
                  el('th', {}, 'Libellé'),
                  el('th', {}, 'Localisation'),
                  el('th', {}, 'Coordonnées')
                ])
              ]),
              el('tbody', {}, operation.livrables.map(liv => {
                const typeLabel = registries.TYPE_LIVRABLE?.find(t => t.code === liv.type)?.label || liv.type;
                const locParts = [
                  liv.localisation?.region,
                  liv.localisation?.commune,
                  liv.localisation?.sousPrefecture,
                  liv.localisation?.localite
                ].filter(Boolean);
                const locText = locParts.length > 0 ? locParts.join(' > ') : 'Non localisé';
                const coords = liv.localisation?.coordsOK
                  ? `${liv.localisation.latitude}, ${liv.localisation.longitude}`
                  : '-';

                return el('tr', {}, [
                  el('td', {}, el('span', { className: 'badge badge-info' }, typeLabel)),
                  el('td', {}, liv.libelle || '-'),
                  el('td', {}, el('span', { className: 'text-small text-muted' }, `📍 ${locText}`)),
                  el('td', {}, el('span', { className: 'text-small text-muted' }, coords))
                ]);
              }))
            ])
          : el('p', { className: 'text-muted' }, 'Aucun livrable défini')
      ])
    ])
  ]);

  mount('#app', page);
}

function renderInfoGrid(items) {
  return el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } },
    items.map(item =>
      el('div', {}, [
        el('div', { className: 'text-small text-muted' }, item.label),
        el('div', { style: { fontWeight: '500', marginTop: '4px' } }, String(item.value || '-'))
      ])
    )
  );
}

export default renderFicheMarche;
