/**
 * Custom logger utility for development and production environments
 * Prevents console.log statements in production while maintaining error logging
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enabledInProduction: LogLevel[];
  prefix?: string;
}

const defaultConfig: LoggerConfig = {
  enabledInProduction: ['error', 'warn'],
  prefix: '[MetricsHub]',
};

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.isDevelopment = import.meta.env.DEV;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    return this.config.enabledInProduction.includes(level);
  }

  private formatMessage(level: LogLevel, args: any[]): any[] {
    const prefix = this.config.prefix ? `${this.config.prefix} [${level.toUpperCase()}]` : `[${level.toUpperCase()}]`;
    return [prefix, ...args];
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', args));
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', args));
    }
  }

  /**
   * Group logs together (useful for debugging complex operations)
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Log execution time of a function
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances if needed
export { Logger };
