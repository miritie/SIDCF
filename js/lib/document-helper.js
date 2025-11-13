/* ============================================
   Document Helper - Fonctions utilitaires pour upload de documents
   ============================================ */

import documentStorage from './document-storage.js';

/**
 * Gère l'upload d'un document depuis un input file
 * @param {HTMLInputElement} fileInput - Element input[type=file]
 * @param {string} category - Catégorie du document
 * @returns {Promise<Object|null>} Métadonnées du document sauvegardé ou null
 */
export async function handleFileUpload(fileInput, category = 'GENERAL') {
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return null;
  }

  const file = fileInput.files[0];

  try {
    // Convertir en Base64
    const documentData = await documentStorage.fileToBase64(file);

    // Sauvegarder dans localStorage
    const savedDocument = documentStorage.saveDocument(documentData, category);

    console.log(`[DocumentHelper] Document uploadé: ${savedDocument.nom} (ID: ${savedDocument.id})`);

    return savedDocument;
  } catch (error) {
    console.error('[DocumentHelper] Erreur upload:', error);
    alert(`❌ ${error.message}`);
    return null;
  }
}

/**
 * Crée un bouton de téléchargement pour un document
 * @param {string} documentId - ID du document
 * @param {string} buttonText - Texte du bouton (défaut: "📄 Télécharger")
 * @param {string} buttonClass - Classes CSS du bouton
 * @returns {HTMLElement} Élément bouton
 */
export function createDownloadButton(documentId, buttonText = '📄 Télécharger', buttonClass = 'btn btn-sm btn-secondary') {
  const button = document.createElement('button');
  button.className = buttonClass;
  button.textContent = buttonText;
  button.style.fontSize = '12px';

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    documentStorage.downloadDocument(documentId);
  });

  return button;
}

/**
 * Affiche les statistiques de stockage
 * @returns {string} Message formaté des statistiques
 */
export function getStorageStatsMessage() {
  const stats = documentStorage.getStorageStats();
  return `📊 Stockage: ${stats.count} document(s) - ${stats.localStorageSizeFormatted} / ${(stats.estimatedLimit / 1024 / 1024).toFixed(0)}MB (${stats.usagePercent}%)`;
}

/**
 * Valide un fichier avant upload
 * @param {File} file - Fichier à valider
 * @param {Object} options - Options de validation
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  } = options;

  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' };
  }

  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    };
  }

  // Vérifier le type MIME
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    // Vérifier également l'extension si le type MIME n'est pas reconnu
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedExtensions.join(', ')}`
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Gère l'upload d'un document avec validation
 * @param {HTMLInputElement} fileInput - Element input[type=file]
 * @param {string} category - Catégorie du document
 * @param {Object} validationOptions - Options de validation
 * @returns {Promise<Object|null>} Métadonnées du document sauvegardé ou null
 */
export async function handleFileUploadWithValidation(fileInput, category = 'GENERAL', validationOptions = {}) {
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return null;
  }

  const file = fileInput.files[0];

  // Valider le fichier
  const validation = validateFile(file, validationOptions);
  if (!validation.valid) {
    alert(`❌ ${validation.error}`);
    fileInput.value = ''; // Réinitialiser l'input
    return null;
  }

  // Procéder à l'upload
  return handleFileUpload(fileInput, category);
}

/**
 * Associe un document à une entité
 * @param {string} documentId - ID du document
 * @param {string} entityType - Type d'entité (OPERATION, GARANTIE, etc.)
 * @param {string} entityId - ID de l'entité
 * @returns {Object} Référence du document
 */
export function linkDocumentToEntity(documentId, entityType, entityId) {
  return {
    documentId,
    entityType,
    entityId,
    linkedAt: new Date().toISOString()
  };
}

/**
 * Crée un aperçu visuel d'un document
 * @param {Object} documentMeta - Métadonnées du document
 * @returns {HTMLElement} Élément div avec l'aperçu
 */
export function createDocumentPreview(documentMeta) {
  const preview = document.createElement('div');
  preview.className = 'document-preview';
  preview.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--color-gray-300);
    border-radius: 6px;
    background: var(--color-gray-50);
  `;

  // Icône selon le type
  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 32px;';
  icon.textContent = getFileIcon(documentMeta.type || documentMeta.nom);

  // Infos
  const info = document.createElement('div');
  info.style.cssText = 'flex: 1;';
  info.innerHTML = `
    <div style="font-weight: 500; margin-bottom: 4px;">${documentMeta.nom}</div>
    <div style="font-size: 12px; color: var(--color-text-muted);">
      ${formatBytes(documentMeta.taille)} • ${new Date(documentMeta.dateUpload).toLocaleDateString()}
    </div>
  `;

  // Bouton téléchargement
  const downloadBtn = createDownloadButton(documentMeta.id, '⬇️', 'btn btn-sm btn-primary');

  preview.appendChild(icon);
  preview.appendChild(info);
  preview.appendChild(downloadBtn);

  return preview;
}

/**
 * Retourne une icône selon le type de fichier
 * @param {string} typeOrName - Type MIME ou nom de fichier
 * @returns {string} Emoji icône
 */
function getFileIcon(typeOrName) {
  if (!typeOrName) return '📄';

  const lower = typeOrName.toLowerCase();

  if (lower.includes('pdf')) return '📕';
  if (lower.includes('image') || lower.includes('.jpg') || lower.includes('.png') || lower.includes('.jpeg')) return '🖼️';
  if (lower.includes('word') || lower.includes('.doc')) return '📘';
  if (lower.includes('excel') || lower.includes('.xls')) return '📗';
  if (lower.includes('zip') || lower.includes('.rar')) return '📦';

  return '📄';
}

/**
 * Formate la taille en octets
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default {
  handleFileUpload,
  handleFileUploadWithValidation,
  createDownloadButton,
  getStorageStatsMessage,
  validateFile,
  linkDocumentToEntity,
  createDocumentPreview
};
