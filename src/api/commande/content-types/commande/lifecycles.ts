import { validateCommande } from '../../services/commande';

export default {
  async beforeCreate(event: any) {
    await validateCommande(event);
  },
  async beforeUpdate(event: any) {
    const data = event.params.data;
    const keys = Object.keys(data);
    // ✅ Si uniquement "user" ou "user" + "updatedAt", on skip
    const isOnlyUserUpdate = keys.every(k => ['user', 'updatedAt'].includes(k));
    if (isOnlyUserUpdate) {
      return;
    }
    await validateCommande(event);
  },
};