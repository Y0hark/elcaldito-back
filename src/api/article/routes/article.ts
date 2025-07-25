/**
 * article router
 */

import { factories } from '@strapi/strapi';

export default {
  routes: [
    // Routes par défaut
    {
      method: 'GET',
      path: '/articles',
      handler: 'article.find',
    },
    {
      method: 'GET',
      path: '/articles/:id',
      handler: 'article.findOne',
    },
    // Route personnalisée pour récupérer par slug
    {
      method: 'GET',
      path: '/articles/slug/:slug',
      handler: 'article.findBySlug',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
