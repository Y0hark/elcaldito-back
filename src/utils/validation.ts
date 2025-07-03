/**
 * Utilitaires de validation pour les données Stripe et commandes
 */

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

export interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  [key: string]: any;
}

export class ValidationUtils {
  static isValidStripeEvent(event: any): event is StripeEvent {
    return (
      event &&
      typeof event.id === 'string' &&
      typeof event.type === 'string' &&
      event.data &&
      event.data.object
    );
  }

  static getStripeObjectId(event: any): string | null {
    if (!this.isValidStripeEvent(event)) {
      return null;
    }
    return event.data.object.id || null;
  }

  static isValidPaymentIntent(paymentIntent: any): paymentIntent is PaymentIntentData {
    return (
      paymentIntent &&
      typeof paymentIntent.id === 'string' &&
      typeof paymentIntent.amount === 'number' &&
      typeof paymentIntent.currency === 'string' &&
      typeof paymentIntent.status === 'string'
    );
  }

  static validateCommandeData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('Données de commande manquantes');
      return { isValid: false, errors };
    }

    if (!data.quantite || data.quantite <= 0) {
      errors.push('Quantité doit être un nombre positif');
    }

    if (!data.event) {
      errors.push('Événement requis');
    }

    if (data.paymentMethod === 'stripe' && !data.stripePaymentIntentId) {
      errors.push('Payment Intent ID requis pour les paiements Stripe');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAmount(amount: number): boolean {
    return typeof amount === 'number' && amount > 0;
  }

  static validateCurrency(currency: string): boolean {
    const validCurrencies = ['eur', 'usd', 'gbp'];
    return validCurrencies.includes(currency.toLowerCase());
  }
} 