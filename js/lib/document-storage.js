/* ============================================
   Document Storage - Gestion des documents avec Base64
   ============================================ */

/**
 * Convertit un fichier en Base64 pour stockage localStorage
 * @param {File} file - Fichier à convertir
 * @returns {Promise<Object>} Objet contenant les métadonnées et le contenu Base64
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Aucun fichier fourni'));
      return;
    }

    // Validation de la taille (max 5MB pour localStorage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      reject(new Error(`Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum autorisé: 5MB`));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64Content = e.target.result;
      const document = {
        id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nom: file.name,
        type: file.type,
        taille: file.size,
        dateUpload: new Date().toISOString(),
        contenu: base64Content
      };
      resolve(document);
    };

    reader.onerror = (error) => {
      reject(new Error('Erreur lors de la lecture du fichier: ' + error));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Enregistre un document dans localStorage
 * @param {Object} document - Document avec contenu Base64
 * @param {string} category - Catégorie (ex: 'OS', 'GARANTIE', 'VISA', etc.)
 * @returns {Object} Métadonnées du document (sans le contenu pour économiser la mémoire)
 */
export function saveDocument(document, category = 'GENERAL') {
  try {
    const storageKey = `SIDCF_DOC_${document.id}`;
    const documentWithMeta = {
      ...document,
      category,
      storageKey
    };

    // Sauvegarder le document complet
    localStorage.setItem(storageKey, JSON.stringify(documentWithMeta));

    // Ajouter à l'index des documents
    const indexKey = 'SIDCF_DOCS_INDEX';
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');

    // Créer une entrée d'index (sans le contenu Base64)
    const indexEntry = {
      id: document.id,
      nom: document.nom,
      type: document.type,
      taille: document.taille,
      dateUpload: document.dateUpload,
      category,
      storageKey
    };

    index.push(indexEntry);
    localStorage.setItem(indexKey, JSON.stringify(index));

    console.log(`[DocumentStorage] Document sauvegardé: ${document.nom} (${(document.taille / 1024).toFixed(2)}KB)`);

    return indexEntry;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Espace de stockage insuffisant. Veuillez supprimer d\'anciens documents.');
    }
    throw error;
  }
}

/**
 * Récupère un document depuis localStorage
 * @param {string} documentId - ID du document
 * @returns {Object|null} Document complet avec contenu Base64
 */
export function getDocument(documentId) {
  try {
    const storageKey = `SIDCF_DOC_${documentId}`;
    const documentStr = localStorage.getItem(storageKey);

    if (!documentStr) {
      console.warn(`[DocumentStorage] Document non trouvé: ${documentId}`);
      return null;
    }

    return JSON.parse(documentStr);
  } catch (error) {
    console.error('[DocumentStorage] Erreur lors de la récupération du document:', error);
    return null;
  }
}

/**
 * Supprime un document de localStorage
 * @param {string} documentId - ID du document
 * @returns {boolean} True si supprimé avec succès
 */
export function deleteDocument(documentId) {
  try {
    const storageKey = `SIDCF_DOC_${documentId}`;

    // Supprimer le document
    localStorage.removeItem(storageKey);

    // Mettre à jour l'index
    const indexKey = 'SIDCF_DOCS_INDEX';
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');
    index = index.filter(doc => doc.id !== documentId);
    localStorage.setItem(indexKey, JSON.stringify(index));

    console.log(`[DocumentStorage] Document supprimé: ${documentId}`);
    return true;
  } catch (error) {
    console.error('[DocumentStorage] Erreur lors de la suppression du document:', error);
    return false;
  }
}

/**
 * Liste tous les documents (métadonnées uniquement)
 * @param {string} category - Filtrer par catégorie (optionnel)
 * @returns {Array} Liste des métadonnées des documents
 */
export function listDocuments(category = null) {
  try {
    const indexKey = 'SIDCF_DOCS_INDEX';
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');

    if (category) {
      return index.filter(doc => doc.category === category);
    }

    return index;
  } catch (error) {
    console.error('[DocumentStorage] Erreur lors de la liste des documents:', error);
    return [];
  }
}

/**
 * Télécharge un document (déclenche le téléchargement dans le navigateur)
 * @param {string} documentId - ID du document
 */
export function downloadDocument(documentId) {
  const document = getDocument(documentId);

  if (!document) {
    alert('❌ Document non trouvé');
    return;
  }

  try {
    // Créer un lien de téléchargement
    const link = window.document.createElement('a');
    link.href = document.contenu;
    link.download = document.nom;
    link.style.display = 'none';

    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    console.log(`[DocumentStorage] Document téléchargé: ${document.nom}`);
  } catch (error) {
    console.error('[DocumentStorage] Erreur lors du téléchargement:', error);
    alert('❌ Erreur lors du téléchargement du document');
  }
}

/**
 * Obtient la taille totale utilisée par les documents
 * @returns {Object} Statistiques de stockage
 */
export function getStorageStats() {
  try {
    const index = listDocuments();
    const totalSize = index.reduce((sum, doc) => sum + doc.taille, 0);
    const count = index.length;

    // Estimer l'espace localStorage utilisé
    let totalLocalStorageSize = 0;
    for (let key in localStorage) {
      if (key.startsWith('SIDCF_DOC_')) {
        totalLocalStorageSize += localStorage[key].length;
      }
    }

    return {
      count,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      localStorageSize: totalLocalStorageSize,
      localStorageSizeFormatted: formatBytes(totalLocalStorageSize),
      // localStorage limite généralement à ~5-10MB
      estimatedLimit: 10 * 1024 * 1024,
      usagePercent: ((totalLocalStorageSize / (10 * 1024 * 1024)) * 100).toFixed(2)
    };
  } catch (error) {
    console.error('[DocumentStorage] Erreur lors du calcul des statistiques:', error);
    return {
      count: 0,
      totalSize: 0,
      totalSizeFormatted: '0 B',
      localStorageSize: 0,
      localStorageSizeFormatted: '0 B',
      estimatedLimit: 0,
      usagePercent: '0'
    };
  }
}

/**
 * Formate la taille en octets en format lisible
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

/**
 * Nettoie les documents orphelins (sans référence dans l'index)
 * @returns {number} Nombre de documents nettoyés
 */
export function cleanOrphanDocuments() {
  try {
    const index = listDocuments();
    const indexIds = new Set(index.map(doc => doc.id));

    let cleanedCount = 0;
    const keysToRemove = [];

    // Parcourir toutes les clés localStorage
    for (let key in localStorage) {
      if (key.startsWith('SIDCF_DOC_')) {
        const docId = key.replace('SIDCF_DOC_', '');
        if (!indexIds.has(docId)) {
          keysToRemove.push(key);
          cleanedCount++;
        }
      }
    }

    // Supprimer les documents orphelins
    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (cleanedCount > 0) {
      console.log(`[DocumentStorage] ${cleanedCount} document(s) orphelin(s) supprimé(s)`);
    }

    return cleanedCount;
  } catch (error) {
    console.error('[DocumentStorage] Erreur lors du nettoyage:', error);
    return 0;
  }
}

export default {
  fileToBase64,
  saveDocument,
  getDocument,
  deleteDocument,
  listDocuments,
  downloadDocument,
  getStorageStats,
  cleanOrphanDocuments
};
