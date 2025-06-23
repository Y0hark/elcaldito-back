/**
 * commande controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::commande.commande', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a commande');
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
    // Création de la commande sans user
    const response = await super.create(ctx);
    strapi.log.info('Résultat super.create(ctx): ' + JSON.stringify(response));
    // Récupération de l'id selon le format de retour
    const commandeId = response?.data?.id || response?.id;
    if (!commandeId) {
      strapi.log.error('Impossible de récupérer l\'id de la commande après création.');
      return response;
    }
    // Mise à jour native pour lier le user
    await strapi.db.query('api::commande.commande').update({
      where: { id: commandeId },
      data: { user: user.id }
    });
    // On retourne la commande mise à jour
    const updatedCommande = await strapi.entityService.findOne('api::commande.commande', commandeId, { populate: ['user'] });
    return { data: updatedCommande };
  },
}));
