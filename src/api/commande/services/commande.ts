/**
 * commande service
 */

import { factories } from '@strapi/strapi';
import { ApplicationError } from '@strapi/utils/dist/errors';

export default factories.createCoreService('api::commande.commande');

/**
 * Valide la commande (création ou mise à jour) en fonction de la disponibilité de la marmite
 * @param event L'event du lifecycle Strapi (contenant params.data et params.where)
 */
export async function validateCommande(event: any): Promise<void> {
  const { data, where } = event.params;

  // Ne valide la quantité que si elle est présente dans data
  if ('quantite' in data && (data.quantite === undefined || data.quantite <= 0)) {
    throw new ApplicationError("La quantité doit être un entier positif.");
  }

  // Skip validation for certain fields that don't affect availability
  const skipValidationFields = ['paymentStatus', 'paymentIntent', 'amount', 'commentaire'];
  const hasOnlySkipFields = Object.keys(data).every(key => skipValidationFields.includes(key));
  if (hasOnlySkipFields) {
    return;
  }

  await strapi.db.transaction(async (trx) => {
    // Gestion des différents formats d'event
    let marmiteId: number | undefined;
    const rawEvent = data.event;
    
    if (typeof rawEvent === 'string') {
      const marmite = await strapi.db.query('api::prochaine-marmite.prochaine-marmite').findOne({
        where: { documentId: rawEvent },
        select: ['id', 'disponibilite'],
        lock: { mode: 'pessimistic_write' },
        transacting: trx,
      } as any);
      if (!marmite) {
        throw new ApplicationError(`Aucune marmite trouvée pour l'identifiant ${rawEvent}`);
      }
      marmiteId = marmite.id;
      data.event = marmiteId;
    } else if (typeof rawEvent === 'object' && rawEvent.set?.[0]?.id) {
      marmiteId = rawEvent.set[0].id;
      data.event = marmiteId;
    } else if (typeof rawEvent === 'number') {
      marmiteId = rawEvent;
      data.event = marmiteId;
    } else if (rawEvent === undefined && where) {
      const commandeExistante = await strapi.db.query('api::commande.commande').findOne({ where });
      if (!commandeExistante) {
        throw new ApplicationError("Commande à mettre à jour introuvable.");
      }
      marmiteId = commandeExistante.event;
    } else if (rawEvent === undefined && !where) {
      // Skip validation if no event is provided and this is an update
      return;
    } else {
      throw new ApplicationError("Format de l'événement non reconnu.");
    }

    // Récupération de la marmite avec lock
    const marmite = await strapi.db.query('api::prochaine-marmite.prochaine-marmite').findOne({
      where: { id: marmiteId },
      select: ['disponibilite'],
      lock: { mode: 'pessimistic_write' },
      transacting: trx,
    } as any);
    if (!marmite) {
      throw new ApplicationError(`Marmite avec l'ID ${marmiteId} introuvable.`);
    }

    // Cas spécial : si on passe la commande à Annulée, on ne vérifie pas la dispo
    if (data.state === 'Annulée' && where) {
      const commandeExistante = await strapi.db.query('api::commande.commande').findOne({ where });
      if (commandeExistante && commandeExistante.state !== 'Annulée') {
        return;
      }
    }

    // Vérification finale sur la disponibilité
    const quantiteDemandee = data.quantite !== undefined ? data.quantite : (where ? (await strapi.db.query('api::commande.commande').findOne({ where }))?.quantite : 0);
    if (quantiteDemandee > marmite.disponibilite) {
      throw new ApplicationError(`Il ne reste que ${marmite.disponibilite} parts disponibles pour cette marmite.`);
    }

    // Mise à jour de la disponibilité en base
    await strapi.db.query('api::prochaine-marmite.prochaine-marmite').update({
      where: { id: marmiteId },
      data: { disponibilite: marmite.disponibilite - quantiteDemandee },
      transacting: trx,
    } as any);
  });
}

// Exemple dans le controller prochaine-marmite
async function getDisponibiliteRestante(marmiteId: number): Promise<number> {
  const marmite = await strapi.db.query('api::prochaine-marmite.prochaine-marmite').findOne({
    where: { id: marmiteId },
    select: ['portions_totales'],
  });
  if (!marmite) return 0;
  const commandes = await strapi.db.query('api::commande.commande').findMany({
    where: {
      event: marmiteId,
      publishedAt: { $notNull: true },
      state: { $ne: 'Annulé' },
    },
    select: ['quantite'],
  });
  const totalCommande = commandes.reduce((sum, cmd) => sum + (cmd.quantite || 0), 0);
  return marmite.portions_totales - totalCommande;
} 