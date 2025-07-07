import { Logger, LogLevel } from '../utils/logger';

export interface LoggingConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableApiLogging: boolean;
  enablePerformanceLogging: boolean;
  maxLogSize: number; // en MB
  logToFile: boolean;
  logFilePath?: string;
}

export const defaultLoggingConfig: LoggingConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARNING : LogLevel.INFO,
  enableColors: process.env.NODE_ENV !== 'production',
  enableTimestamps: true,
  enableApiLogging: true,
  enablePerformanceLogging: process.env.NODE_ENV === 'development',
  maxLogSize: 10,
  logToFile: process.env.NODE_ENV === 'production',
  logFilePath: process.env.LOG_FILE_PATH || './logs/app.log'
};

export class LoggingManager {
  private static instance: LoggingManager;
  private config: LoggingConfig;

  private constructor(config: LoggingConfig = defaultLoggingConfig) {
    this.config = config;
    this.initializeLogger();
  }

  static getInstance(config?: LoggingConfig): LoggingManager {
    if (!LoggingManager.instance) {
      LoggingManager.instance = new LoggingManager(config);
    }
    return LoggingManager.instance;
  }

  private initializeLogger(): void {
    Logger.setLogLevel(this.config.level);
    Logger.setEnableColors(this.config.enableColors);
    Logger.setEnableTimestamps(this.config.enableTimestamps);

    Logger.info('Logger initialisé', {
      level: LogLevel[this.config.level],
      enableColors: this.config.enableColors,
      enableTimestamps: this.config.enableTimestamps,
      environment: process.env.NODE_ENV
    });
  }

  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeLogger();
  }

  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  // Méthode pour logger les performances des opérations critiques
  logPerformance(operation: string, duration: number, context?: any): void {
    if (this.config.enablePerformanceLogging) {
      Logger.performance(operation, duration, context);
    }
  }

  // Méthode pour logger les erreurs critiques
  logCriticalError(message: string, error: Error, context?: any): void {
    Logger.error(`CRITIQUE: ${message}`, error, context);
  }

  // Méthode pour logger les événements métier importants
  logBusinessEvent(event: string, data: any, context?: any): void {
    Logger.info(`ÉVÉNEMENT MÉTIER: ${event}`, { ...context, data });
  }

  // Méthode pour logger les changements de configuration
  logConfigChange(component: string, oldValue: any, newValue: any): void {
    Logger.warning(`Configuration modifiée: ${component}`, {
      component,
      oldValue,
      newValue
    });
  }
}

// Initialiser le gestionnaire de logging au démarrage
export const loggingManager = LoggingManager.getInstance(); 