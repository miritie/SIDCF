/* ============================================
   Livrable Manager (Marché+) — édition inline en cards
   ============================================
   Différences vs livrable-manager.js (Marché) :
   - Édition inline directe (pas de modal)
   - Bouton « Générer N livrables » qui ajoute N cards vides d'un coup
   - Tous les champs sont optionnels (pas de validation bloquante)
   - Mêmes signature `renderLivrableManagerMP(livrables, registries, onChange)`
*/

import { el } from '../../lib/dom.js';
import { uid } from '../../lib/uid.js';

const blankLocalisation = () => ({
  region: '', regionCode: '',
  district: '', districtCode: '',
  commune: '', communeCode: '',
  sousPrefecture: '', sousPrefectureCode: '',
  localite: '', latitude: null, longitude: null, coordsOK: false
});

const blankLivrable = () => ({
  id: uid('LIV'),
  type: '',
  libelle: '',
  localisation: blankLocalisation()
});

function opt(value, text, selected = false) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = text;
  if (selected) o.selected = true;
  return o;
}

function fieldWrap(labelText, control, opts = {}) {
  const wrap = document.createElement('div');
  if (opts.span) wrap.style.gridColumn = `span ${opts.span}`;
  const lbl = document.createElement('label');
  lbl.className = 'form-label';
  lbl.textContent = labelText;
  Object.assign(lbl.style, { fontSize: '12px', marginBottom: '4px' });
  wrap.appendChild(lbl);
  wrap.appendChild(control);
  return wrap;
}

function buildLivrableCard(livrable, index, registries, onUpdate, onRemove) {
  const card = document.createElement('div');
  card.className = 'livrable-card';
  Object.assign(card.style, {
    border: '1px solid #e5e7eb', borderRadius: '8px',
    padding: '12px 14px', marginBottom: '10px', background: 'white'
  });

  // Header
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '10px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '8px'
  });
  const title = document.createElement('strong');
  title.textContent = `Livrable ${index + 1}`;
  title.style.color = '#374151';
  header.appendChild(title);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-sm btn-secondary';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Retirer ce livrable';
  Object.assign(removeBtn.style, { padding: '4px 10px' });
  removeBtn.addEventListener('click', () => onRemove(index));
  header.appendChild(removeBtn);
  card.appendChild(header);

  // Grid
  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '10px'
  });

  // Type
  const typeSelect = document.createElement('select');
  typeSelect.className = 'form-input';
  typeSelect.appendChild(opt('', '-- Sélectionner --'));
  (registries.TYPE_LIVRABLE || []).forEach(t => {
    typeSelect.appendChild(opt(t.code, t.label, t.code === livrable.type));
  });
  typeSelect.addEventListener('change', () => { livrable.type = typeSelect.value; onUpdate(); });
  grid.appendChild(fieldWrap('Type de livrable', typeSelect));

  // Libellé
  const libInput = document.createElement('input');
  libInput.type = 'text';
  libInput.className = 'form-input';
  libInput.placeholder = 'Description du livrable…';
  libInput.value = livrable.libelle || '';
  libInput.addEventListener('input', () => { livrable.libelle = libInput.value; onUpdate(); });
  grid.appendChild(fieldWrap('Libellé / Description', libInput, { span: 2 }));

  // Localisation cascade
  const regionSelect = document.createElement('select');
  regionSelect.className = 'form-input';
  regionSelect.appendChild(opt('', '-- Sélectionner --'));
  (registries.LOCALITE_CI?.regions || []).forEach(r => {
    regionSelect.appendChild(opt(r.code, r.label, r.code === livrable.localisation?.regionCode));
  });
  grid.appendChild(fieldWrap('Région', regionSelect));

  const deptSelect = document.createElement('select');
  deptSelect.className = 'form-input';
  deptSelect.disabled = true;
  deptSelect.appendChild(opt('', '-- Région d\'abord --'));
  grid.appendChild(fieldWrap('Département', deptSelect));

  const spSelect = document.createElement('select');
  spSelect.className = 'form-input';
  spSelect.disabled = true;
  spSelect.appendChild(opt('', '-- Département d\'abord --'));
  grid.appendChild(fieldWrap('Sous-préfecture', spSelect));

  const locSelect = document.createElement('select');
  locSelect.className = 'form-input';
  locSelect.disabled = true;
  locSelect.appendChild(opt('', '-- Sous-préfecture d\'abord --'));
  grid.appendChild(fieldWrap('Localité', locSelect));

  // Lat / Lon
  const latInput = document.createElement('input');
  latInput.type = 'number';
  latInput.className = 'form-input';
  latInput.step = '0.000001';
  latInput.placeholder = 'Ex: 5.33255';
  latInput.value = livrable.localisation?.latitude ?? '';
  grid.appendChild(fieldWrap('Latitude', latInput));

  const lonInput = document.createElement('input');
  lonInput.type = 'number';
  lonInput.className = 'form-input';
  lonInput.step = '0.000001';
  lonInput.placeholder = 'Ex: -4.02290';
  lonInput.value = livrable.localisation?.longitude ?? '';
  grid.appendChild(fieldWrap('Longitude', lonInput));

  card.appendChild(grid);

  const labelOf = (sel) => {
    const o = sel.options[sel.selectedIndex];
    const t = o?.textContent || '';
    return t.startsWith('--') ? '' : t;
  };

  const persistLocalisation = () => {
    livrable.localisation = livrable.localisation || blankLocalisation();
    livrable.localisation.region = labelOf(regionSelect);
    livrable.localisation.regionCode = regionSelect.value;
    livrable.localisation.district = labelOf(deptSelect);
    livrable.localisation.districtCode = deptSelect.value;
    livrable.localisation.sousPrefecture = labelOf(spSelect);
    livrable.localisation.sousPrefectureCode = spSelect.value;
    livrable.localisation.localite = locSelect.value;
    livrable.localisation.latitude = latInput.value ? Number(latInput.value) : null;
    livrable.localisation.longitude = lonInput.value ? Number(lonInput.value) : null;
    livrable.localisation.coordsOK = !!(latInput.value && lonInput.value);
    onUpdate();
  };

  regionSelect.addEventListener('change', () => {
    const code = regionSelect.value;
    deptSelect.innerHTML = '';
    deptSelect.appendChild(opt('', '-- Sélectionner un département --'));
    deptSelect.disabled = !code;
    spSelect.innerHTML = '';
    spSelect.appendChild(opt('', '-- Département d\'abord --'));
    spSelect.disabled = true;
    locSelect.innerHTML = '';
    locSelect.appendChild(opt('', '-- Sous-préfecture d\'abord --'));
    locSelect.disabled = true;
    if (code) {
      const region = (registries.LOCALITE_CI?.regions || []).find(r => r.code === code);
      (region?.departements || []).forEach(d => deptSelect.appendChild(opt(d.code, d.label)));
      deptSelect.disabled = false;
    }
    persistLocalisation();
  });

  deptSelect.addEventListener('change', () => {
    const regionCode = regionSelect.value;
    const code = deptSelect.value;
    spSelect.innerHTML = '';
    spSelect.appendChild(opt('', '-- Sélectionner une sous-préfecture --'));
    spSelect.disabled = !code;
    locSelect.innerHTML = '';
    locSelect.appendChild(opt('', '-- Sous-préfecture d\'abord --'));
    locSelect.disabled = true;
    if (code) {
      const region = (registries.LOCALITE_CI?.regions || []).find(r => r.code === regionCode);
      const dept = (region?.departements || []).find(d => d.code === code);
      (dept?.sousPrefectures || []).forEach(sp => spSelect.appendChild(opt(sp.code, sp.label)));
      spSelect.disabled = false;
    }
    persistLocalisation();
  });

  spSelect.addEventListener('change', () => {
    const regionCode = regionSelect.value;
    const deptCode = deptSelect.value;
    const code = spSelect.value;
    locSelect.innerHTML = '';
    locSelect.appendChild(opt('', '-- Sélectionner une localité --'));
    locSelect.disabled = !code;
    if (code) {
      const region = (registries.LOCALITE_CI?.regions || []).find(r => r.code === regionCode);
      const dept = (region?.departements || []).find(d => d.code === deptCode);
      const sp = (dept?.sousPrefectures || []).find(s => s.code === code);
      (sp?.localites || []).forEach(l => locSelect.appendChild(opt(l, l)));
      locSelect.disabled = false;
    }
    persistLocalisation();
  });

  locSelect.addEventListener('change', persistLocalisation);
  latInput.addEventListener('input', persistLocalisation);
  lonInput.addEventListener('input', persistLocalisation);

  // Pré-population (cas édition d'un livrable déjà rempli)
  if (livrable.localisation?.regionCode) {
    regionSelect.value = livrable.localisation.regionCode;
    regionSelect.dispatchEvent(new Event('change'));
    setTimeout(() => {
      if (livrable.localisation.districtCode) {
        deptSelect.value = livrable.localisation.districtCode;
        deptSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
          if (livrable.localisation.sousPrefectureCode) {
            spSelect.value = livrable.localisation.sousPrefectureCode;
            spSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
              if (livrable.localisation.localite) locSelect.value = livrable.localisation.localite;
            }, 30);
          }
        }, 30);
      }
    }, 30);
  }

  return card;
}

/**
 * @param {Array} livrables
 * @param {Object} registries
 * @param {(livrables:Array) => void} [onChange]
 * @returns {HTMLElement}
 */
export function renderLivrableManagerMP(livrables = [], registries = {}, onChange = null) {
  const container = el('div', { className: 'livrable-manager-mp' });

  // Deep clone pour ne pas muter l'argument
  let currentLivrables = (livrables || []).map(l => ({
    ...l,
    localisation: { ...(l.localisation || blankLocalisation()) }
  }));

  const notify = () => { if (onChange) onChange([...currentLivrables]); };

  const render = () => {
    container.innerHTML = '';

    // Top bar : titre + générer N + ajouter 1
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '14px', flexWrap: 'wrap'
    });

    const titleEl = document.createElement('strong');
    titleEl.textContent = `Livrables (${currentLivrables.length})`;
    titleEl.style.color = '#111827';
    topBar.appendChild(titleEl);

    const filler = document.createElement('div');
    filler.style.flex = '1';
    topBar.appendChild(filler);

    const genLabel = document.createElement('label');
    genLabel.textContent = 'Générer :';
    Object.assign(genLabel.style, { fontSize: '13px', color: '#6b7280' });
    topBar.appendChild(genLabel);

    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.min = '1';
    countInput.max = '100';
    countInput.placeholder = 'N';
    countInput.className = 'form-input';
    Object.assign(countInput.style, { width: '70px', padding: '4px 8px' });
    topBar.appendChild(countInput);

    const genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.className = 'btn btn-sm btn-secondary';
    genBtn.textContent = 'Générer';
    genBtn.title = 'Ajoute N livrables vides à la liste';
    genBtn.addEventListener('click', () => {
      const n = Math.max(0, Math.min(100, Math.floor(Number(countInput.value) || 0)));
      if (n === 0) return;
      for (let i = 0; i < n; i++) currentLivrables.push(blankLivrable());
      notify();
      render();
    });
    topBar.appendChild(genBtn);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-sm btn-accent';
    addBtn.textContent = '+ Ajouter un livrable';
    addBtn.addEventListener('click', () => {
      currentLivrables.push(blankLivrable());
      notify();
      render();
    });
    topBar.appendChild(addBtn);

    container.appendChild(topBar);

    // List
    if (currentLivrables.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'alert alert-info';
      Object.assign(empty.style, { fontSize: '13px', padding: '10px 14px' });
      empty.innerHTML = 'ℹ️ Aucun livrable défini. Saisissez un nombre puis « Générer », ou cliquez sur « + Ajouter un livrable ». Tous les champs sont optionnels.';
      container.appendChild(empty);
      return;
    }

    currentLivrables.forEach((liv, index) => {
      const card = buildLivrableCard(
        liv,
        index,
        registries,
        notify,
        (idx) => {
          currentLivrables.splice(idx, 1);
          notify();
          render();
        }
      );
      container.appendChild(card);
    });
  };

  render();
  return container;
}

export default renderLivrableManagerMP;
