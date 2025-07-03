/**
 * commande controller
 */

import { factories } from '@strapi/strapi'
import Stripe from 'stripe';
import { Logger, ErrorHandler, LogContext } from '../../../utils/logger';
import { ValidationUtils, StripeEvent } from '../../../utils/validation';
import { StripeConfigManager } from '../../../config/stripe-config';
import { WebhookMonitor } from '../../../services/webhook-monitor';

export default factories.createCoreController('api::commande.commande', ({ strapi }) => {
  const stripeConfig = strapi.config.get('stripe') as { 
    stripeSecretKey: string; 
    webhookSecret: string; 
  };
  
  // Log pour debug
  console.log('Configuration Stripe chargée:', {
    hasSecretKey: !!stripeConfig.stripeSecretKey,
    hasWebhookSecret: !!stripeConfig.webhookSecret,
    webhookSecretLength: stripeConfig.webhookSecret?.length || 0
  });
  
  const stripe = new Stripe(stripeConfig.stripeSecretKey, {
    apiVersion: '2025-05-28.basil',
  });

  return {
    async create(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('You must be logged in to create une commande');
      }
      
      // On retire le champ user du body s'il existe
      if (ctx.request.body.data.user) {
        delete ctx.request.body.data.user;
      }
      
      // Correction automatique du champ event si format { set: [{ id: ... }] }
      if (
        ctx.request.body.data.event &&
        typeof ctx.request.body.data.event === 'object' &&
        ctx.request.body.data.event.set?.[0]?.id
      ) {
        ctx.request.body.data.event = ctx.request.body.data.event.set[0].id;
      }
      
      // Ajouter le user directement dans les données de création
      let commandeData = {
        ...ctx.request.body.data,
        user: user.id
      };

      // Si stripePaymentIntentId est présent, le copier dans paymentIntent et mettre paymentStatus à 'pending'
      if (commandeData.stripePaymentIntentId) {
        commandeData.paymentIntent = commandeData.stripePaymentIntentId;
        commandeData.paymentStatus = 'pending';
        delete commandeData.stripePaymentIntentId;
      }
      
      // Création de la commande avec le user
      const response = await strapi.entityService.create('api::commande.commande', {
        data: commandeData,
        populate: ['user']
      });
      
      return { data: response };
    },

    async createWithPayment(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('You must be logged in to create une commande');
      }

      const { commandeData, stripePaymentIntentId } = ctx.request.body;

      if (!commandeData || !stripePaymentIntentId) {
        return ctx.badRequest('Données de commande et Payment Intent ID requis');
      }

      try {
        // Vérifier que le Payment Intent existe
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        
        // On retire le champ user du body s'il existe
        if (commandeData.user) {
          delete commandeData.user;
        }
        
        // Correction automatique du champ event si format { set: [{ id: ... }] }
        if (
          commandeData.event &&
          typeof commandeData.event === 'object' &&
          commandeData.event.set?.[0]?.id
        ) {
          commandeData.event = commandeData.event.set[0].id;
        }
        
        // Ajouter le user et les informations de paiement
        const finalCommandeData = {
          ...commandeData,
          user: user.id,
          paymentIntent: stripePaymentIntentId,
          paymentStatus: 'pending', // Statut initial
          amount: paymentIntent.amount / 100,
          state: 'En attente' // Le webhook mettra à jour le statut
        };
        
        // Log pour debug
        console.log('finalCommandeData:', finalCommandeData);
        
        // Création de la commande avec le user
        const response = await strapi.entityService.create('api::commande.commande', {
          data: finalCommandeData,
          populate: ['user']
        });
        
        console.log('Commande créée en attente de paiement:', {
          commandeId: response.id,
          stripePaymentIntentId,
          amount: paymentIntent.amount / 100,
          status: 'pending'
        });

        // Vérifier immédiatement le statut du paiement avec Stripe
        try {
          const currentPaymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
          console.log('🔍 Statut actuel du Payment Intent:', {
            paymentIntentId: stripePaymentIntentId,
            status: currentPaymentIntent.status
          });

          // Si le paiement est déjà confirmé, mettre à jour la commande
          if (currentPaymentIntent.status === 'succeeded') {
            const updatedCommande = await strapi.entityService.update('api::commande.commande', response.id, {
              data: {
                paymentStatus: 'succeeded',
                state: 'Validée',
                amount: currentPaymentIntent.amount / 100
              },
              populate: ['user']
            });

            console.log('✅ Commande mise à jour avec paiement confirmé:', {
              commandeId: response.id,
              paymentStatus: 'succeeded',
              state: 'Validée'
            });

            return { data: updatedCommande };
          }
        } catch (syncError) {
          console.error('⚠️ Erreur lors de la vérification du statut:', syncError);
          // On continue avec la commande en statut pending
        }
        
        return { data: response };
      } catch (error) {
        console.error('Erreur lors de la création de la commande avec paiement:', error);
        return ctx.badRequest('Erreur lors de la création de la commande');
      }
    },

    async update(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('You must be logged in to update une commande');
      }

      const commandeId = ctx.params.id;
      
      try {
        // Vérifier que l'utilisateur ne peut modifier que ses propres commandes
        const existingCommande = await strapi.entityService.findOne('api::commande.commande', commandeId, {
          populate: ['user']
        }) as any;

        if (!existingCommande) {
          return ctx.notFound('Commande not found');
        }

        // Vérifier que l'utilisateur est propriétaire de la commande
        if (!existingCommande.user || existingCommande.user.id !== user.id) {
          return ctx.forbidden('You can only update your own commandes');
        }

        // On retire le champ user du body s'il existe
        const updateData = { ...ctx.request.body.data };
        if (updateData.user) {
          delete updateData.user;
        }

        // Mise à jour de la commande
        const updatedCommande = await strapi.entityService.update('api::commande.commande', commandeId, {
          data: updateData,
          populate: ['user']
        });

        return { data: updatedCommande };
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return ctx.badRequest('Erreur lors de la mise à jour de la commande');
      }
    },

    async createPaymentIntent(ctx) {
      const context: LogContext = {
        userId: ctx.state.user?.id
      };

      const { amount, currency = StripeConfigManager.getCurrency() } = ctx.request.body;

      // Validation du montant
      if (!ValidationUtils.validateAmount(amount)) {
        return ErrorHandler.handleValidationError(ctx, 'Montant invalide', context);
      }

      // Validation de la devise
      if (!StripeConfigManager.isCurrencySupported(currency)) {
        return ErrorHandler.handleValidationError(ctx, `Devise non supportée: ${currency}`, context);
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Montant en centimes
          currency: currency.toLowerCase(),
          payment_method_types: StripeConfigManager.getPaymentMethods(),
        });

        Logger.success('Payment Intent créé', {
          ...context,
          paymentIntentId: paymentIntent.id,
          amount: amount,
          currency: currency
        });

        return { 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        };
      } catch (error) {
        return ErrorHandler.handlePaymentError(ctx, error as Error, context);
      }
    },

    async updatePaymentStatus(ctx) {
      const { commandeId, paymentIntentId, paymentStatus } = ctx.request.body;

      if (!commandeId || !paymentIntentId) {
        return ctx.badRequest('Commande ID et Payment Intent ID requis');
      }

      try {
        // Récupérer le Payment Intent depuis Stripe pour vérifier le statut
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Déterminer le statut final
        const finalStatus = paymentStatus || paymentIntent.status;
        
        // Mettre à jour la commande dans la base de données
        const updatedCommande = await strapi.entityService.update('api::commande.commande', commandeId, {
          data: {
            paymentStatus: finalStatus,
            paymentIntent: paymentIntentId,
            amount: paymentIntent.amount / 100,
            // Si le paiement a échoué, marquer la commande comme annulée
            state: finalStatus === 'succeeded' ? 'Validée' : 'Annulée'
          },
          populate: ['user']
        });

        console.log('Commande mise à jour:', {
          commandeId,
          paymentIntentId,
          amount: paymentIntent.amount / 100,
          status: finalStatus,
          state: updatedCommande.state
        });

        return { 
          success: true, 
          status: finalStatus,
          amount: paymentIntent.amount / 100,
          commande: updatedCommande,
          message: finalStatus === 'succeeded' 
            ? 'Paiement traité avec succès' 
            : 'Paiement échoué - commande annulée'
        };
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        
        // Si l'erreur vient de Stripe, essayer de mettre à jour juste la commande
        if (error.type === 'StripeError') {
          try {
            const updatedCommande = await strapi.entityService.update('api::commande.commande', commandeId, {
              data: {
                paymentStatus: 'failed',
                state: 'Annulée'
              }
            });
            
            return {
              success: false,
              status: 'failed',
              commande: updatedCommande,
              message: 'Paiement échoué - commande annulée'
            };
          } catch (dbError) {
            console.error('Erreur lors de la mise à jour de la commande:', dbError);
          }
        }
        
        return ctx.badRequest('Erreur lors de la mise à jour du statut de paiement');
      }
    },

    async cancelCommande(ctx) {
      const { commandeId } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to cancel une commande');
      }

      try {
        // Vérifier que l'utilisateur est propriétaire de la commande
        const existingCommande = await strapi.entityService.findOne('api::commande.commande', commandeId, {
          populate: ['user']
        }) as any;

        if (!existingCommande) {
          return ctx.notFound('Commande not found');
        }

        if (!existingCommande.user || existingCommande.user.id !== user.id) {
          return ctx.forbidden('You can only cancel your own commandes');
        }

        // Annuler la commande
        const updatedCommande = await strapi.entityService.update('api::commande.commande', commandeId, {
          data: {
            state: 'Annulée',
            paymentStatus: 'canceled',
            cancelled: true
          },
          populate: ['user']
        });

        console.log('Commande annulée:', {
          commandeId,
          userId: user.id,
          state: updatedCommande.state
        });

        return { 
          success: true, 
          data: updatedCommande,
          message: 'Commande annulée avec succès'
        };
      } catch (error) {
        console.error('Erreur lors de l\'annulation de la commande:', error);
        return ctx.badRequest('Erreur lors de l\'annulation de la commande');
      }
    },

    async cleanupOrphanedCommandes(ctx) {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('You must be logged in to cleanup commandes');
      }

      try {
        // Trouver les commandes de l'utilisateur qui n'ont pas de paiement réussi
        const orphanedCommandes = await strapi.entityService.findMany('api::commande.commande', {
          filters: {
            user: user.id,
            $or: [
              { paymentStatus: { $ne: 'succeeded' } },
              { paymentStatus: null },
              { state: 'En attente' }
            ]
          },
          populate: ['user']
        });

        let deletedCount = 0;
        for (const commande of orphanedCommandes) {
          await strapi.entityService.delete('api::commande.commande', commande.id);
          deletedCount++;
        }

        console.log('Commandes orphelines supprimées:', {
          userId: user.id,
          deletedCount
        });

        return {
          success: true,
          deletedCount,
          message: `${deletedCount} commande(s) orpheline(s) supprimée(s)`
        };
      } catch (error) {
        console.error('Erreur lors du nettoyage des commandes orphelines:', error);
        return ctx.badRequest('Erreur lors du nettoyage des commandes');
      }
    },

    async handleStripeWebhook(ctx) {
      const context: LogContext = {
        eventType: 'webhook_received',
        url: ctx.request.url,
        method: ctx.request.method
      };

      Logger.webhook('Début du traitement', context);
      
      const sig = ctx.request.headers['stripe-signature'];
      const endpointSecret = stripeConfig.webhookSecret;

      // Validation de la configuration
      const configValidation = StripeConfigManager.validateConfig();
      if (!configValidation.isValid) {
        Logger.error('Configuration Stripe invalide', undefined, context);
        return ErrorHandler.handleWebhookError(ctx, new Error(configValidation.errors.join(', ')), context);
      }

      let event: any;

      try {
        const body = ctx.request.body;
        
        // Validation de l'événement Stripe
        if (!ValidationUtils.isValidStripeEvent(body)) {
          Logger.error('Événement Stripe invalide', undefined, context);
          return ErrorHandler.handleWebhookError(ctx, new Error('Événement Stripe invalide'), context);
        }

        const objectId = ValidationUtils.getStripeObjectId(body);
        if (!objectId) {
          Logger.error('ID d\'objet Stripe manquant', undefined, context);
          return ErrorHandler.handleWebhookError(ctx, new Error('ID d\'objet Stripe manquant'), context);
        }

        // En développement, accepter sans vérification de signature
        if (process.env.NODE_ENV === 'development') {
          event = body;
          Logger.webhook('Mode développement : signature ignorée', { ...context, objectId });
        } else {
          // En production, vérifier la signature
          const rawBody = (ctx.request as any).rawBody;
          if (rawBody && endpointSecret) {
            event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
            Logger.webhook('Signature vérifiée avec succès', { ...context, objectId });
          } else {
            event = body;
            Logger.warning('Utilisation du body sans vérification de signature', { ...context, objectId });
          }
        }
        
        Logger.webhook('Événement validé', { 
          ...context, 
          eventId: event.id, 
          eventType: event.type, 
          objectId 
        });

        // Tracker l'événement
        WebhookMonitor.trackEvent(event.id, event.type, objectId);
        
      } catch (error) {
        WebhookMonitor.markEventFailed(event?.id || 'unknown', (error as Error).message);
        return ErrorHandler.handleWebhookError(ctx, error as Error, context);
      }

      // Répondre immédiatement pour éviter le timeout
      ctx.body = { received: true };
      ctx.status = 200;

      // Traiter l'événement de manière asynchrone
      setImmediate(() => {
        this.processWebhookEvent(event).catch(error => {
          Logger.error('Erreur lors du traitement asynchrone du webhook', error, context);
        });
      });

      return;
    },

    async processWebhookEvent(event: any) {
      const context: LogContext = {
        eventType: event.type,
        eventId: event.id
      };

      Logger.webhook(`Traitement de l'événement: ${event.type}`, context);

      try {
        switch (event.type) {
          case 'payment_intent.succeeded':
            Logger.success('Traitement paiement réussi', context);
            await this.handlePaymentSucceeded(event.data.object);
            break;
          case 'payment_intent.payment_failed':
            Logger.error('Traitement paiement échoué', undefined, context);
            await this.handlePaymentFailed(event.data.object);
            break;
          case 'payment_intent.canceled':
            Logger.warning('Traitement paiement annulé', context);
            await this.handlePaymentCanceled(event.data.object);
            break;
          default:
            Logger.warning(`Événement non géré: ${event.type}`, context);
            WebhookMonitor.markEventUnmatched(event.id, event.type, event.data?.object?.id || 'unknown');
        }
      } catch (error) {
        Logger.error('Erreur lors du traitement du webhook', error as Error, context);
        WebhookMonitor.markEventFailed(event.id, (error as Error).message);
      }
    },

    async handlePaymentSucceeded(paymentIntent: any) {
      const context: LogContext = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      };

      Logger.stripe('Paiement réussi', context);
      
      try {
        // Validation du Payment Intent
        if (!ValidationUtils.isValidPaymentIntent(paymentIntent)) {
          Logger.error('Payment Intent invalide', undefined, context);
          return;
        }

        // Trouver la commande avec ce Payment Intent
        const commandes = await strapi.entityService.findMany('api::commande.commande', {
          filters: {
            paymentIntent: paymentIntent.id
          },
          populate: ['user']
        });

        Logger.info(`Recherche commande pour Payment Intent: ${paymentIntent.id}`, {
          ...context,
          commandesFound: commandes ? commandes.length : 0
        });

        if (commandes && commandes.length > 0) {
          const commandeToUpdate = commandes[0];
          
          Logger.info('Mise à jour commande', {
            ...context,
            commandeId: commandeToUpdate.id,
            ancienStatus: commandeToUpdate.paymentStatus,
            ancienState: commandeToUpdate.state
          });
          
          // Utiliser strapi.entityService.update qui gère automatiquement les colonnes
          let updatedCommande = null;
          
          try {
            // Essayer d'abord avec une requête SQL directe pour éviter les problèmes de mapping
            const db = strapi.db.connection;
            
            // Vérifier si la colonne paymentStatus existe
            const tableInfo = await db.raw("PRAGMA table_info(commandes)");
            const hasPaymentStatus = tableInfo.some(col => col.name === 'paymentStatus');
            
            if (!hasPaymentStatus) {
              Logger.warning('Colonne paymentStatus manquante, ajout en cours...', context);
              
              // Ajouter la colonne paymentStatus si elle n'existe pas
              await db.raw(`
                ALTER TABLE commandes 
                ADD COLUMN paymentStatus TEXT DEFAULT 'pending'
              `);
              
              Logger.success('Colonne paymentStatus ajoutée', context);
            }
            
            // Mise à jour avec SQL direct (utiliser les colonnes existantes)
            Logger.info('Exécution de la requête SQL de mise à jour', {
              ...context,
              commandeId: commandeToUpdate.id,
              sql: `UPDATE commandes SET payment_status = 'succeeded', state = 'Validée', amount = ${paymentIntent.amount / 100}, updated_at = datetime('now') WHERE id = ${commandeToUpdate.id}`
            });
            
            await db.raw(`
              UPDATE commandes 
              SET payment_status = ?, paymentStatus = ?, state = ?, amount = ?, updated_at = datetime('now')
              WHERE id = ?
            `, ['succeeded', 'succeeded', 'Validée', paymentIntent.amount / 100, commandeToUpdate.id]);
            
            Logger.info('Requête SQL exécutée avec succès', {
              ...context,
              commandeId: commandeToUpdate.id
            });
            
            // Récupérer la commande mise à jour
            updatedCommande = await strapi.entityService.findOne('api::commande.commande', commandeToUpdate.id, {
              populate: ['user']
            });
            
            Logger.info('Commande récupérée après mise à jour', {
              ...context,
              commandeId: updatedCommande.id,
              paymentStatus: updatedCommande.paymentStatus,
              payment_status: updatedCommande.payment_status,
              state: updatedCommande.state,
              amount: updatedCommande.amount
            });
            
            Logger.success('Commande mise à jour avec succès via SQL direct', {
              ...context,
              commandeId: updatedCommande.id,
              nouveauStatus: updatedCommande.paymentStatus,
              nouveauState: updatedCommande.state
            });
            
          } catch (updateError) {
            Logger.error('Erreur lors de la mise à jour via SQL direct', updateError as Error, context);
            
            // Fallback : essayer avec entityService
            try {
              updatedCommande = await strapi.entityService.update('api::commande.commande', commandeToUpdate.id, {
                data: {
                  paymentStatus: 'succeeded',
                  state: 'Validée',
                  amount: paymentIntent.amount / 100
                },
                populate: ['user']
              });
              
              Logger.success('Commande mise à jour avec succès via entityService fallback', {
                ...context,
                commandeId: updatedCommande.id
              });
            } catch (fallbackError) {
              Logger.error('Erreur fallback aussi', fallbackError as Error, context);
              
              // Dernier recours : essayer avec strapi.db.query
              try {
                await strapi.db.query('api::commande.commande').update({
                  where: { id: commandeToUpdate.id },
                  data: {
                    paymentStatus: 'succeeded',
                    state: 'Validée',
                    amount: paymentIntent.amount / 100
                  }
                });
                
                updatedCommande = await strapi.entityService.findOne('api::commande.commande', commandeToUpdate.id, {
                  populate: ['user']
                });
                
                Logger.success('Commande mise à jour avec succès via db.query fallback', {
                  ...context,
                  commandeId: updatedCommande.id
                });
              } catch (finalError) {
                Logger.error('Toutes les méthodes de mise à jour ont échoué', finalError as Error, context);
              }
            }
          }
        } else {
          Logger.warning('Aucune commande trouvée pour le Payment Intent', context);
          
          // Lister toutes les commandes récentes pour debug
          const recentCommandes = await strapi.entityService.findMany('api::commande.commande', {
            filters: {
              createdAt: {
                $gte: new Date(Date.now() - 5 * 60 * 1000) // 5 dernières minutes
              }
            },
            sort: { createdAt: 'desc' },
            limit: 10
          });
          
          Logger.info('Commandes récentes pour debug', {
            ...context,
            recentCommandes: recentCommandes.map(c => ({
              id: c.id,
              paymentIntent: c.paymentIntent,
              paymentStatus: c.paymentStatus,
              createdAt: c.createdAt
            }))
          });
        }
      } catch (error) {
        Logger.error('Erreur lors de la mise à jour de la commande', error as Error, context);
      }
    },

    async handlePaymentFailed(paymentIntent) {
      console.log('Paiement échoué:', paymentIntent.id);
      
      const commande = await strapi.entityService.findMany('api::commande.commande', {
        filters: {
          paymentIntent: paymentIntent.id
        },
        populate: ['user']
      });

      if (commande && commande.length > 0) {
        const commandeToUpdate = commande[0];
        
        await strapi.entityService.update('api::commande.commande', commandeToUpdate.id, {
          data: {
            paymentStatus: 'failed',
            state: 'Annulée'
          }
        });

        console.log('Commande marquée comme échouée:', {
          commandeId: commandeToUpdate.id,
          paymentIntentId: paymentIntent.id,
          status: 'failed'
        });
      }
    },

    async handlePaymentCanceled(paymentIntent) {
      console.log('Paiement annulé:', paymentIntent.id);
      
      const commande = await strapi.entityService.findMany('api::commande.commande', {
        filters: {
          paymentIntent: paymentIntent.id
        },
        populate: ['user']
      });

      if (commande && commande.length > 0) {
        const commandeToUpdate = commande[0];
        
        await strapi.entityService.update('api::commande.commande', commandeToUpdate.id, {
          data: {
            paymentStatus: 'canceled',
            state: 'Annulée',
            cancelled: true
          }
        });

        console.log('Commande annulée:', {
          commandeId: commandeToUpdate.id,
          paymentIntentId: paymentIntent.id,
          status: 'canceled'
        });
      }
    },

    async checkPaymentStatus(ctx) {
      const { commandeId } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to check payment status');
      }

      try {
        const commande = await strapi.entityService.findOne('api::commande.commande', commandeId, {
          populate: ['user']
        }) as any;

        if (!commande) {
          return ctx.notFound('Commande not found');
        }

        if (!commande.user || commande.user.id !== user.id) {
          return ctx.forbidden('You can only check your own commandes');
        }

        return {
          commandeId: commande.id,
          paymentStatus: commande.paymentStatus,
          state: commande.state,
          amount: commande.amount,
          paymentIntent: commande.paymentIntent
        };
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        return ctx.badRequest('Erreur lors de la vérification du statut');
      }
    },

    async syncPaymentStatus(ctx) {
      const { commandeId } = ctx.params;
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to sync payment status');
      }

      try {
        const commande = await strapi.entityService.findOne('api::commande.commande', commandeId, {
          populate: ['user']
        }) as any;

        if (!commande) {
          return ctx.notFound('Commande not found');
        }

        if (!commande.user || commande.user.id !== user.id) {
          return ctx.forbidden('You can only sync your own commandes');
        }

        if (!commande.paymentIntent) {
          return ctx.badRequest('Cette commande n\'a pas de Payment Intent Stripe');
        }

        // Vérifier le statut du Payment Intent avec Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(commande.paymentIntent);
        
        console.log('🔍 Statut Stripe pour Payment Intent:', {
          paymentIntentId: commande.paymentIntent,
          stripeStatus: paymentIntent.status,
          currentStatus: commande.paymentStatus
        });

        // Mettre à jour le statut selon Stripe
        let newPaymentStatus: 'pending' | 'succeeded' | 'failed' | 'canceled' = 'pending';
        let newState = commande.state;

        switch (paymentIntent.status) {
          case 'succeeded':
            newPaymentStatus = 'succeeded';
            newState = 'Validée';
            break;
          case 'canceled':
            newPaymentStatus = 'canceled';
            newState = 'Annulée';
            break;
          case 'requires_payment_method':
          case 'requires_confirmation':
          case 'requires_action':
            newPaymentStatus = 'pending';
            newState = 'En attente';
            break;
          default:
            newPaymentStatus = 'failed';
            newState = 'Annulée';
        }

        // Mettre à jour la commande si le statut a changé
        if (newPaymentStatus !== commande.paymentStatus || newState !== commande.state) {
          const updatedCommande = await strapi.entityService.update('api::commande.commande', commandeId, {
            data: {
              paymentStatus: newPaymentStatus,
              state: newState,
              amount: paymentIntent.amount / 100
            },
            populate: ['user']
          });

          console.log('✅ Statut de paiement synchronisé:', {
            commandeId,
            paymentIntentId: commande.paymentIntent,
            ancienStatus: commande.paymentStatus,
            nouveauStatus: newPaymentStatus,
            ancienState: commande.state,
            nouveauState: newState
          });

          return {
            success: true,
            commande: updatedCommande,
            message: 'Statut de paiement synchronisé avec Stripe'
          };
        } else {
          return {
            success: true,
            commande,
            message: 'Statut déjà à jour'
          };
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation du statut:', error);
        return ctx.badRequest('Erreur lors de la synchronisation du statut de paiement');
      }
    },

    async getWebhookStats(ctx) {
      // Route pour obtenir les statistiques des webhooks (admin seulement)
      const user = ctx.state.user;
      
      if (!user || !user.role || user.role.type !== 'admin') {
        return ctx.forbidden('Admin access required');
      }

      try {
        const stats = WebhookMonitor.getStats();
        const failedWebhooks = WebhookMonitor.getFailedWebhooks();
        const unmatchedEvents = WebhookMonitor.getUnmatchedEvents();

        return {
          stats,
          failedWebhooks: failedWebhooks.slice(-20), // 20 derniers échecs
          unmatchedEvents: unmatchedEvents.slice(-20), // 20 derniers événements non gérés
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return ErrorHandler.handleDatabaseError(ctx, error as Error, { userId: user.id });
      }
    },

    async clearWebhookHistory(ctx) {
      // Route pour nettoyer l'historique des webhooks (admin seulement)
      const user = ctx.state.user;
      
      if (!user || !user.role || user.role.type !== 'admin') {
        return ctx.forbidden('Admin access required');
      }

      try {
        const { maxAgeHours = 24 } = ctx.request.body;
        WebhookMonitor.clearOldEvents(maxAgeHours);

        return {
          success: true,
          message: `Historique nettoyé (événements de plus de ${maxAgeHours}h supprimés)`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return ErrorHandler.handleDatabaseError(ctx, error as Error, { userId: user.id });
      }
    },

    async diagnoseDatabase(ctx) {
      // Route pour diagnostiquer la base de données (admin seulement)
      const user = ctx.state.user;
      
      if (!user || !user.role || user.role.type !== 'admin') {
        return ctx.forbidden('Admin access required');
      }

      try {
        const db = strapi.db.connection;
        
        // Vérifier si la table commandes existe
        const tableExists = await db.schema.hasTable('commandes');
        if (!tableExists) {
          return {
            success: false,
            error: 'Table commandes n\'existe pas',
            timestamp: new Date().toISOString()
          };
        }
        
        // Vérifier les colonnes
        const columns = await db.raw("PRAGMA table_info(commandes)");
        const columnNames = columns.map(col => col.name);
        
        // Vérifier les colonnes requises (utiliser les noms existants)
        const requiredColumns = ['id', 'payment_status', 'updated_at', 'created_at', 'published_at'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        // Compter les commandes
        const commandesCount = await db.raw('SELECT COUNT(*) as count FROM commandes');
        
        // Compter les commandes sans paymentStatus
        const commandesWithoutStatus = await db.raw(`
          SELECT COUNT(*) as count 
          FROM commandes 
          WHERE paymentStatus IS NULL OR paymentStatus = ''
        `);
        
        return {
          success: true,
          tableExists: true,
          columns: columnNames,
          missingColumns,
          totalCommandes: commandesCount[0].count,
          commandesWithoutStatus: commandesWithoutStatus[0].count,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return ErrorHandler.handleDatabaseError(ctx, error as Error, { userId: user.id });
      }
    },

    async fixDatabase(ctx) {
      // Route pour corriger la base de données (admin seulement)
      const user = ctx.state.user;
      
      if (!user || !user.role || user.role.type !== 'admin') {
        return ctx.forbidden('Admin access required');
      }

      try {
        const db = strapi.db.connection;
        const results = [];
        
        // Vérifier les colonnes
        const columns = await db.raw("PRAGMA table_info(commandes)");
        const columnNames = columns.map(col => col.name);
        
        // Ajouter les colonnes manquantes (utiliser les noms existants)
        const requiredColumns = ['id', 'payment_status', 'updated_at', 'created_at', 'published_at'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
        
        for (const column of missingColumns) {
          try {
            switch (column) {
              case 'payment_status':
                await db.raw(`
                  ALTER TABLE commandes 
                  ADD COLUMN payment_status TEXT DEFAULT 'pending'
                `);
                break;
              case 'updated_at':
                await db.raw(`
                  ALTER TABLE commandes 
                  ADD COLUMN updated_at DATETIME
                `);
                break;
              case 'created_at':
                await db.raw(`
                  ALTER TABLE commandes 
                  ADD COLUMN created_at DATETIME
                `);
                break;
              case 'published_at':
                await db.raw(`
                  ALTER TABLE commandes 
                  ADD COLUMN published_at DATETIME
                `);
                break;
            }
            
            results.push(`✅ Colonne ${column} ajoutée`);
          } catch (error) {
            results.push(`❌ Erreur lors de l'ajout de ${column}: ${error.message}`);
          }
        }
        
        // Mettre à jour les commandes sans paymentStatus
        try {
          await db.raw(`
            UPDATE commandes 
            SET paymentStatus = 'pending' 
            WHERE paymentStatus IS NULL OR paymentStatus = ''
          `);
          results.push('✅ Commandes mises à jour avec paymentStatus par défaut');
        } catch (error) {
          results.push(`❌ Erreur lors de la mise à jour des commandes: ${error.message}`);
        }
        
        // Mettre à jour les commandes sans updatedAt
        try {
          await db.raw(`
            UPDATE commandes 
            SET updatedAt = datetime('now') 
            WHERE updatedAt IS NULL
          `);
          results.push('✅ Commandes mises à jour avec updatedAt');
        } catch (error) {
          results.push(`❌ Erreur lors de la mise à jour des updatedAt: ${error.message}`);
        }
        
        return {
          success: true,
          results,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return ErrorHandler.handleDatabaseError(ctx, error as Error, { userId: user.id });
      }
    }
  };
});
