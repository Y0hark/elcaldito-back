/**
 * article controller
 */

import { factories } from '@strapi/strapi'

const customController = ({ strapi }) => ({
  async findBySlug(ctx) {
    const { slug } = ctx.params;
    const entity = await strapi.service('api::article.article').findBySlug(slug);
    if (!entity) {
      return ctx.notFound('Article not found');
    }
    return entity;
  },
});

export default factories.createCoreController('api::article.article', ({ strapi }) => customController({ strapi }));
