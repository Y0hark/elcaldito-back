/**
 * user-info controller
 */

import { factories } from '@strapi/strapi'
import { validateUserInfo } from '../services/user-info';

export default factories.createCoreController('api::user-info.user-info', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to create user info');
    }

    // Vérifier si l'utilisateur a déjà des user-info
    const existingUserInfo = await strapi.db.query('api::user-info.user-info').findOne({
      where: { user: user.id }
    });

    if (existingUserInfo) {
      return ctx.badRequest('User info already exists for this user. Use update instead.');
    }

    // Validation des données
    try {
      await validateUserInfo(ctx.request.body.data);
    } catch (error) {
      return ctx.badRequest(error.message);
    }

    // On retire le champ user du body s'il existe
    if (ctx.request.body.data.user) {
      delete ctx.request.body.data.user;
    }

    // Création du user-info sans user
    const response = await super.create(ctx);
    const userInfoId = response?.data?.id || response?.id;
    
    if (!userInfoId) {
      return response;
    }

    // Liaison du user au user-info (update natif)
    await strapi.db.query('api::user-info.user-info').update({
      where: { id: userInfoId },
      data: { user: user.id }
    });

    // Retourne le user-info mis à jour avec le user lié
    const updatedUserInfo = await strapi.entityService.findOne('api::user-info.user-info', userInfoId, { 
      populate: ['user'] 
    });
    
    return { data: updatedUserInfo };
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to update user info');
    }

    // Vérifier que l'utilisateur ne peut modifier que ses propres user-info
    const userInfoId = ctx.params.id;
    const existingUserInfo = await strapi.db.query('api::user-info.user-info').findOne({
      where: { id: userInfoId },
      populate: ['user']
    });

    if (!existingUserInfo) {
      return ctx.notFound('User info not found');
    }

    if (existingUserInfo.user?.id !== user.id) {
      return ctx.forbidden('You can only update your own user info');
    }

    // Validation des données
    try {
      await validateUserInfo(ctx.request.body.data);
    } catch (error) {
      return ctx.badRequest(error.message);
    }

    // On retire le champ user du body s'il existe
    const updateData = { ...ctx.request.body.data };
    if (updateData.user) {
      delete updateData.user;
    }

    // Mise à jour du user-info avec strapi.entityService.update
    const updatedUserInfo = await strapi.entityService.update('api::user-info.user-info', userInfoId, {
      data: updateData,
      populate: ['user']
    });
    
    return { data: updatedUserInfo };
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to view user info');
    }

    const userInfoId = ctx.params.id;
    const userInfo = await strapi.db.query('api::user-info.user-info').findOne({
      where: { id: userInfoId },
      populate: ['user']
    });

    if (!userInfo) {
      return ctx.notFound('User info not found');
    }

    // Vérifier que l'utilisateur ne peut voir que ses propres user-info
    if (userInfo.user?.id !== user.id) {
      return ctx.forbidden('You can only view your own user info');
    }

    return { data: userInfo };
  },

  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to view user info');
    }

    // L'utilisateur ne peut voir que ses propres user-info
    const userInfo = await strapi.db.query('api::user-info.user-info').findOne({
      where: { user: user.id },
      populate: ['user']
    });

    return { data: userInfo };
  }
}));
