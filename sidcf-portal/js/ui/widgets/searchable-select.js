/* ============================================
   Searchable Select — combobox filtrable
   ============================================
   Champ de saisie + panneau déroulant filtrable.
   Recherche intelligente : match sur label, secondary, value.
   Crée un <input type="hidden" id={cfg.id}> qui porte le code (utilisable
   par le code formulaire existant via getElementById(cfg.id).value).
*/

/**
 * @param {HTMLElement} container
 * @param {Object} cfg
 * @param {string}   cfg.id           - id de l'input hidden qui porte la valeur/code
 * @param {string}   [cfg.placeholder]
 * @param {boolean}  [cfg.required]
 * @param {Array<{value:string, label:string, secondary?:string, group?:string}>} cfg.options
 * @param {(value:string, item:object|null) => void} [cfg.onChange]
 *
 * @returns {{ setValue:(v:string)=>void, reset:()=>void, getValue:()=>string }}
 */
export function renderSearchableSelect(container, cfg) {
  const wrap = document.createElement('div');
  wrap.className = 'searchable-select';
  Object.assign(wrap.style, { position: 'relative' });

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input';
  input.placeholder = cfg.placeholder || 'Rechercher...';
  input.autocomplete = 'off';
  input.spellcheck = false;
  if (cfg.required) input.required = true;
  Object.assign(input.style, { paddingRight: '28px' });
  wrap.appendChild(input);

  // Hidden input — porte le code, lisible par getElementById(id).value
  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.id = cfg.id;
  hidden.name = cfg.id;
  wrap.appendChild(hidden);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = '✕';
  clearBtn.title = 'Effacer';
  Object.assign(clearBtn.style, {
    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', cursor: 'pointer', display: 'none',
    fontSize: '14px', color: '#6b7280', padding: '2px 4px', lineHeight: '1'
  });
  wrap.appendChild(clearBtn);

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'absolute', top: '100%', left: '0', right: '0',
    background: 'white', border: '1px solid #d1d5db', borderTop: 'none',
    borderRadius: '0 0 6px 6px', maxHeight: '320px', overflowY: 'auto',
    zIndex: '50', display: 'none',
    boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
  });
  wrap.appendChild(panel);

  let activeIndex = -1;
  let filteredOptions = [];
  let lastSelectedLabel = '';

  const matches = (opt, q) => {
    if (!q) return true;
    const fields = [opt.label, opt.secondary, opt.value, opt.group].filter(Boolean);
    return fields.some(f => String(f).toLowerCase().includes(q));
  };

  const renderPanel = (query) => {
    panel.innerHTML = '';
    const q = (query || '').toLowerCase().trim();
    filteredOptions = (cfg.options || []).filter(o => matches(o, q));

    if (filteredOptions.length === 0) {
      const empty = document.createElement('div');
      Object.assign(empty.style, { padding: '12px', color: '#888', fontSize: '13px' });
      empty.textContent = 'Aucun résultat';
      panel.appendChild(empty);
      return;
    }

    let lastGroup = null;
    filteredOptions.forEach((opt, i) => {
      if (opt.group && opt.group !== lastGroup) {
        const header = document.createElement('div');
        Object.assign(header.style, {
          padding: '6px 12px', fontSize: '11px', color: '#6b7280',
          background: '#f9fafb', textTransform: 'uppercase', letterSpacing: '0.05em',
          fontWeight: '600', borderBottom: '1px solid #e5e7eb'
        });
        header.textContent = opt.group;
        panel.appendChild(header);
        lastGroup = opt.group;
      }

      const row = document.createElement('div');
      row.className = 'searchable-option';
      row.dataset.index = i;
      Object.assign(row.style, {
        padding: '8px 12px', cursor: 'pointer',
        borderBottom: '1px solid #f3f4f6'
      });

      const main = document.createElement('div');
      main.textContent = opt.label;
      Object.assign(main.style, { fontWeight: '500', fontSize: '14px', color: '#111827' });
      row.appendChild(main);

      if (opt.secondary) {
        const sub = document.createElement('div');
        sub.textContent = opt.secondary;
        Object.assign(sub.style, { fontSize: '12px', color: '#6b7280', marginTop: '2px' });
        row.appendChild(sub);
      }

      row.addEventListener('mousedown', (e) => {
        e.preventDefault(); // évite blur avant click
        select(opt);
      });
      row.addEventListener('mouseenter', () => { activeIndex = i; highlightActive(); });
      panel.appendChild(row);
    });
  };

  const highlightActive = () => {
    panel.querySelectorAll('.searchable-option').forEach((row) => {
      const idx = Number(row.dataset.index);
      row.style.background = idx === activeIndex ? '#eff6ff' : 'white';
    });
  };

  const open = () => {
    renderPanel(input.value === lastSelectedLabel ? '' : input.value);
    panel.style.display = 'block';
    activeIndex = -1;
  };
  const close = () => { panel.style.display = 'none'; };

  const select = (opt) => {
    input.value = opt.label;
    hidden.value = opt.value;
    hidden.dataset.label = opt.label;
    if (opt.secondary) hidden.dataset.secondary = opt.secondary;
    lastSelectedLabel = opt.label;
    clearBtn.style.display = 'block';
    close();
    if (cfg.onChange) cfg.onChange(opt.value, opt);
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const clear = () => {
    input.value = '';
    hidden.value = '';
    delete hidden.dataset.label;
    delete hidden.dataset.secondary;
    lastSelectedLabel = '';
    clearBtn.style.display = 'none';
    if (cfg.onChange) cfg.onChange('', null);
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // Events
  input.addEventListener('focus', open);
  input.addEventListener('input', () => {
    if (input.value !== lastSelectedLabel) {
      hidden.value = '';
      delete hidden.dataset.label;
      clearBtn.style.display = input.value ? 'block' : 'none';
    }
    renderPanel(input.value);
    activeIndex = -1;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (panel.style.display === 'none') open();
      activeIndex = Math.min(activeIndex + 1, filteredOptions.length - 1);
      highlightActive();
      const row = panel.querySelector(`.searchable-option[data-index="${activeIndex}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlightActive();
      const row = panel.querySelector(`.searchable-option[data-index="${activeIndex}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && filteredOptions[activeIndex]) {
        e.preventDefault();
        select(filteredOptions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      close();
      input.blur();
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      close();
      if (input.value !== lastSelectedLabel) {
        if (lastSelectedLabel) {
          input.value = lastSelectedLabel;
        } else {
          input.value = '';
          clearBtn.style.display = 'none';
        }
      }
    }, 150);
  });
  clearBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    clear();
    input.focus();
  });

  container.appendChild(wrap);

  return {
    setValue: (value) => {
      const opt = (cfg.options || []).find(o => o.value === value);
      if (opt) select(opt);
      else clear();
    },
    reset: clear,
    getValue: () => hidden.value
  };
}

export default renderSearchableSelect;
