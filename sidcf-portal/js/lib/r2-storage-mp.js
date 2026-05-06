/**
 * Cloudflare R2 Storage Service — variante Marché+
 *
 * Différences avec r2-storage.js :
 *  - Préfixe R2 "mp/" sur la clé d'objet (séparation visuelle dans le bucket)
 *  - Entité datastore "MP_DOCUMENT" au lieu de "DOCUMENT"
 */

import dataService from '../datastore/data-service.js';

const R2_PREFIX = 'mp/';
const DOCUMENT_ENTITY = 'MP_DOCUMENT';

export async function uploadDocument(file, metadata = {}) {
  try {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. Maximum: ${maxSize / 1024 / 1024}MB`);
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${R2_PREFIX}${timestamp}_${sanitizedName}`;

    const adapter = dataService.adapter;
    if (!adapter.uploadFile) {
      throw new Error('Adapter does not support file upload');
    }

    console.log('[R2Storage-MP] Uploading file:', fileName);
    const uploadResult = await adapter.uploadFile(file, fileName);

    const documentData = {
      nom: file.name,
      fichier: uploadResult.url,
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

    const document = await dataService.add(DOCUMENT_ENTITY, documentData);

    return {
      success: true,
      documentId: document.id,
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      size: uploadResult.size
    };
  } catch (error) {
    console.error('[R2Storage-MP] Upload error:', error);
    throw error;
  }
}

export async function getDocument(documentId) {
  const document = await dataService.get(DOCUMENT_ENTITY, documentId);
  if (!document) throw new Error('Document not found');
  return {
    id: document.id,
    nom: document.nom,
    url: document.fichier,
    taille: document.taille,
    uploadedAt: document.uploadedAt,
    typeDocument: document.typeDocument,
    phase: document.phase
  };
}

export async function downloadDocument(documentId) {
  const document = await getDocument(documentId);
  const link = window.document.createElement('a');
  link.href = document.url;
  link.download = document.nom;
  link.target = '_blank';
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
}

export async function deleteDocument(documentId) {
  const document = await dataService.get(DOCUMENT_ENTITY, documentId);
  if (!document) throw new Error('Document not found');

  const fileName = document.fichier.split('/').slice(-2).join('/'); // garder mp/xxx
  const adapter = dataService.adapter;
  if (adapter.deleteFile) {
    await adapter.deleteFile(fileName);
  }
  await dataService.remove(DOCUMENT_ENTITY, documentId);
  return { success: true };
}

export async function listDocuments(filter = {}) {
  const documents = await dataService.query(DOCUMENT_ENTITY, filter);
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
}

export async function listDocumentsByOperation(operationId) {
  return await listDocuments({ operationId });
}

export function validateFile(file, options = {}) {
  const errors = [];
  const maxSize = options.maxSize || 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux. Maximum: ${maxSize / 1024 / 1024}MB`);
  }
  if (options.acceptedTypes && options.acceptedTypes.length > 0) {
    const fileType = file.type;
    const fileExt = file.name.split('.').pop().toLowerCase();
    const isTypeAccepted = options.acceptedTypes.some(type => {
      if (type.startsWith('.')) return fileExt === type.slice(1);
      return fileType.match(new RegExp(type.replace('*', '.*')));
    });
    if (!isTypeAccepted) {
      errors.push(`Type de fichier non accepté. Types acceptés: ${options.acceptedTypes.join(', ')}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export async function handleFileUpload(fileInput, metadata = {}) {
  if (!fileInput.files || fileInput.files.length === 0) {
    throw new Error('Aucun fichier sélectionné');
  }
  const file = fileInput.files[0];
  const validation = validateFile(file, metadata.validation || {});
  if (!validation.valid) throw new Error(validation.errors.join('\n'));
  const result = await uploadDocument(file, metadata);
  fileInput.value = '';
  return result;
}

export default {
  uploadDocument, getDocument, downloadDocument, deleteDocument,
  listDocuments, listDocumentsByOperation, validateFile, handleFileUpload
};
