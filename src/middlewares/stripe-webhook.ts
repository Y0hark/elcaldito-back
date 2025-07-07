import { Context, Next } from 'koa';
import { Logger } from '../utils/logger';

export default (config, { strapi }) => {
  return async (ctx: Context, next: Next) => {
    // Vérifier si c'est la route du webhook Stripe
    if (ctx.path === '/api/commandes/stripe-webhook' && ctx.method === 'POST') {
      Logger.info('Middleware webhook - Route détectée', {
        path: ctx.path,
        method: ctx.method
      });
      
      // En mode développement, on peut ignorer la lecture du raw body
      // car on utilise le body parsé par Strapi
      if (process.env.NODE_ENV === 'development') {
        Logger.info('Mode développement : raw body ignoré');
        (ctx.request as any).rawBody = null;
      } else {
        // En production, essayer de lire le raw body avec un timeout court
        try {
          const rawBody = await new Promise<string>((resolve, reject) => {
            let data = '';
            const timeout = setTimeout(() => {
              reject(new Error('Timeout reading raw body'));
            }, 2000); // Timeout réduit à 2 secondes
            
            ctx.req.on('data', (chunk) => {
              data += chunk;
            });
            
            ctx.req.on('end', () => {
              clearTimeout(timeout);
              resolve(data);
            });
            
            ctx.req.on('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          (ctx.request as any).rawBody = rawBody;
          Logger.success('Raw body lu avec succès');
        } catch (error) {
          Logger.error('Erreur dans le middleware webhook', error as Error);
          (ctx.request as any).rawBody = null;
        }
      }
    }
    
    await next();
  };
}; 