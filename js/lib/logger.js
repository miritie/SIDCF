/* ============================================
   Logger Utility
   ============================================ */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS.INFO;
    this.logs = [];
    this.maxLogs = 1000;
  }

  setLevel(level) {
    this.level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  debug(message, ...args) {
    this._log('DEBUG', message, args);
  }

  info(message, ...args) {
    this._log('INFO', message, args);
  }

  warn(message, ...args) {
    this._log('WARN', message, args);
  }

  error(message, ...args) {
    this._log('ERROR', message, args);
  }

  _log(level, message, args) {
    const levelValue = LOG_LEVELS[level];
    if (levelValue < this.level) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      args
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with styling
    const styles = {
      DEBUG: 'color: #6b7280',
      INFO: 'color: #3b82f6',
      WARN: 'color: #f59e0b; font-weight: bold',
      ERROR: 'color: #ef4444; font-weight: bold'
    };

    console.log(
      `%c[${level}] ${message}`,
      styles[level],
      ...args
    );
  }

  getLogs(level = null) {
    if (!level) return this.logs;
    return this.logs.filter(log => log.level === level);
  }

  clear() {
    this.logs = [];
  }

  export() {
    return JSON.stringify(this.logs, null, 2);
  }

  showDebugPanel() {
    const debugBoot = document.getElementById('debugBoot');
    const debugLog = document.getElementById('debugLog');

    if (debugBoot && debugLog) {
      const logHtml = this.logs
        .slice(-50) // Last 50 entries
        .map(log => {
          const color = {
            DEBUG: '#6b7280',
            INFO: '#3b82f6',
            WARN: '#f59e0b',
            ERROR: '#ef4444'
          }[log.level];

          return `<div style="margin-bottom: 8px;">
            <span style="color: ${color}; font-weight: bold;">[${log.level}]</span>
            <span style="color: #6b7280;">${log.timestamp.split('T')[1].split('.')[0]}</span>
            <span>${log.message}</span>
          </div>`;
        })
        .join('');

      debugLog.innerHTML = logHtml;
      debugBoot.style.display = 'flex';
    }
  }
}

// Singleton instance
const logger = new Logger();

export default logger;

export const { debug, info, warn, error } = {
  debug: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args)
};
