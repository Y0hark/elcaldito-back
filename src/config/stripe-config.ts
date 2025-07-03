/**
 * Configuration centralisée pour Stripe
 */

export interface StripeConfig {
  currency: string;
  supportedCurrencies: string[];
  webhookTimeout: number;
  retryAttempts: number;
  defaultPaymentMethods: string[];
}

export const STRIPE_CONFIG: StripeConfig = {
  currency: 'eur',
  supportedCurrencies: ['eur', 'usd', 'gbp'],
  webhookTimeout: 2000, // 2 secondes
  retryAttempts: 3,
  defaultPaymentMethods: ['card', 'bancontact', 'eps', 'giropay', 'klarna', 'link']
};

export class StripeConfigManager {
  static getCurrency(): string {
    return process.env.STRIPE_CURRENCY || STRIPE_CONFIG.currency;
  }

  static isCurrencySupported(currency: string): boolean {
    return STRIPE_CONFIG.supportedCurrencies.includes(currency.toLowerCase());
  }

  static getWebhookTimeout(): number {
    return parseInt(process.env.STRIPE_WEBHOOK_TIMEOUT || STRIPE_CONFIG.webhookTimeout.toString());
  }

  static getRetryAttempts(): number {
    return parseInt(process.env.STRIPE_RETRY_ATTEMPTS || STRIPE_CONFIG.retryAttempts.toString());
  }

  static getPaymentMethods(): string[] {
    const customMethods = process.env.STRIPE_PAYMENT_METHODS;
    if (customMethods) {
      return customMethods.split(',').map(m => m.trim());
    }
    return STRIPE_CONFIG.defaultPaymentMethods;
  }

  static validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isCurrencySupported(this.getCurrency())) {
      errors.push(`Devise non supportée: ${this.getCurrency()}`);
    }

    const timeout = this.getWebhookTimeout();
    if (timeout < 1000 || timeout > 10000) {
      errors.push(`Timeout webhook invalide: ${timeout}ms (doit être entre 1000 et 10000ms)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 