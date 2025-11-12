/* ============================================
   ECR06 - Dashboard Contrôle Financier
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import logger from '../../../lib/logger.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderDashboardCF(params) {
  // Load all operations
  const operations = await dataService.getAll(ENTITIES.OPERATION);
  const rulesConfig = dataService.getRulesConfig();

  // Calculate KPIs
  const kpis = calculateKPIs(operations, rulesConfig);

  // Group by state
  const byState = operations.reduce((acc, op) => {
    acc[op.etat] = (acc[op.etat] || 0) + 1;
    return acc;
  }, {});

  const page = el('div', { className: 'page' }, [
    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Accueil', () => router.navigate('/')),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, '📊 Dashboard Contrôle Financier'),
      el('p', { className: 'page-subtitle' }, `Vue d'ensemble des marchés - ${operations.length} opérations`)
    ]),

    // KPIs Grid
    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' } }, [
      renderKPI('Total Marchés', operations.length, 'var(--color-primary)', '📁'),
      renderKPI('En cours', kpis.enCours, 'var(--color-info)', '▶️'),
      renderKPI('Dérogations', kpis.derogations, 'var(--color-warning)', '⚠️'),
      renderKPI('ANO en attente', kpis.anoEnAttente, 'var(--color-error)', '⏳'),
      renderKPI('Avenants >25%', kpis.avenants25, 'var(--color-warning)', '📝'),
      renderKPI('Délais OS', kpis.delaisOS, 'var(--color-error)', '⏰')
    ]),

    // États
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Répartition par État')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' } },
          Object.entries(byState).map(([etat, count]) => renderStateBadge(etat, count))
        )
      ])
    ]),

    // Alertes
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '🚨 Alertes Critiques')
      ]),
      el('div', { className: 'card-body' }, [
        ...renderAlerts(operations, rulesConfig)
      ])
    ]),

    // Liste récente
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, '📋 Dernières Opérations'),
        createButton('btn btn-sm btn-secondary', 'Voir tout', () => router.navigate('/ppm-list'))
      ]),
      el('div', { className: 'card-body' }, [
        renderRecentOperations(operations.slice(0, 10))
      ])
    ])
  ]);

  mount('#app', page);
}

function calculateKPIs(operations, rulesConfig) {
  const kpis = {
    enCours: operations.filter(op => op.etat !== 'CLOS' && op.etat !== 'REFUSE').length,
    derogations: operations.filter(op => op.procDerogation?.isDerogation).length,
    anoEnAttente: 0, // TODO: query ANO entities
    avenants25: 0, // TODO: query AVENANT entities with cumul >25%
    delaisOS: 0
  };

  // Check délais OS
  const visaCFDelay = rulesConfig?.seuils?.DELAI_MAX_OS_APRES_VISA?.value || 30;
  operations.forEach(op => {
    if (op.timeline.includes('VISE') && !op.timeline.includes('EXEC') && op.dateCF) {
      const daysSince = Math.floor((new Date() - new Date(op.dateCF)) / (1000 * 60 * 60 * 24));
      if (daysSince > visaCFDelay) {
        kpis.delaisOS++;
      }
    }
  });

  return kpis;
}

function renderKPI(label, value, color, icon) {
  return el('div', {
    className: 'card',
    style: {
      borderColor: `${color}30`,
      background: `${color}10`,
      cursor: 'pointer'
    }
  }, [
    el('div', { className: 'card-body', style: { textAlign: 'center', padding: '20px' } }, [
      el('div', { style: { fontSize: '32px', marginBottom: '8px' } }, icon),
      el('div', { style: { fontSize: '24px', fontWeight: '700', color, marginBottom: '4px' } }, String(value)),
      el('div', { className: 'text-small text-muted' }, label)
    ])
  ]);
}

function renderStateBadge(etat, count) {
  const colorMap = {
    'PLANIFIE': 'var(--color-info)',
    'EN_PROC': 'var(--color-warning)',
    'EN_ATTR': 'var(--color-primary)',
    'VISE': 'var(--color-success)',
    'EN_EXEC': 'var(--color-success)',
    'CLOS': 'var(--color-gray-500)',
    'REFUSE': 'var(--color-error)'
  };

  const color = colorMap[etat] || 'var(--color-gray-500)';

  return el('div', {
    style: {
      padding: '12px',
      borderRadius: '6px',
      border: `2px solid ${color}`,
      background: `${color}10`,
      textAlign: 'center'
    }
  }, [
    el('div', { style: { fontSize: '20px', fontWeight: '700', color } }, String(count)),
    el('div', { className: 'text-small', style: { marginTop: '4px', fontWeight: '500' } }, etat)
  ]);
}

function renderAlerts(operations, rulesConfig) {
  const alerts = [];

  // Dérogations
  const derogations = operations.filter(op => op.procDerogation?.isDerogation);
  if (derogations.length > 0) {
    alerts.push(
      el('div', { className: 'alert alert-warning', style: { marginBottom: '12px' } }, [
        el('div', { className: 'alert-icon' }, '⚠️'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, `${derogations.length} Dérogation(s) en cours`),
          el('div', { className: 'alert-message' }, 'Vérifier les justificatifs')
        ])
      ])
    );
  }

  // Délais OS
  const visaCFDelay = rulesConfig?.seuils?.DELAI_MAX_OS_APRES_VISA?.value || 30;
  const delaisOS = operations.filter(op => {
    if (op.timeline.includes('VISE') && !op.timeline.includes('EXEC') && op.dateCF) {
      const daysSince = Math.floor((new Date() - new Date(op.dateCF)) / (1000 * 60 * 60 * 24));
      return daysSince > visaCFDelay;
    }
    return false;
  });

  if (delaisOS.length > 0) {
    alerts.push(
      el('div', { className: 'alert alert-error', style: { marginBottom: '12px' } }, [
        el('div', { className: 'alert-icon' }, '⏰'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, `${delaisOS.length} Retard(s) OS`),
          el('div', { className: 'alert-message' }, `Délai maximum: ${visaCFDelay} jours après visa`)
        ])
      ])
    );
  }

  if (alerts.length === 0) {
    alerts.push(
      el('div', { className: 'alert alert-success' }, [
        el('div', { className: 'alert-icon' }, '✅'),
        el('div', { className: 'alert-content' }, [
          el('div', { className: 'alert-title' }, 'Aucune alerte critique'),
          el('div', { className: 'alert-message' }, 'Tous les marchés sont conformes')
        ])
      ])
    );
  }

  return alerts;
}

function renderRecentOperations(operations) {
  if (operations.length === 0) {
    return el('div', { className: 'alert alert-info' }, 'Aucune opération');
  }

  return el('div', { style: { overflowX: 'auto' } }, [
    el('table', { className: 'data-table' }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'Objet'),
          el('th', {}, 'État'),
          el('th', {}, 'Montant'),
          el('th', {}, 'Actions')
        ])
      ]),
      el('tbody', {},
        operations.map(op =>
          el('tr', {}, [
            el('td', { style: { fontWeight: '500' } }, op.objet),
            el('td', {}, op.etat),
            el('td', {}, `${(op.montantPrevisionnel / 1000000).toFixed(2)}M`),
            el('td', {}, [
              createButton('btn btn-sm btn-secondary', 'Voir', () => router.navigate('/fiche-marche', { idOperation: op.id }))
            ])
          ])
        )
      )
    ])
  ]);
}

export default renderDashboardCF;
