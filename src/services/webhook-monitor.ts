/**
 * Service de monitoring pour les webhooks Stripe
 */

export interface WebhookEvent {
  id: string;
  type: string;
  objectId: string;
  status: 'processed' | 'failed' | 'unmatched';
  error?: string;
  timestamp: Date;
  retryCount: number;
}

export interface FailedWebhook {
  eventId: string;
  eventType: string;
  objectId: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export class WebhookMonitor {
  private static events: Map<string, WebhookEvent> = new Map();
  private static failedWebhooks: FailedWebhook[] = [];

  static trackEvent(eventId: string, eventType: string, objectId: string): void {
    this.events.set(eventId, {
      id: eventId,
      type: eventType,
      objectId,
      status: 'processed',
      timestamp: new Date(),
      retryCount: 0
    });
  }

  static markEventFailed(eventId: string, error: string): void {
    const event = this.events.get(eventId);
    if (event) {
      event.status = 'failed';
      event.error = error;
      event.retryCount++;
    }

    // Ajouter aux webhooks échoués
    this.failedWebhooks.push({
      eventId,
      eventType: event?.type || 'unknown',
      objectId: event?.objectId || 'unknown',
      error,
      timestamp: new Date(),
      retryCount: event?.retryCount || 1
    });

    // Garder seulement les 100 derniers échecs
    if (this.failedWebhooks.length > 100) {
      this.failedWebhooks = this.failedWebhooks.slice(-100);
    }
  }

  static markEventUnmatched(eventId: string, eventType: string, objectId: string): void {
    this.events.set(eventId, {
      id: eventId,
      type: eventType,
      objectId,
      status: 'unmatched',
      timestamp: new Date(),
      retryCount: 0
    });
  }

  static getStats(): {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    unmatchedEvents: number;
    recentFailures: FailedWebhook[];
  } {
    const events = Array.from(this.events.values());
    const processed = events.filter(e => e.status === 'processed').length;
    const failed = events.filter(e => e.status === 'failed').length;
    const unmatched = events.filter(e => e.status === 'unmatched').length;

    return {
      totalEvents: events.length,
      processedEvents: processed,
      failedEvents: failed,
      unmatchedEvents: unmatched,
      recentFailures: this.failedWebhooks.slice(-10) // 10 derniers échecs
    };
  }

  static getFailedWebhooks(): FailedWebhook[] {
    return [...this.failedWebhooks];
  }

  static getUnmatchedEvents(): WebhookEvent[] {
    return Array.from(this.events.values()).filter(e => e.status === 'unmatched');
  }

  static clearOldEvents(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    // Nettoyer les événements anciens
    for (const [eventId, event] of this.events.entries()) {
      if (event.timestamp < cutoff) {
        this.events.delete(eventId);
      }
    }

    // Nettoyer les webhooks échoués anciens
    this.failedWebhooks = this.failedWebhooks.filter(
      webhook => webhook.timestamp > cutoff
    );
  }
} 