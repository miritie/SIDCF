/* ============================================
   Formatting Utilities
   ============================================ */

/**
 * Format number as money
 * @param {number} amount
 * @param {string} currency - Default 'XOF'
 * @returns {string}
 */
export function money(amount, currency = 'XOF') {
  if (amount == null || isNaN(amount)) return '-';

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  return `${formatted} ${currency}`;
}

/**
 * Format date
 * @param {Date|string} date
 * @param {string} format - 'short', 'long', 'iso'
 * @returns {string}
 */
export function date(date, format = 'short') {
  if (!date) return '-';

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  switch (format) {
    case 'short':
      return d.toLocaleDateString('fr-FR');
    case 'long':
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'iso':
      return d.toISOString().split('T')[0];
    case 'datetime':
      return d.toLocaleString('fr-FR');
    default:
      return d.toLocaleDateString('fr-FR');
  }
}

/**
 * Format percentage
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function percent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '-';

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers (K, M, B)
 * @param {number} num
 * @returns {string}
 */
export function abbreviate(num) {
  if (num == null || isNaN(num)) return '-';

  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'Md';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format duration in days
 * @param {number} days
 * @returns {string}
 */
export function duration(days) {
  if (days == null || isNaN(days)) return '-';

  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} an${years > 1 ? 's' : ''}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} mois`;
  }
  return `${days} jour${days > 1 ? 's' : ''}`;
}

/**
 * Truncate text
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 * @param {string} text
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format phone number
 * @param {string} phone
 * @returns {string}
 */
export function phone(phone) {
  if (!phone) return '-';
  // Format: +225 XX XX XX XX XX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+225 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`;
  }
  return phone;
}

/**
 * Parse date input
 * @param {string} input
 * @returns {Date|null}
 */
export function parseDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format file size
 * @param {number} bytes
 * @returns {string}
 */
export function fileSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '-';

  const units = ['o', 'Ko', 'Mo', 'Go'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format montant en millions avec séparateurs
 * @param {number} amount - Montant en XOF
 * @returns {string} - Ex: "4,20" pour 4200000
 */
export function moneyMillions(amount) {
  if (amount == null || isNaN(amount)) return '-';

  const millions = amount / 1000000;

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(millions);
}
