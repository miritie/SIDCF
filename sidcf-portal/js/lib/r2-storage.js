/**
 * Cloudflare R2 Storage Service
 * Remplace le stockage Base64 localStorage par un stockage cloud R2
 */

import dataService from '../datastore/data-service.js';

/**
 * Upload un fichier vers R2 via l'API
 */
export async function uploadDocument(file, metadata = {}) {
  try {
    // Validation
    const maxSize = 50 * 1024 * 1024; // 50MB (limite R2 généreuse)
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. Maximum: ${maxSize / 1024 / 1024}MB`);
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    // Upload via l'adapter PostgreSQL (qui gère R2)
    const adapter = dataService.adapter;
    if (!adapter.uploadFile) {
      throw new Error('Adapter does not support file upload');
    }

    console.log('[R2Storage] Uploading file:', fileName);
    const uploadResult = await adapter.uploadFile(file, fileName);

    // Créer l'entité DOCUMENT dans la base
    const documentData = {
      nom: file.name,
      fichier: uploadResult.url, // URL R2
      taille: file.size,
      phase: metadata.phase || null,
      typeDocument: metadata.typeDocument || null,
      entityType: metadata.entityType || null,
      entityId: metadata.entityId || null,
      operationId: metadata.operationId || null,
      uploadedBy: metadata.uploadedBy || 'anonymous',
      uploadedAt: new Date().toISOString(),
      statut: 'VALIDE',
      obligatoire: metadata.obligatoire || false,
      commentaire: metadata.commentaire || ''
    };

    const document = await dataService.add('DOCUMENT', documentData);

    console.log('[R2Storage] Document created:', document.id);

    return {
      success: true,
      documentId: document.id,
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      size: uploadResult.size
    };

  } catch (error) {
    console.error('[R2Storage] Upload error:', error);
    throw error;
  }
}

/**
 * Récupère un document depuis R2
 */
export async function getDocument(documentId) {
  try {
    const document = await dataService.get('DOCUMENT', documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    return {
      id: document.id,
      nom: document.nom,
      url: document.fichier, // URL R2 directe
      taille: document.taille,
      uploadedAt: document.uploadedAt,
      typeDocument: document.typeDocument,
      phase: document.phase
    };

  } catch (error) {
    console.error('[R2Storage] Get document error:', error);
    throw error;
  }
}

/**
 * Télécharge un document
 */
export async function downloadDocument(documentId) {
  try {
    const document = await getDocument(documentId);

    // Créer un lien de téléchargement temporaire
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.nom;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    console.log('[R2Storage] Download initiated:', document.nom);

  } catch (error) {
    console.error('[R2Storage] Download error:', error);
    throw error;
  }
}

/**
 * Supprime un document (base + R2)
 */
export async function deleteDocument(documentId) {
  try {
    const document = await dataService.get('DOCUMENT', documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Extraire le nom du fichier depuis l'URL
    const fileName = document.fichier.split('/').pop();

    // Supprimer de R2
    const adapter = dataService.adapter;
    if (adapter.deleteFile) {
      await adapter.deleteFile(fileName);
      console.log('[R2Storage] File deleted from R2:', fileName);
    }

    // Supprimer l'entité DOCUMENT
    await dataService.remove('DOCUMENT', documentId);
    console.log('[R2Storage] Document entity deleted:', documentId);

    return { success: true };

  } catch (error) {
    console.error('[R2Storage] Delete error:', error);
    throw error;
  }
}

/**
 * Liste les documents par catégorie/phase
 */
export async function listDocuments(filter = {}) {
  try {
    const documents = await dataService.query('DOCUMENT', filter);
    return documents.map(doc => ({
      id: doc.id,
      nom: doc.nom,
      url: doc.fichier,
      taille: doc.taille,
      uploadedAt: doc.uploadedAt,
      typeDocument: doc.typeDocument,
      phase: doc.phase,
      statut: doc.statut
    }));

  } catch (error) {
    console.error('[R2Storage] List documents error:', error);
    throw error;
  }
}

/**
 * Liste les documents d'une opération
 */
export async function listDocumentsByOperation(operationId) {
  return await listDocuments({ operationId });
}

/**
 * Validation de fichier
 */
export function validateFile(file, options = {}) {
  const errors = [];

  // Taille max (défaut: 50MB)
  const maxSize = options.maxSize || 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux. Maximum: ${maxSize / 1024 / 1024}MB`);
  }

  // Types acceptés
  if (options.acceptedTypes && options.acceptedTypes.length > 0) {
    const fileType = file.type;
    const fileExt = file.name.split('.').pop().toLowerCase();

    const isTypeAccepted = options.acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExt === type.slice(1);
      }
      return fileType.match(new RegExp(type.replace('*', '.*')));
    });

    if (!isTypeAccepted) {
      errors.push(`Type de fichier non accepté. Types acceptés: ${options.acceptedTypes.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gère l'upload depuis un input file
 */
export async function handleFileUpload(fileInput, metadata = {}) {
  try {
    if (!fileInput.files || fileInput.files.length === 0) {
      throw new Error('Aucun fichier sélectionné');
    }

    const file = fileInput.files[0];

    // Validation
    const validation = validateFile(file, metadata.validation || {});
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }

    // Upload
    const result = await uploadDocument(file, metadata);

    // Reset input
    fileInput.value = '';

    return result;

  } catch (error) {
    console.error('[R2Storage] Handle upload error:', error);
    throw error;
  }
}

/**
 * Crée un bouton de téléchargement
 */
export function createDownloadButton(documentId, text = 'Télécharger', classes = 'btn btn-sm btn-outline-primary') {
  const button = window.document.createElement('button');
  button.className = classes;
  button.textContent = text;
  button.type = 'button';

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      button.disabled = true;
      button.textContent = 'Téléchargement...';
      await downloadDocument(documentId);
    } catch (error) {
      alert('Erreur lors du téléchargement: ' + error.message);
    } finally {
      button.disabled = false;
      button.textContent = text;
    }
  });

  return button;
}

/**
 * Obtient les statistiques de stockage
 */
export async function getStorageStats() {
  try {
    const documents = await dataService.query('DOCUMENT');

    const totalSize = documents.reduce((sum, doc) => sum + (doc.taille || 0), 0);
    const totalCount = documents.length;

    // Statistiques par type
    const byType = {};
    documents.forEach(doc => {
      const type = doc.typeDocument || 'AUTRE';
      byType[type] = byType[type] || { count: 0, size: 0 };
      byType[type].count++;
      byType[type].size += doc.taille || 0;
    });

    return {
      totalCount,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      byType
    };

  } catch (error) {
    console.error('[R2Storage] Storage stats error:', error);
    return {
      totalCount: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      byType: {}
    };
  }
}

// Export pour compatibilité avec l'ancien document-storage.js
export default {
  uploadDocument,
  getDocument,
  downloadDocument,
  deleteDocument,
  listDocuments,
  listDocumentsByOperation,
  validateFile,
  handleFileUpload,
  createDownloadButton,
  getStorageStats
};
