/**
 * Logger centralizado com suporte a ambiente (dev/prod)
 * Remove automaticamente logs em produção
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  prefix?: string;
}

const defaultConfig: LoggerConfig = {
  enableDebug: process.env.NODE_ENV === 'development',
  enableInfo: process.env.NODE_ENV === 'development',
  enableWarn: true,
  enableError: true,
  prefix: '[Mestre-RPG]',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.config.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: any): void {
    if (!this.config.enableDebug) return;
    const msg = this.formatMessage('debug', message);
    if (data) {
      console.log(msg, data);
    } else {
      console.log(msg);
    }
  }

  info(message: string, data?: any): void {
    if (!this.config.enableInfo) return;
    const msg = this.formatMessage('info', message);
    if (data) {
      console.log(msg, data);
    } else {
      console.log(msg);
    }
  }

  warn(message: string, data?: any): void {
    if (!this.config.enableWarn) return;
    const msg = this.formatMessage('warn', message);
    if (data) {
      console.warn(msg, data);
    } else {
      console.warn(msg);
    }
  }

  error(message: string, error?: any): void {
    if (!this.config.enableError) return;
    const msg = this.formatMessage('error', message);
    if (error) {
      console.error(msg, error);
    } else {
      console.error(msg);
    }
  }
}

// Exportar instância singleton
export const logger = new Logger();

// Exportar classe para customização se necessário
export default Logger;
