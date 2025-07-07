import { Context, Next } from 'koa';
import { Logger } from '../utils/logger';

export default (config, { strapi }) => {
  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    const { method, path, url } = ctx.request;
    
    // Ignorer les requêtes de santé et les assets statiques
    if (path.includes('/health') || path.includes('/favicon') || path.includes('/uploads/')) {
      return await next();
    }

    try {
      // Exécuter la requête
      await next();
      
      const duration = Date.now() - startTime;
      const statusCode = ctx.status;
      
      // Logger la requête avec les métriques
      Logger.api(method, path, statusCode, duration, {
        url,
        userAgent: ctx.request.headers['user-agent'],
        ip: ctx.request.ip,
        userId: ctx.state.user?.id
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = ctx.status || 500;
      
      // Logger l'erreur
      Logger.api(method, path, statusCode, duration, {
        url,
        userAgent: ctx.request.headers['user-agent'],
        ip: ctx.request.ip,
        userId: ctx.state.user?.id,
        error: error.message
      });
      
      throw error;
    }
  };
}; 