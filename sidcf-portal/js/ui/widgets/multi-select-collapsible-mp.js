/* ============================================
   Multi-select Collapsible (Marché+) — filtre compact
   ============================================
   Affiche un bouton compact (label + compteur de sélections + flèche)
   qui ouvre un panneau avec :
     - recherche intégrée
     - cases à cocher pour chacune des options
     - boutons « Tout » / « Vider » / « Fermer »
   Le panneau se ferme automatiquement au clic en dehors, sur Escape,
   ou via le bouton Fermer.

   API : renderMultiSelectCollapsible({ id, label, options, selected, onChange })
   - options : [{ code: string, label: string }]
   - selected : string[] (codes cochés)
   - onChange(newSelected) appelé à chaque modification de sélection
   - Retourne un HTMLElement à insérer dans la page.
*/

import { el } from '../../lib/dom.js';

let _activePanel = null;        // panneau actuellement ouvert (un seul à la fois)
let _outsideHandler = null;     // listener global pour fermer au clic dehors
let _escapeHandler = null;      // listener pour Esc

function closeActive() {
  if (_activePanel) {
    _activePanel.style.display = 'none';
    _activePanel = null;
  }
  if (_outsideHandler) {
    document.removeEventListener('mousedown', _outsideHandler, true);
    _outsideHandler = null;
  }
  if (_escapeHandler) {
    document.removeEventListener('keydown', _escapeHandler, true);
    _escapeHandler = null;
  }
}

export function renderMultiSelectCollapsible(cfg = {}) {
  const {
    id = '',
    label = 'Filtre',
    options = [],
    selected = [],
    onChange = null,
    placeholder = '— Aucune sélection —'
  } = cfg;

  let currentSelected = [...selected];
  const totalOptions = options.length;

  const wrap = document.createElement('div');
  wrap.className = 'mp-ms-collapsible';
  Object.assign(wrap.style, { position: 'relative', minWidth: '0' });

  // -- Toggle button --
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'form-input mp-ms-toggle';
  Object.assign(toggle.style, {
    width: '100%', textAlign: 'left', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    gap: '8px', cursor: 'pointer', padding: '8px 10px',
    background: 'white', borderRadius: '6px',
    border: '1px solid #d1d5db', minWidth: '0'
  });

  const renderToggleContent = () => {
    toggle.innerHTML = '';
    const left = document.createElement('span');
    Object.assign(left.style, { display: 'flex', alignItems: 'center', gap: '6px', minWidth: '0', flex: '1' });

    const lblSpan = document.createElement('span');
    lblSpan.textContent = label;
    Object.assign(lblSpan.style, {
      fontWeight: '500', color: '#374151', fontSize: '13px',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
    });
    left.appendChild(lblSpan);

    if (currentSelected.length > 0) {
      const badge = document.createElement('span');
      badge.textContent = String(currentSelected.length);
      Object.assign(badge.style, {
        background: '#0f5132', color: 'white', fontSize: '11px',
        fontWeight: '700', padding: '1px 7px', borderRadius: '10px'
      });
      left.appendChild(badge);

      const summary = document.createElement('span');
      const labels = currentSelected
        .map(code => options.find(o => o.code === code)?.label || code)
        .slice(0, 2)
        .join(', ');
      const suffix = currentSelected.length > 2 ? `, +${currentSelected.length - 2}` : '';
      summary.textContent = ` (${labels}${suffix})`;
      Object.assign(summary.style, {
        fontSize: '11px', color: '#6b7280',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        flex: '1', minWidth: '0'
      });
      left.appendChild(summary);
    } else {
      const ph = document.createElement('span');
      ph.textContent = placeholder;
      Object.assign(ph.style, { fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' });
      left.appendChild(ph);
    }

    const arrow = document.createElement('span');
    arrow.textContent = '▾';
    Object.assign(arrow.style, { fontSize: '11px', color: '#6b7280', flexShrink: '0' });

    toggle.appendChild(left);
    toggle.appendChild(arrow);
  };
  renderToggleContent();
  wrap.appendChild(toggle);

  // -- Popover panel --
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'absolute', top: 'calc(100% + 4px)', left: '0', right: '0',
    background: 'white', border: '1px solid #d1d5db', borderRadius: '6px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: '9999',
    display: 'none', maxHeight: '360px',
    overflow: 'hidden', flexDirection: 'column'
  });

  // Search bar
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-input';
  searchInput.placeholder = `Rechercher ${label.toLowerCase()}…`;
  Object.assign(searchInput.style, {
    fontSize: '13px', padding: '6px 10px', margin: '8px',
    border: '1px solid #e5e7eb', borderRadius: '4px'
  });
  panel.appendChild(searchInput);

  // Scrollable options list
  const list = document.createElement('div');
  Object.assign(list.style, {
    overflowY: 'auto', maxHeight: '230px', padding: '4px 8px', flex: '1'
  });
  panel.appendChild(list);

  const renderList = (query = '') => {
    list.innerHTML = '';
    const q = (query || '').toLowerCase().trim();
    const filtered = options.filter(o =>
      !q ||
      (o.label || '').toLowerCase().includes(q) ||
      (o.code || '').toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'Aucun résultat';
      Object.assign(empty.style, { padding: '12px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' });
      list.appendChild(empty);
      return;
    }

    filtered.forEach(opt => {
      const row = document.createElement('label');
      row.className = 'mp-ms-row';
      Object.assign(row.style, {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '5px 6px', cursor: 'pointer', borderRadius: '4px',
        fontSize: '13px', color: '#374151'
      });
      row.addEventListener('mouseenter', () => { row.style.background = '#f3f4f6'; });
      row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = currentSelected.includes(opt.code);
      cb.style.flexShrink = '0';
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!currentSelected.includes(opt.code)) currentSelected.push(opt.code);
        } else {
          currentSelected = currentSelected.filter(c => c !== opt.code);
        }
        renderToggleContent();
        if (onChange) onChange([...currentSelected]);
      });

      const text = document.createElement('span');
      text.textContent = opt.label;
      text.title = opt.label;
      Object.assign(text.style, {
        flex: '1', minWidth: '0',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      });

      row.appendChild(cb);
      row.appendChild(text);
      list.appendChild(row);
    });
  };
  renderList();

  searchInput.addEventListener('input', () => renderList(searchInput.value));

  // Footer actions
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    display: 'flex', gap: '6px', padding: '8px',
    borderTop: '1px solid #e5e7eb', background: '#f9fafb',
    justifyContent: 'space-between', flexShrink: '0'
  });

  const leftActions = document.createElement('div');
  Object.assign(leftActions.style, { display: 'flex', gap: '6px' });

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.textContent = 'Tout';
  allBtn.className = 'btn btn-sm btn-secondary';
  Object.assign(allBtn.style, { fontSize: '11px', padding: '4px 10px' });
  allBtn.addEventListener('click', () => {
    currentSelected = options.map(o => o.code);
    renderList(searchInput.value);
    renderToggleContent();
    if (onChange) onChange([...currentSelected]);
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = 'Vider';
  clearBtn.className = 'btn btn-sm btn-secondary';
  Object.assign(clearBtn.style, { fontSize: '11px', padding: '4px 10px' });
  clearBtn.addEventListener('click', () => {
    currentSelected = [];
    renderList(searchInput.value);
    renderToggleContent();
    if (onChange) onChange([...currentSelected]);
  });

  leftActions.appendChild(allBtn);
  leftActions.appendChild(clearBtn);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Fermer';
  closeBtn.className = 'btn btn-sm btn-primary';
  Object.assign(closeBtn.style, { fontSize: '11px', padding: '4px 12px' });
  closeBtn.addEventListener('click', closeActive);

  footer.appendChild(leftActions);
  footer.appendChild(closeBtn);
  panel.appendChild(footer);
  wrap.appendChild(panel);

  // -- Open/close logic --
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = _activePanel === panel;
    closeActive();
    if (!wasOpen) {
      panel.style.display = 'flex';
      _activePanel = panel;
      searchInput.value = '';
      renderList('');
      // Focus search shortly after to avoid stealing focus during click
      setTimeout(() => searchInput.focus(), 50);

      _outsideHandler = (ev) => {
        if (!wrap.contains(ev.target)) closeActive();
      };
      document.addEventListener('mousedown', _outsideHandler, true);

      _escapeHandler = (ev) => {
        if (ev.key === 'Escape') closeActive();
      };
      document.addEventListener('keydown', _escapeHandler, true);
    }
  });

  return wrap;
}

export default renderMultiSelectCollapsible;
