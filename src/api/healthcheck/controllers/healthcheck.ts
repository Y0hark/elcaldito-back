export default {
  async index(ctx) {
    try {
      // Vérifier la connexion à la base de données
      await strapi.db.connection.raw('SELECT 1');
      
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      };
    }
  },
}; 