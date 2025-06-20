import { validateCommande } from '../../services/commande';

export default {
  async beforeCreate(event: any) {
    await validateCommande(event);
  },
  async beforeUpdate(event: any) {
    await validateCommande(event);
  },
};