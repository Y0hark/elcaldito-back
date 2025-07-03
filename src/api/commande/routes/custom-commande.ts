/**
 * Custom commande routes
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/commandes/create-payment-intent',
      handler: 'commande.createPaymentIntent',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'POST',
      path: '/commandes/create-with-payment',
      handler: 'commande.createWithPayment',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'POST',
      path: '/commandes/update-payment-status',
      handler: 'commande.updatePaymentStatus',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'POST',
      path: '/commandes/stripe-webhook',
      handler: 'commande.handleStripeWebhook',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
        description: 'Webhook Stripe pour les paiements',
        tag: {
          plugin: 'commande',
          name: 'Stripe Webhook',
          actionType: 'create'
        }
      }
    },
    {
      method: 'GET',
      path: '/commandes/:commandeId/payment-status',
      handler: 'commande.checkPaymentStatus',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'POST',
      path: '/commandes/:commandeId/sync-payment-status',
      handler: 'commande.syncPaymentStatus',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'GET',
      path: '/commandes/webhook-stats',
      handler: 'commande.getWebhookStats',
      config: {
        auth: {
          scope: ['admin']
        },
        description: 'Statistiques des webhooks Stripe (admin seulement)',
        tag: {
          plugin: 'commande',
          name: 'Webhook Stats',
          actionType: 'find'
        }
      }
    },
    {
      method: 'POST',
      path: '/commandes/clear-webhook-history',
      handler: 'commande.clearWebhookHistory',
      config: {
        auth: {
          scope: ['admin']
        },
        description: 'Nettoyer l\'historique des webhooks (admin seulement)',
        tag: {
          plugin: 'commande',
          name: 'Clear Webhook History',
          actionType: 'delete'
        }
      }
    },
    {
      method: 'GET',
      path: '/commandes/diagnose-database',
      handler: 'commande.diagnoseDatabase',
      config: {
        auth: {
          scope: ['admin']
        },
        description: 'Diagnostiquer la structure de la base de données (admin seulement)',
        tag: {
          plugin: 'commande',
          name: 'Diagnose Database',
          actionType: 'find'
        }
      }
    },
    {
      method: 'POST',
      path: '/commandes/fix-database',
      handler: 'commande.fixDatabase',
      config: {
        auth: {
          scope: ['admin']
        },
        description: 'Corriger la structure de la base de données (admin seulement)',
        tag: {
          plugin: 'commande',
          name: 'Fix Database',
          actionType: 'update'
        }
      }
    }
  ]
}; 