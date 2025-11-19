/* ============================================
   Configuration des Étapes - Écran d'administration
   ============================================
   Permet de configurer les libellés et l'ordre des étapes
   pour chaque type de procédure
   ============================================ */

import { mount } from '../lib/dom.js';
import logger from '../lib/logger.js';
import { clearCache } from '../lib/phase-helper.js';
import dataService from '../datastore/data-service.js';

// URL de l'API - récupère depuis la config app-config.json
function getApiBaseUrl() {
  const config = dataService.getConfig();
  if (config?.postgres?.apiUrl) {
    return config.postgres.apiUrl;
  }
  // Fallback pour dev local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  return 'https://sidcf-portal-api.sidcf.workers.dev';
}

const API_BASE_URL = getApiBaseUrl();

const MODES_PASSATION = [
  { code: 'PSD', label: 'Procédure Simplifiée d\'Entente Directe' },
  { code: 'PSC', label: 'Procédure Simplifiée de Cotation' },
  { code: 'PSL', label: 'Procédure Simplifiée à Compétition Limitée' },
  { code: 'PSO', label: 'Procédure Simplifiée à Compétition Ouverte' },
  { code: 'AOO', label: 'Appel d\'Offres Ouvert' },
  { code: 'PI', label: 'Prestations Intellectuelles' }
];

const COLORS = [
  { value: 'blue', label: 'Bleu' },
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Vert' },
  { value: 'yellow', label: 'Jaune' },
  { value: 'purple', label: 'Violet' },
  { value: 'gray', label: 'Gris' },
  { value: 'red', label: 'Rouge' }
];

let currentMode = 'PSD';
let phaseConfigs = [];
let hasUnsavedChanges = false;

/**
 * Render main screen
 */
export default async function renderConfigEtapes() {
  logger.info('[ConfigEtapes] Rendering configuration screen');

  try {
    // Load phase configurations from API
    await loadPhaseConfigs();

    mount('#app', `
      <div class="page">
        <div class="page-header">
          <div>
            <h1>⚙️ Configuration des Étapes</h1>
            <p class="page-subtitle">
              Personnalisez les libellés, icônes et ordre des étapes pour chaque procédure
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" id="btnExport">
              📥 Exporter
            </button>
            <button class="btn btn-primary" id="btnSaveAll">
              💾 Enregistrer tout
            </button>
          </div>
        </div>

        <!-- Mode selector -->
        <div class="card">
          <div class="form-group">
            <label>Type de procédure</label>
            <select id="selectMode" class="form-control">
              ${MODES_PASSATION.map(m => `
                <option value="${m.code}" ${m.code === currentMode ? 'selected' : ''}>
                  ${m.code} - ${m.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Phases list -->
        <div id="phasesList"></div>

        <!-- Add phase button -->
        <div class="card-footer">
          <button class="btn btn-secondary" id="btnAddPhase">
            ➕ Ajouter une étape
          </button>
        </div>

        <!-- Status indicator -->
        <div id="statusIndicator" style="display: none; padding: 8px; margin-top: 16px; border-radius: 4px;"></div>
      </div>
    `);

    // Render phases for current mode
    renderPhases();

    // Event listeners
    document.getElementById('selectMode').addEventListener('change', (e) => {
      currentMode = e.target.value;
      renderPhases();
    });

    document.getElementById('btnSaveAll').addEventListener('click', saveAllPhases);
    document.getElementById('btnExport').addEventListener('click', exportConfig);
    document.getElementById('btnAddPhase').addEventListener('click', addNewPhase);

  } catch (error) {
    logger.error('[ConfigEtapes] Error rendering:', error);
    mount('#app', `
      <div class="page">
        <div class="alert alert-error">
          <div class="alert-icon">❌</div>
          <div class="alert-content">
            <div class="alert-title">Erreur de chargement</div>
            <div class="alert-message">${error.message}</div>
          </div>
        </div>
      </div>
    `);
  }
}

/**
 * Load phase configurations from API
 */
async function loadPhaseConfigs() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/config/phases`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();

    // Mapper les données API vers le format interne
    phaseConfigs = data.map(p => ({
      id: p.id,
      mode_passation: p.modePassation,
      phase_code: p.phaseCode,
      phase_order: p.phaseOrder,
      titre: p.titre,
      sous_titre: p.sousTitre || '',
      description: p.description || '',
      icon: p.icon || '📌',
      color: p.color || 'blue',
      is_active: p.isActive !== false,
      is_required: p.isRequired !== false
    }));

    logger.info('[ConfigEtapes] Loaded phase configs from API:', phaseConfigs.length);
  } catch (error) {
    logger.error('[ConfigEtapes] Error loading configs from API:', error);
    throw error;
  }
}

/**
 * Render phases for current mode
 */
function renderPhases() {
  const phases = phaseConfigs
    .filter(p => p.mode_passation === currentMode)
    .sort((a, b) => a.phase_order - b.phase_order);

  const html = phases.map(phase => `
    <div class="card" data-phase-id="${phase.id}">
      <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">${phase.icon}</span>
          <div>
            <strong>${phase.titre}</strong>
            <div style="font-size: 12px; color: #666;">${phase.sous_titre}</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-secondary" onclick="movePhase('${phase.id}', 'up')">⬆️</button>
          <button class="btn btn-sm btn-secondary" onclick="movePhase('${phase.id}', 'down')">⬇️</button>
          <button class="btn btn-sm btn-secondary" onclick="editPhase('${phase.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deletePhase('${phase.id}')">🗑️</button>
        </div>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>Titre de l'étape *</label>
            <input type="text"
                   class="form-control"
                   value="${phase.titre}"
                   data-field="titre"
                   placeholder="Ex: Planification">
          </div>
          <div class="form-group" style="flex: 2;">
            <label>Sous-titre</label>
            <input type="text"
                   class="form-control"
                   value="${phase.sous_titre || ''}"
                   data-field="sous_titre"
                   placeholder="Ex: Inscription au PPM">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label>Icône (emoji)</label>
            <input type="text"
                   class="form-control"
                   value="${phase.icon}"
                   data-field="icon"
                   placeholder="📋">
          </div>
          <div class="form-group" style="flex: 1;">
            <label>Couleur</label>
            <select class="form-control" data-field="color">
              ${COLORS.map(c => `
                <option value="${c.value}" ${phase.color === c.value ? 'selected' : ''}>
                  ${c.label}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label>Ordre</label>
            <input type="number"
                   class="form-control"
                   value="${phase.phase_order}"
                   data-field="phase_order"
                   min="1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>
              <input type="checkbox"
                     ${phase.is_active ? 'checked' : ''}
                     data-field="is_active">
              Étape active
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox"
                     ${phase.is_required ? 'checked' : ''}
                     data-field="is_required">
              Étape obligatoire
            </label>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  mount('#phasesList', html || '<div class="alert alert-info">Aucune étape configurée pour ce mode</div>');

  // Attach change listeners
  document.querySelectorAll('[data-phase-id]').forEach(card => {
    const phaseId = parseInt(card.dataset.phaseId);
    card.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', (e) => {
        updatePhaseField(phaseId, e.target.dataset.field, e.target);
      });
    });
  });
}

/**
 * Update phase field
 */
function updatePhaseField(phaseId, field, input) {
  const phase = phaseConfigs.find(p => p.id === phaseId);
  if (!phase) return;

  if (input.type === 'checkbox') {
    phase[field] = input.checked;
  } else if (input.type === 'number') {
    phase[field] = parseInt(input.value);
  } else {
    phase[field] = input.value;
  }

  hasUnsavedChanges = true;
  showStatus('info', 'Modifications non enregistrées');
  logger.info('[ConfigEtapes] Updated phase field:', phaseId, field, phase[field]);
}

/**
 * Show status indicator
 */
function showStatus(type, message) {
  const indicator = document.getElementById('statusIndicator');
  if (!indicator) return;

  indicator.style.display = 'block';
  indicator.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning'}`;
  indicator.textContent = message;

  if (type === 'success') {
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }
}

/**
 * Save all phases
 */
async function saveAllPhases() {
  try {
    logger.info('[ConfigEtapes] Saving all phases...');
    showStatus('info', 'Enregistrement en cours...');

    // Get phases for current mode
    const currentPhases = phaseConfigs.filter(p => p.mode_passation === currentMode);

    // Save each phase
    for (const phase of currentPhases) {
      const payload = {
        modePassation: phase.mode_passation,
        phaseCode: phase.phase_code,
        phaseOrder: phase.phase_order,
        titre: phase.titre,
        sousTitre: phase.sous_titre,
        description: phase.description || '',
        icon: phase.icon,
        color: phase.color,
        isActive: phase.is_active,
        isRequired: phase.is_required
      };

      if (phase.id && typeof phase.id === 'number') {
        // Update existing phase
        const response = await fetch(`${API_BASE_URL}/api/config/phases/${phase.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Erreur mise à jour phase ${phase.phase_code}: ${response.statusText}`);
        }
      } else {
        // Create new phase
        const response = await fetch(`${API_BASE_URL}/api/config/phases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Erreur création phase ${phase.phase_code}: ${response.statusText}`);
        }

        // Update local ID with response
        const created = await response.json();
        phase.id = created.id;
      }
    }

    // Clear cache to force reload
    clearCache();

    hasUnsavedChanges = false;
    showStatus('success', '✅ Configuration enregistrée avec succès');
    logger.info('[ConfigEtapes] Phases saved successfully');

    // Reload to get fresh data
    await loadPhaseConfigs();
    renderPhases();

  } catch (error) {
    logger.error('[ConfigEtapes] Error saving phases:', error);
    showStatus('error', '❌ Erreur: ' + error.message);
  }
}

/**
 * Export configuration
 */
function exportConfig() {
  const data = JSON.stringify(phaseConfigs, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `phase-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logger.info('[ConfigEtapes] Configuration exported');
}

/**
 * Add new phase
 */
function addNewPhase() {
  const newPhase = {
    id: `NEW_${Date.now()}`, // Temporary ID
    mode_passation: currentMode,
    phase_code: 'NEW',
    phase_order: phaseConfigs.filter(p => p.mode_passation === currentMode).length + 1,
    titre: 'Nouvelle étape',
    sous_titre: '',
    icon: '📌',
    color: 'blue',
    is_active: true,
    is_required: false
  };

  phaseConfigs.push(newPhase);
  hasUnsavedChanges = true;
  renderPhases();
  showStatus('info', 'Nouvelle étape ajoutée - Pensez à enregistrer');
  logger.info('[ConfigEtapes] New phase added:', newPhase.id);
}

// Export functions for window scope (for onclick handlers)
window.movePhase = function(phaseId, direction) {
  const id = parseInt(phaseId) || phaseId;
  const phases = phaseConfigs.filter(p => p.mode_passation === currentMode);
  const index = phases.findIndex(p => p.id === id || p.id === phaseId);

  if (direction === 'up' && index > 0) {
    [phases[index].phase_order, phases[index - 1].phase_order] =
    [phases[index - 1].phase_order, phases[index].phase_order];
    hasUnsavedChanges = true;
  } else if (direction === 'down' && index < phases.length - 1) {
    [phases[index].phase_order, phases[index + 1].phase_order] =
    [phases[index + 1].phase_order, phases[index].phase_order];
    hasUnsavedChanges = true;
  }

  renderPhases();
  if (hasUnsavedChanges) {
    showStatus('info', 'Modifications non enregistrées');
  }
};

window.editPhase = function(phaseId) {
  const id = parseInt(phaseId) || phaseId;
  const phase = phaseConfigs.find(p => p.id === id || p.id === phaseId);
  if (!phase) return;

  const newCode = prompt('Code de la phase:', phase.phase_code);
  if (newCode && newCode !== phase.phase_code) {
    phase.phase_code = newCode;
    hasUnsavedChanges = true;
    renderPhases();
    showStatus('info', 'Modifications non enregistrées');
  }
};

window.deletePhase = async function(phaseId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) return;

  const id = parseInt(phaseId) || phaseId;
  const index = phaseConfigs.findIndex(p => p.id === id || p.id === phaseId);

  if (index > -1) {
    const phase = phaseConfigs[index];

    // If it's a real database ID, delete from API
    if (typeof phase.id === 'number') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/config/phases/${phase.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Erreur suppression: ${response.statusText}`);
        }

        // Clear cache
        clearCache();
      } catch (error) {
        logger.error('[ConfigEtapes] Error deleting phase:', error);
        showStatus('error', '❌ Erreur suppression: ' + error.message);
        return;
      }
    }

    phaseConfigs.splice(index, 1);
    renderPhases();
    showStatus('success', '✅ Étape supprimée');
    logger.info('[ConfigEtapes] Phase deleted:', phaseId);
  }
};
