/**
 * prochaine-marmite service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::prochaine-marmite.prochaine-marmite', ({ strapi }) => ({
  /**
   * Décrémente la disponibilité d'une marmite après succès d'une commande
   * @param marmiteId - l'id de la marmite
   * @param quantite - la quantité à retirer
   */
  async decrementDisponibilite(marmiteId: number, quantite: number) {
    return await strapi.db.transaction(async (transaction) => {
      const marmite = await strapi.db.query('api::prochaine-marmite.prochaine-marmite').findOne({
        where: { id: marmiteId },
        select: ['disponibilite'],
        transacting: transaction,
      } as any);
  
      if (!marmite) {
        throw new Error(`Marmite ${marmiteId} introuvable`);
      }
  
      const nouvelleDispo = marmite.disponibilite - quantite;
  
      if (nouvelleDispo < 0) {
        throw new Error(`Disponibilité négative pour la marmite ${marmiteId}`);
      }
  
      await strapi.db.query('api::prochaine-marmite.prochaine-marmite').update({
        where: { id: marmiteId },
        data: { disponibilite: nouvelleDispo },
        transacting: transaction,
      } as any);
  
      return nouvelleDispo;
    });
  }
  
}));
