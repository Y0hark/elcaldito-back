/**
 * Utilitaire centralisé pour le logging et la gestion d'erreurs
 */

export interface LogContext {
  userId?: number | string;
  commandeId?: number | string;
  paymentIntentId?: string;
  eventType?: string;
  [key: string]: any;
}

export enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  INFO = 2,
  SUCCESS = 3,
  WEBHOOK = 4,
  STRIPE = 5
}

class LoggerConfig {
  private static instance: LoggerConfig;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableColors: boolean = true;
  private enableTimestamps: boolean = true;

  private constructor() {}

  static getInstance(): LoggerConfig {
    if (!LoggerConfig.instance) {
      LoggerConfig.instance = new LoggerConfig();
    }
    return LoggerConfig.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setEnableColors(enable: boolean): void {
    this.enableColors = enable;
  }

  setEnableTimestamps(enable: boolean): void {
    this.enableTimestamps = enable;
  }

  shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  getEnableColors(): boolean {
    return this.enableColors;
  }

  getEnableTimestamps(): boolean {
    return this.enableTimestamps;
  }
}

export class Logger {
  private static config = LoggerConfig.getInstance();

  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const parts: string[] = [];
    
    if (this.config.getEnableTimestamps()) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(level);
    parts.push(message);
    
    if (context && Object.keys(context).length > 0) {
      parts.push(`| ${JSON.stringify(context)}`);
    }
    
    return parts.join(' ');
  }

  static info(message: string, context?: LogContext) {
    if (!this.config.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage('ℹ️', message, context);
    console.log(formattedMessage);
  }

  static success(message: string, context?: LogContext) {
    if (!this.config.shouldLog(LogLevel.SUCCESS)) return;
    
    const formattedMessage = this.formatMessage('✅', message, context);
    console.log(formattedMessage);
  }

  static warning(message: string, context?: LogContext) {
    if (!this.config.shouldLog(LogLevel.WARNING)) return;
    
    const formattedMessage = this.formatMessage('⚠️', message, context);
    console.log(formattedMessage);
  }

  static error(message: string, error?: Error, context?: LogContext) {
    if (!this.config.shouldLog(LogLevel.ERROR)) return;
    
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error.message}` : '';
    
    console.error(`[${timestamp}] ❌ ${message}${contextStr}${errorStr}`);
    
    if (error?.stack) {
      console.error(`[${timestamp}] Stack: ${error.stack}`);
    }
  }

  static webhook(message: string, context?: LogContext) {
    if (!this.config.shouldLog(LogLevel.WEBHOOK)) return;
    
    const formattedMessage = this.formatMessage('🔔', message, context);
    console.log(formattedMessage);
  }

  static stripe(message: string, context?: LogContext) {
    if (!this.config.shouldLog(LogLevel.STRIPE)) return;
    
    const formattedMessage = this.formatMessage('💳', message, context);
    console.log(formattedMessage);
  }

  // Méthodes de configuration
  static setLogLevel(level: LogLevel): void {
    this.config.setLogLevel(level);
  }

  static setEnableColors(enable: boolean): void {
    this.config.setEnableColors(enable);
  }

  static setEnableTimestamps(enable: boolean): void {
    this.config.setEnableTimestamps(enable);
  }

  // Méthode pour logger les performances
  static performance(operation: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? '⚠️' : 'ℹ️';
    const formattedMessage = this.formatMessage(level, `${operation} (${duration}ms)`, context);
    console.log(formattedMessage);
  }

  // Méthode pour logger les requêtes API
  static api(method: string, path: string, statusCode: number, duration?: number, context?: LogContext) {
    const level = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    const message = `${method} ${path} ${statusCode}`;
    const apiContext = { ...context, method, path, statusCode, duration };
    const formattedMessage = this.formatMessage(level, message, apiContext);
    console.log(formattedMessage);
  }
}

export class ErrorHandler {
  static handleWebhookError(ctx: any, error: Error, context?: LogContext) {
    Logger.error('Erreur lors du traitement du webhook', error, context);
    return ctx.badRequest('Erreur lors du traitement du webhook');
  }

  static handlePaymentError(ctx: any, error: Error, context?: LogContext) {
    Logger.error('Erreur lors du traitement du paiement', error, context);
    return ctx.badRequest('Erreur lors du traitement du paiement');
  }

  static handleDatabaseError(ctx: any, error: Error, context?: LogContext) {
    Logger.error('Erreur de base de données', error, context);
    return ctx.badRequest('Erreur de base de données');
  }

  static handleValidationError(ctx: any, message: string, context?: LogContext) {
    Logger.warning(`Erreur de validation: ${message}`, context);
    return ctx.badRequest(message);
  }

  static handleAuthError(ctx: any, message: string, context?: LogContext) {
    Logger.warning(`Erreur d'authentification: ${message}`, context);
    return ctx.unauthorized(message);
  }

  static handleNotFoundError(ctx: any, message: string, context?: LogContext) {
    Logger.warning(`Ressource non trouvée: ${message}`, context);
    return ctx.notFound(message);
  }
} 