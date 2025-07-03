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

export class Logger {
  static info(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] ℹ️ ${message}${contextStr}`);
  }

  static success(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] ✅ ${message}${contextStr}`);
  }

  static warning(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] ⚠️ ${message}${contextStr}`);
  }

  static error(message: string, error?: Error, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` | Error: ${error.message}` : '';
    console.error(`[${timestamp}] ❌ ${message}${contextStr}${errorStr}`);
    
    if (error?.stack) {
      console.error(`[${timestamp}] Stack: ${error.stack}`);
    }
  }

  static webhook(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] 🔔 ${message}${contextStr}`);
  }

  static stripe(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] 💳 ${message}${contextStr}`);
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
} 