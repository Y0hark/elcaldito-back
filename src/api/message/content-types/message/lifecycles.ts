
import { Logger } from '../../../../utils/logger';
import { Axios } from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const axios = new Axios()

export default {
  async afterCreate(event: any) {
    const { result } = event;
  
    if (!SLACK_WEBHOOK_URL) {
      Logger.warning('SLACK_WEBHOOK_URL is not defined');
      return;
    }
    const fullText = result.content.map(block => block.children.map(child => child.text).join('')).join('\n');
    const payload = {
      text: `📨 Nouveau message de #${result.name}\nSujet: ${result.sujet}\nContenu: ${fullText}\nEmail: ${result.email}`,
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

