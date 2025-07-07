import type { Core } from '@strapi/strapi';
import { Logger } from './utils/logger';
import { loggingManager } from './config/logging';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    // Initialiser le système de logging
    loggingManager;
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Les routes sont maintenant définies dans src/api/commande/routes/commande.ts
    Logger.success('Serveur Strapi démarré avec les routes de commande configurées', {
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown'
    });
  },
};
