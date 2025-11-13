/* ============================================
   Alert Block Widget
   Bloc d'alertes et notifications
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Créer un bloc d'alertes
 * @param {Array} alerts - Liste d'alertes [{type, category, message, operationId, severity}]
 * @param {Object} options - Options {title, onAlertClick, maxAlerts}
 * @returns {HTMLElement}
 */
export function alertBlock(alerts, options = {}) {
  const {
    title = 'Alertes',
    onAlertClick = null,
    maxAlerts = 10
  } = options;

  if (!alerts || alerts.length === 0) {
    return el('div', { className: 'alert-block alert-block-empty' }, [
      el('div', { className: 'alert-block-header' }, [
        el('h3', { className: 'alert-block-title' }, title),
        el('span', { className: 'alert-block-count badge badge-success' }, '0')
      ]),
      el('div', { className: 'alert-block-body' }, [
        el('p', { style: 'color: #6B7280; text-align: center; padding: 20px;' },
          'Aucune alerte active')
      ])
    ]);
  }

  // Grouper par sévérité
  const grouped = groupBySeverity(alerts);
  const displayAlerts = alerts.slice(0, maxAlerts);

  const alertItems = displayAlerts.map(alert => createAlertItem(alert, onAlertClick));

  return el('div', { className: 'alert-block' }, [
    el('div', { className: 'alert-block-header' }, [
      el('h3', { className: 'alert-block-title' }, title),
      el('span', { className: `alert-block-count badge badge-${getBadgeType(alerts)}` },
        String(alerts.length))
    ]),
    el('div', { className: 'alert-block-summary' }, [
      el('div', { className: 'alert-summary-item alert-summary-critique' }, [
        el('span', { className: 'alert-summary-icon' }, '🔴'),
        el('span', { className: 'alert-summary-label' }, 'Critique'),
        el('span', { className: 'alert-summary-count' }, String(grouped.CRITIQUE || 0))
      ]),
      el('div', { className: 'alert-summary-item alert-summary-moyen' }, [
        el('span', { className: 'alert-summary-icon' }, '🟠'),
        el('span', { className: 'alert-summary-label' }, 'Moyen'),
        el('span', { className: 'alert-summary-count' }, String(grouped.MOYEN || 0))
      ]),
      el('div', { className: 'alert-summary-item alert-summary-faible' }, [
        el('span', { className: 'alert-summary-icon' }, '🟡'),
        el('span', { className: 'alert-summary-label' }, 'Faible'),
        el('span', { className: 'alert-summary-count' }, String(grouped.FAIBLE || 0))
      ])
    ]),
    el('div', { className: 'alert-block-body' }, alertItems),
    alerts.length > maxAlerts ? el('div', { className: 'alert-block-footer' }, [
      el('button', {
        className: 'btn btn-sm btn-secondary',
        onclick: () => {
          if (options.onShowAll) options.onShowAll();
        }
      }, `Voir toutes les alertes (${alerts.length})`)
    ]) : null
  ].filter(Boolean));
}

/**
 * Créer un item d'alerte
 */
function createAlertItem(alert, onAlertClick) {
  const icon = getAlertIcon(alert.severity || alert.type);
  const typeClass = `alert-item-${alert.type || 'info'}`;
  const severityClass = `alert-severity-${(alert.severity || 'FAIBLE').toLowerCase()}`;

  return el('div', {
    className: `alert-item ${typeClass} ${severityClass}`,
    onclick: onAlertClick ? () => onAlertClick(alert) : null,
    style: onAlertClick ? 'cursor: pointer;' : ''
  }, [
    el('div', { className: 'alert-item-icon' }, icon),
    el('div', { className: 'alert-item-content' }, [
      el('div', { className: 'alert-item-category' }, getCategoryLabel(alert.category)),
      el('div', { className: 'alert-item-message' }, alert.message)
    ]),
    onAlertClick ? el('div', { className: 'alert-item-action' }, '→') : null
  ].filter(Boolean));
}

/**
 * Grouper les alertes par sévérité
 */
function groupBySeverity(alerts) {
  const groups = {};
  alerts.forEach(alert => {
    const severity = alert.severity || 'FAIBLE';
    groups[severity] = (groups[severity] || 0) + 1;
  });
  return groups;
}

/**
 * Obtenir l'icône selon la sévérité/type
 */
function getAlertIcon(severityOrType) {
  const icons = {
    'CRITIQUE': '⛔',
    'error': '⛔',
    'MOYEN': '⚠️',
    'warning': '⚠️',
    'FAIBLE': 'ℹ️',
    'info': 'ℹ️',
    'success': '✅'
  };
  return icons[severityOrType] || 'ℹ️';
}

/**
 * Obtenir le label de catégorie
 */
function getCategoryLabel(category) {
  const labels = {
    'AVENANT_ALERTE': 'Avenant - Alerte',
    'AVENANT_DEPASSEMENT': 'Avenant - Dépassement',
    'OS_RETARD': 'Ordre de Service',
    'ANO_ATTENTE': 'ANO en attente',
    'GARANTIE_ECHEANCE': 'Garantie',
    'DELAI_EXECUTION': 'Délai d\'exécution'
  };
  return labels[category] || category;
}

/**
 * Obtenir le type de badge selon les alertes
 */
function getBadgeType(alerts) {
  const hasCritique = alerts.some(a => a.severity === 'CRITIQUE' || a.type === 'error');
  const hasMoyen = alerts.some(a => a.severity === 'MOYEN' || a.type === 'warning');

  if (hasCritique) return 'error';
  if (hasMoyen) return 'warning';
  return 'info';
}

/**
 * Widget d'alerte simple (pour une seule alerte)
 * @param {Object} alert - Alerte
 * @param {Object} options - Options
 * @returns {HTMLElement}
 */
export function singleAlert(alert, options = {}) {
  const { dismissible = false, onDismiss = null } = options;

  const typeClass = `alert-${alert.type || 'info'}`;

  return el('div', { className: `alert ${typeClass}` }, [
    el('div', { className: 'alert-icon' }, getAlertIcon(alert.severity || alert.type)),
    el('div', { className: 'alert-content' }, [
      alert.title ? el('div', { className: 'alert-title' }, alert.title) : null,
      el('div', { className: 'alert-message' }, alert.message)
    ].filter(Boolean)),
    dismissible ? el('button', {
      className: 'alert-dismiss',
      onclick: onDismiss || (() => {}),
      innerHTML: '&times;'
    }) : null
  ].filter(Boolean));
}

export default { alertBlock, singleAlert };
