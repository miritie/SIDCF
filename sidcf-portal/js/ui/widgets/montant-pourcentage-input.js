/**
 * Widget réutilisable : saisie d'un montant avec toggle %/XOF
 *
 * L'utilisateur peut choisir de saisir soit :
 *  - Un montant absolu (XOF) → le pourcentage est dérivé
 *  - Un pourcentage (%)      → le montant est dérivé du `total`
 *
 * Le toggle est local au champ (chaque ligne d'un tableau peut être en mode différent).
 *
 * Stockage côté caller : c'est toujours le **montant absolu** qui est passé à `onChange`,
 * + le `mode` saisi par l'utilisateur (utile pour réafficher la bonne UI à l'édition).
 *
 * Utilisation :
 *   const input = renderMontantPourcentageInput({
 *     id: 'mon-input',
 *     total: 100_000_000,        // base pour conversion %
 *     value: 25_000_000,          // montant initial (en XOF)
 *     mode: 'POURCENTAGE',        // 'MONTANT' (défaut) | 'POURCENTAGE'
 *     onChange: (montant, mode) => { ... }
 *   });
 */

import { el } from '../../lib/dom.js';

/**
 * @param {Object} opts
 * @param {string} [opts.id]            Identifiant DOM optionnel
 * @param {number} opts.total           Montant de référence (pour conversion %). 0 = % désactivé.
 * @param {number} [opts.value=0]       Montant initial en XOF
 * @param {string} [opts.mode='MONTANT'] Mode initial : 'MONTANT' ou 'POURCENTAGE'
 * @param {Function} [opts.onChange]    onChange(montantXOF: number, mode: string)
 * @param {boolean} [opts.required]
 * @param {boolean} [opts.disabled]
 * @returns {HTMLElement}
 */
export function renderMontantPourcentageInput({
  id,
  total = 0,
  value = 0,
  mode = 'MONTANT',
  onChange,
  required = false,
  disabled = false
} = {}) {
  let currentMode = (mode === 'POURCENTAGE') ? 'POURCENTAGE' : 'MONTANT';
  let currentMontant = Number(value) || 0;
  const totalRef = Number(total) || 0;

  const wrapper = el('div', {
    className: 'montant-pourcentage-input',
    style: { display: 'flex', gap: '4px', alignItems: 'stretch' }
  });

  const input = el('input', {
    type: 'number',
    className: 'form-input',
    id: id || undefined,
    step: '0.01',
    min: '0',
    required: !!required,
    disabled: !!disabled,
    style: { flex: '1', minWidth: '0' }
  });

  // Sélecteur de mode : segment %  / XOF
  const modeSelector = el('div', {
    className: 'mp-mode-selector',
    style: {
      display: 'flex',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      overflow: 'hidden',
      fontSize: '12px'
    }
  });

  function makeBtn(value, label) {
    const btn = el('button', {
      type: 'button',
      'data-mode': value,
      style: {
        padding: '0 10px',
        background: currentMode === value ? '#0f5132' : '#fff',
        color: currentMode === value ? '#fff' : '#374151',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: currentMode === value ? 'bold' : 'normal'
      }
    }, label);
    btn.addEventListener('click', () => {
      if (disabled) return;
      switchMode(value);
    });
    return btn;
  }
  const btnXof = makeBtn('MONTANT', 'XOF');
  const btnPct = makeBtn('POURCENTAGE', '%');
  modeSelector.appendChild(btnXof);
  modeSelector.appendChild(btnPct);

  function refreshButtons() {
    [btnXof, btnPct].forEach(btn => {
      const isActive = btn.getAttribute('data-mode') === currentMode;
      btn.style.background = isActive ? '#0f5132' : '#fff';
      btn.style.color = isActive ? '#fff' : '#374151';
      btn.style.fontWeight = isActive ? 'bold' : 'normal';
    });
  }

  function syncInputDisplay() {
    if (currentMode === 'POURCENTAGE') {
      const pct = totalRef > 0 ? (currentMontant / totalRef) * 100 : 0;
      input.value = Number(pct.toFixed(4)).toString();
      input.placeholder = '%';
      input.title = totalRef > 0
        ? `Saisie en % du total ${totalRef.toLocaleString()} XOF`
        : '⚠️ Total de référence non défini — % sera 0';
    } else {
      input.value = currentMontant ? Number(currentMontant.toFixed(2)).toString() : '';
      input.placeholder = 'Montant XOF';
      input.title = 'Saisie en XOF';
    }
  }

  function switchMode(newMode) {
    if (newMode === currentMode) return;
    currentMode = newMode;
    refreshButtons();
    syncInputDisplay();
    // Pas d'appel onChange : on ne change que la représentation, le montant reste identique
  }

  // Si le total n'est pas défini, désactiver le mode % (sinon le calcul sera 0)
  if (totalRef <= 0) {
    btnPct.disabled = true;
    btnPct.title = 'Total de référence non défini — saisie en % indisponible';
    btnPct.style.opacity = '0.4';
    btnPct.style.cursor = 'not-allowed';
    if (currentMode === 'POURCENTAGE') {
      currentMode = 'MONTANT';
      refreshButtons();
    }
  }

  syncInputDisplay();

  input.addEventListener('input', () => {
    const raw = parseFloat(input.value) || 0;
    if (currentMode === 'POURCENTAGE') {
      currentMontant = totalRef > 0 ? (raw / 100) * totalRef : 0;
    } else {
      currentMontant = raw;
    }
    if (onChange) onChange(currentMontant, currentMode);
  });

  wrapper.appendChild(input);
  wrapper.appendChild(modeSelector);

  // Petit helper d'affichage du montant équivalent (sous le champ)
  const equivalent = el('small', {
    style: { display: 'block', color: '#6b7280', fontSize: '11px', marginTop: '4px' }
  }, '');
  function refreshEquivalent() {
    if (currentMode === 'POURCENTAGE') {
      equivalent.textContent = `≈ ${currentMontant.toLocaleString(undefined, { maximumFractionDigits: 2 })} XOF`;
    } else if (totalRef > 0) {
      const pct = (currentMontant / totalRef) * 100;
      equivalent.textContent = `≈ ${pct.toFixed(2)}% du total`;
    } else {
      equivalent.textContent = '';
    }
  }
  refreshEquivalent();
  input.addEventListener('input', refreshEquivalent);
  [btnXof, btnPct].forEach(b => b.addEventListener('click', refreshEquivalent));

  // API publique sur le DOM
  const container = el('div', {}, [wrapper, equivalent]);
  container._mpInput = {
    getMontant: () => currentMontant,
    getMode: () => currentMode,
    setTotal: (newTotal) => {
      const t = Number(newTotal) || 0;
      Object.defineProperty(container._mpInput, '_total', { value: t, configurable: true });
      // recalcul si mode pourcentage : on garde le pourcentage saisi
      // Note : ici on conserve le montant absolu, le pourcentage affiché changera
      btnPct.disabled = t <= 0;
      btnPct.style.opacity = t <= 0 ? '0.4' : '1';
      syncInputDisplay();
      refreshEquivalent();
    },
    setMontant: (m) => {
      currentMontant = Number(m) || 0;
      syncInputDisplay();
      refreshEquivalent();
    }
  };

  return container;
}

export default { renderMontantPourcentageInput };
