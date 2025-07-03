import { validateCommande } from '../../services/commande';

function isEventChanged(dataEvent, existingEvent) {
  // Si dataEvent est un objet { connect: [], disconnect: [] } et les deux arrays sont vides, ce n'est pas un changement
  if (
    dataEvent &&
    typeof dataEvent === 'object' &&
    Array.isArray(dataEvent.connect) &&
    Array.isArray(dataEvent.disconnect) &&
    dataEvent.connect.length === 0 &&
    dataEvent.disconnect.length === 0
  ) {
    return false;
  }
  // Sinon, compare normalement
  return dataEvent !== undefined && dataEvent !== existingEvent;
}

export default {
  async beforeCreate(event: any) {
    await validateCommande(event);
  },
  async beforeUpdate(event: any) {
    const data = event.params.data;
    const keys = Object.keys(data);

    // Log pour debug
    console.log('[ADMIN UPDATE] Champs modifiés:', keys, 'Valeurs:', data);

    // Récupère la commande existante pour comparer les valeurs
    const id = event.params.where?.id;
    let existing = null;
    if (id) {
      existing = await strapi.db.query('api::commande.commande').findOne({ where: { id } });
    }

    // On ne valide QUE si la quantité change ou si l'event change vraiment
    const quantiteChanged = existing && data.quantite !== undefined && data.quantite !== existing.quantite;
    const eventChanged = existing && isEventChanged(data.event, existing.event);

    if (!quantiteChanged && !eventChanged) {
      // On skip la validation pour tout le reste
      return;
    }

    await validateCommande(event);
  },
};