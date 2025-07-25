/**
 * article service
 */

import { factories } from '@strapi/strapi';

const customService = ({ strapi }) => ({
  async findBySlug(slug) {
    const entries = await strapi.entityService.findMany('api::article.article', {
      filters: { slug },
      populate: '*',
      limit: 1,
    });
    return entries && entries.length > 0 ? entries[0] : null;
  },
});

export default factories.createCoreService('api::article.article', ({ strapi }) => customService({ strapi }));
