/* ============================================
   Table Widget
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Create data table
 * @param {Array} columns - [{key, label, render?}]
 * @param {Array} data - Array of objects
 * @param {Object} options - {onRowClick?, actions?}
 */
export function dataTable(columns, data, options = {}) {
  const { onRowClick = null, actions = null } = options;

  // Build header
  const headers = columns.map(col =>
    el('th', {}, col.label)
  );

  if (actions) {
    headers.push(el('th', {}, 'Actions'));
  }

  const thead = el('thead', {}, [
    el('tr', {}, headers)
  ]);

  // Build rows
  const rows = data.map((row, index) => {
    const cells = columns.map(col => {
      const value = row[col.key];
      const content = col.render ? col.render(value, row) : value;

      return el('td', {}, typeof content === 'string' ? [content] : [content]);
    });

    // Add actions cell
    if (actions) {
      const actionButtons = actions.map(action =>
        el('button', {
          className: `btn btn-sm ${action.className || 'btn-secondary'}`,
          onclick: (e) => {
            e.stopPropagation();
            action.onClick(row);
          }
        }, action.label)
      );

      cells.push(
        el('td', {}, [
          el('div', { className: 'table-actions' }, actionButtons)
        ])
      );
    }

    const rowEl = el('tr', {}, cells);

    if (onRowClick) {
      rowEl.style.cursor = 'pointer';
      rowEl.addEventListener('click', () => onRowClick(row));
    }

    return rowEl;
  });

  const tbody = el('tbody', {}, rows);

  // Build table
  const table = el('table', { className: 'table' }, [thead, tbody]);

  return el('div', { className: 'table-container' }, [table]);
}

/**
 * Create empty state for table
 */
export function emptyState(message = 'Aucune donnée disponible', actionLabel = null, onAction = null) {
  const children = [
    el('div', { className: 'empty-state-icon' }, '📭'),
    el('h3', { className: 'empty-state-title' }, 'Aucun résultat'),
    el('p', { className: 'empty-state-message' }, message)
  ];

  if (actionLabel && onAction) {
    children.push(
      el('button', {
        className: 'btn btn-primary',
        onclick: onAction
      }, actionLabel)
    );
  }

  return el('div', { className: 'empty-state' }, children);
}

export default { dataTable, emptyState };
