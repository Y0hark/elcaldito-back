/**
 * user-info service
 */

import { factories } from '@strapi/strapi';
import { ApplicationError } from '@strapi/utils/dist/errors';

export default factories.createCoreService('api::user-info.user-info');

/**
 * Valide les données user-info
 * @param data Les données à valider
 */
export async function validateUserInfo(data: any): Promise<void> {
  // Validation du téléphone (requis)
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    throw new ApplicationError("Le téléphone est requis et doit être une chaîne non vide.");
  }

  // Validation du format du téléphone (optionnel mais recommandé)
  const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
  if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
    throw new ApplicationError("Le format du téléphone n'est pas valide. Utilisez un format français (ex: 0612345678 ou +33123456789).");
  }

  // Validation de l'adresse (optionnelle mais si présente, doit être une chaîne)
  if (data.address !== undefined && (typeof data.address !== 'string' || data.address.trim().length === 0)) {
    throw new ApplicationError("L'adresse doit être une chaîne non vide si elle est fournie.");
  }
}

/**
 * Récupère les user-info d'un utilisateur
 * @param userId L'ID de l'utilisateur
 */
export async function getUserInfoByUserId(userId: number) {
  return await strapi.db.query('api::user-info.user-info').findOne({
    where: { user: userId },
    populate: ['user']
  });
}

/**
 * Vérifie si un utilisateur a déjà des user-info
 * @param userId L'ID de l'utilisateur
 */
export async function hasUserInfo(userId: number): Promise<boolean> {
  const userInfo = await strapi.db.query('api::user-info.user-info').findOne({
    where: { user: userId },
    select: ['id']
  });
  return !!userInfo;
}
