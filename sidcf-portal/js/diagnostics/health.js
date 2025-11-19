/* ============================================
   Diagnostics - System Health Check
   ============================================ */

import { mount, el } from '../lib/dom.js';
import logger from '../lib/logger.js';
import dataService from '../datastore/data-service.js';

export async function renderHealthCheck() {
  const checks = [];

  // Check 1: DOM containers
  checks.push({
    name: 'Conteneurs DOM',
    status: document.getElementById('app') && document.getElementById('sidebar') ? 'OK' : 'FAIL',
    message: 'Points de montage #app et #sidebar présents'
  });

  // Check 2: CSS loaded
  const cssLoaded = document.styleSheets.length > 0;
  checks.push({
    name: 'CSS',
    status: cssLoaded ? 'OK' : 'FAIL',
    message: `${document.styleSheets.length} feuilles de style chargées`
  });

  // Check 3: DataService
  checks.push({
    name: 'DataService',
    status: dataService.initialized ? 'OK' : 'FAIL',
    message: dataService.initialized ? 'Service de données initialisé' : 'Non initialisé'
  });

  // Check 4: Configuration
  const config = dataService.getConfig();
  checks.push({
    name: 'Configuration',
    status: config ? 'OK' : 'FAIL',
    message: config ? `Version ${config.version}` : 'Configuration manquante'
  });

  // Check 5: Storage
  const stats = dataService.getStats();
  checks.push({
    name: 'Base de données',
    status: Object.keys(stats).length > 0 ? 'OK' : 'WARN',
    message: `${Object.values(stats).reduce((a, b) => a + b, 0)} entités chargées`
  });

  // Check 6: Router
  checks.push({
    name: 'Routeur',
    status: window.location.hash ? 'OK' : 'WARN',
    message: `Route active: ${window.location.hash || 'aucune'}`
  });

  const allOk = checks.every(c => c.status === 'OK');

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'État du système'),
      el('p', { className: 'page-subtitle' }, 'Diagnostic de santé de l\'application')
    ]),

    el('div', { className: `alert ${allOk ? 'alert-success' : 'alert-warning'}` }, [
      el('div', { className: 'alert-icon' }, allOk ? '✅' : '⚠️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, allOk ? 'Système opérationnel' : 'Alertes détectées'),
        el('div', { className: 'alert-message' }, `${checks.filter(c => c.status === 'OK').length}/${checks.length} vérifications réussies`)
      ])
    ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Vérifications')
      ]),
      el('div', { className: 'card-body' }, [
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Composant'),
              el('th', {}, 'Statut'),
              el('th', {}, 'Message')
            ])
          ]),
          el('tbody', {}, checks.map(check =>
            el('tr', {}, [
              el('td', {}, check.name),
              el('td', {}, [
                el('span', {
                  className: `badge badge-${check.status === 'OK' ? 'success' : check.status === 'WARN' ? 'warning' : 'error'}`
                }, check.status)
              ]),
              el('td', {}, check.message)
            ])
          ))
        ])
      ])
    ]),

    el('div', { className: 'card', style: { marginTop: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Statistiques')
      ]),
      el('div', { className: 'card-body' }, [
        el('pre', { style: { fontSize: '12px', background: '#f3f4f6', padding: '16px', borderRadius: '8px' } },
          JSON.stringify({
            config: config?.appName,
            dataProvider: config?.dataProvider,
            stats,
            logs: logger.getLogs().length
          }, null, 2)
        )
      ])
    ])
  ]);

  mount('#app', page);
}

export default renderHealthCheck;
