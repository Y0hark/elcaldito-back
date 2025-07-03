/**
 * commande router
 */

export default {
  routes: [
    // Routes par défaut
    {
      method: 'GET',
      path: '/commandes',
      handler: 'commande.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/commandes/:id',
      handler: 'commande.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/commandes',
      handler: 'commande.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/commandes/:id',
      handler: 'commande.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/commandes/:id',
      handler: 'commande.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Routes personnalisées
    {
      method: 'POST',
      path: '/commandes/create-with-payment',
      handler: 'commande.createWithPayment',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/commandes/create-payment-intent',
      handler: 'commande.createPaymentIntent',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/commandes/:id/payment-status',
      handler: 'commande.updatePaymentStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/commandes/:id/cancel',
      handler: 'commande.cancelCommande',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/commandes/cleanup-orphaned',
      handler: 'commande.cleanupOrphanedCommandes',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/commandes/stripe-webhook',
      handler: 'commande.handleStripeWebhook',
      config: {
        auth: false, // Désactiver l'authentification pour les webhooks Stripe
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/commandes/:id/payment-status',
      handler: 'commande.checkPaymentStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/commandes/:id/sync-payment-status',
      handler: 'commande.syncPaymentStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
