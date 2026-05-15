/**
 * Widget de saisie dual : Montant (XOF) + Pourcentage (%) — synchronisés bidirectionnellement.
 *
 * Deux champs visibles en permanence, empilés verticalement.
 * Éditer l'un met à jour l'autre.
 *
 * `total` = montant de référence sur lequel les % sont évalués (montant marché HT ou TTC selon
 * la base de calcul choisie par le caller). Si `total` <= 0, le champ % est désactivé.
 *
 * Stockage côté caller : c'est le **montant absolu** (XOF) qui est passé à `onChange`.
 * Le mode dernier touché (`saisieMode`) est aussi remonté pour que le caller puisse mémoriser
 * la préférence utilisateur (utile à l'édition future, non bloquant).
 *
 * API publique exposée via `container._mpDual` :
 *   - getMontant() → montant absolu en XOF
 *   - getMode()    → 'MONTANT' ou 'POURCENTAGE' (dernier champ saisi)
 *   - setTotal(t)  → change la base ; conserve le pourcentage saisi et recalcule le montant
 *                    (cohérent avec le cas d'usage : l'utilisateur change HT↔TTC dans le sélecteur)
 *   - setMontant(m) → force la valeur (utile en édition)
 *
 * Usage :
 *   const w = renderMontantPourcentageDualInput({
 *     total: 472_000_000,
 *     value: 12_500_000,
 *     mode: 'MONTANT',
 *     onChange: (montant, mode) => { ... }
 *   });
 *   host.appendChild(w);
 */

import { el } from '../../lib/dom.js';

/**
 * @param {Object} opts
 * @param {string} [opts.idPrefix]      Préfixe DOM pour les deux inputs (optionnel)
 * @param {number} opts.total           Montant de référence (HT ou TTC du marché)
 * @param {number} [opts.value=0]       Montant initial en XOF
 * @param {string} [opts.mode='MONTANT'] Mode initial mémorisé ('MONTANT' ou 'POURCENTAGE')
 * @param {Function} [opts.onChange]    onChange(montantXOF, mode)
 * @param {boolean} [opts.required]
 * @param {boolean} [opts.disabled]
 * @param {boolean} [opts.allowNegative] Autorise les montants/pourcentages négatifs (avenants en diminution)
 * @returns {HTMLElement}
 */
export function renderMontantPourcentageDualInput({
  idPrefix,
  total = 0,
  value = 0,
  mode = 'MONTANT',
  onChange,
  required = false,
  disabled = false,
  allowNegative = false
} = {}) {
  let currentMode = (mode === 'POURCENTAGE') ? 'POURCENTAGE' : 'MONTANT';
  let currentMontant = Number(value) || 0;
  let totalRef = Number(total) || 0;

  const idMontant = idPrefix ? `${idPrefix}-montant` : undefined;
  const idPct = idPrefix ? `${idPrefix}-pct` : undefined;

  const container = el('div', {
    className: 'montant-pourcentage-dual',
    style: { display: 'flex', flexDirection: 'column', gap: '8px' }
  });

  // --- Champ Montant (XOF) ---
  const montantBlock = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } });
  const montantRow = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } });
  const montantInputAttrs = {
    type: 'number',
    id: idMontant,
    className: 'form-input',
    step: '0.01',
    required: !!required,
    placeholder: 'Montant XOF',
    // Modif #33 : pas de pointer-events désactivé, pas de readonly. On garde la saisie libre.
    autocomplete: 'off',
    style: { flex: '1', minWidth: '0' }
  };
  if (disabled) montantInputAttrs.disabled = true;
  if (!allowNegative) montantInputAttrs.min = '0';
  const montantInput = el('input', montantInputAttrs);
  const montantSuffix = el('span', {
    style: { fontSize: '12px', color: '#6b7280', minWidth: '32px' }
  }, 'XOF');
  montantRow.appendChild(montantInput);
  montantRow.appendChild(montantSuffix);
  const montantHelper = el('small', {
    style: { display: 'block', color: '#6b7280', fontSize: '11px' }
  }, '');
  montantBlock.appendChild(montantRow);
  montantBlock.appendChild(montantHelper);

  // --- Champ Pourcentage (%) ---
  const pctBlock = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } });
  const pctRow = el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } });
  const pctInputAttrs = {
    type: 'number',
    id: idPct,
    className: 'form-input',
    step: '0.0001',
    placeholder: 'Pourcentage',
    autocomplete: 'off',
    style: { flex: '1', minWidth: '0' }
  };
  // Modif #33 : ne plus désactiver le % quand totalRef <= 0. Le caller doit fixer
  // la base correctement ; en attendant, on laisse la saisie libre (le calcul du
  // montant sera juste 0 si la base est nulle — mais ça ne doit pas bloquer le user).
  if (disabled) pctInputAttrs.disabled = true;
  if (!allowNegative) pctInputAttrs.min = '0';
  const pctInput = el('input', pctInputAttrs);
  const pctSuffix = el('span', {
    style: { fontSize: '12px', color: '#6b7280', minWidth: '32px' }
  }, '%');
  pctRow.appendChild(pctInput);
  pctRow.appendChild(pctSuffix);
  const pctHelper = el('small', {
    style: { display: 'block', color: '#6b7280', fontSize: '11px' }
  }, '');
  pctBlock.appendChild(pctRow);
  pctBlock.appendChild(pctHelper);

  container.appendChild(montantBlock);
  container.appendChild(pctBlock);

  function formatMontant(n) {
    return Number(n.toFixed(2)).toString();
  }
  function formatPct(n) {
    return Number(n.toFixed(4)).toString();
  }

  function refreshDisplay() {
    // Modif #33 : ne pas écraser les champs si l'utilisateur a le focus dessus
    // (cas typique : on tape dans Montant, un setTotal externe se déclenche → on
    // ne doit pas effacer la saisie en cours).
    const activeEl = document.activeElement;
    const editingMontant = activeEl === montantInput;
    const editingPct = activeEl === pctInput;

    if (!editingMontant) {
      montantInput.value = currentMontant ? formatMontant(currentMontant) : '';
    }
    if (totalRef > 0) {
      const pct = (currentMontant / totalRef) * 100;
      if (!editingPct) {
        pctInput.value = currentMontant ? formatPct(pct) : '';
      }
      pctHelper.textContent = `≈ ${currentMontant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} XOF`;
      montantHelper.textContent = `≈ ${pct.toFixed(2)}% de ${totalRef.toLocaleString('fr-FR')} XOF`;
    } else {
      if (!editingPct) pctInput.value = '';
      pctHelper.textContent = 'Base non définie — saisissez via le sélecteur HT/TTC';
      montantHelper.textContent = '';
    }
  }

  refreshDisplay();

  montantInput.addEventListener('input', () => {
    currentMontant = parseFloat(montantInput.value) || 0;
    currentMode = 'MONTANT';
    // Mise à jour du % dérivé
    if (totalRef > 0) {
      const pct = (currentMontant / totalRef) * 100;
      pctInput.value = currentMontant ? formatPct(pct) : '';
      pctHelper.textContent = `≈ ${currentMontant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} XOF`;
      montantHelper.textContent = `≈ ${pct.toFixed(2)}% de ${totalRef.toLocaleString('fr-FR')} XOF`;
    } else {
      pctHelper.textContent = 'Base non définie';
      montantHelper.textContent = '';
    }
    if (onChange) onChange(currentMontant, currentMode);
  });

  pctInput.addEventListener('input', () => {
    const pct = parseFloat(pctInput.value) || 0;
    currentMontant = totalRef > 0 ? (pct / 100) * totalRef : 0;
    currentMode = 'POURCENTAGE';
    montantInput.value = currentMontant ? formatMontant(currentMontant) : '';
    pctHelper.textContent = currentMontant
      ? `≈ ${currentMontant.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} XOF`
      : '';
    montantHelper.textContent = totalRef > 0
      ? `≈ ${pct.toFixed(2)}% de ${totalRef.toLocaleString('fr-FR')} XOF`
      : '';
    if (onChange) onChange(currentMontant, currentMode);
  });

  // API publique
  container._mpDual = {
    getMontant: () => currentMontant,
    getMode: () => currentMode,
    setTotal: (newTotal) => {
      totalRef = Number(newTotal) || 0;
      // En changeant la base, si le dernier mode saisi est POURCENTAGE on conserve le %
      // (donc on recalcule le montant) ; sinon on conserve le montant (le % se recalcule).
      if (currentMode === 'POURCENTAGE') {
        const pct = parseFloat(pctInput.value) || 0;
        currentMontant = totalRef > 0 ? (pct / 100) * totalRef : 0;
      }
      refreshDisplay();
      if (onChange) onChange(currentMontant, currentMode);
    },
    setMontant: (m) => {
      currentMontant = Number(m) || 0;
      refreshDisplay();
    }
  };

  return container;
}

export default { renderMontantPourcentageDualInput };
