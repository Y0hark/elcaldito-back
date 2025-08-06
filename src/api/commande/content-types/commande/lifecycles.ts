import { validateCommande } from '../../services/commande';
import { Logger } from '../../../../utils/logger';
import { Axios } from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const axios = new Axios()

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
    Logger.info('Admin update - Champs modifiés', {
      keys,
      values: data,
      commandeId: event.params.where?.id
    });

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
  async afterCreate(event: any) {
    const { result } = event;
  
    if (!SLACK_WEBHOOK_URL) {
      Logger.warning('SLACK_WEBHOOK_URL is not defined');
      return;
    }
    console.log(result)
    const payload = {
      text: `📦 Nouvelle commande #${result.id}\nQuantité: ${result.quantite}\nMéthode: ${result.paymentMethod}\nMontant: ${result.amount}\nEn livraison: ${result.livraison}\nEmail: ${result.user.email}`,
    };
  
    try {
      await axios.post(SLACK_WEBHOOK_URL, JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      Logger.info('✅ Message envoyé sur Slack pour la commande', { commandeId: result.id });
    } catch (error) {
      Logger.error('❌ Échec de l’envoi sur Slack', error);
    }
  }
};

