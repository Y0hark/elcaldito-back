# 🔧 Guide de Résolution - Problème de Base de Données

## 🚨 Problème Identifié

L'erreur `Undefined column(s): [t0.id]` indique que la table `commandes` n'a pas la structure attendue par Strapi.

## 🛠️ Solution Rapide

### Étape 1: Diagnostiquer la Base de Données

Accédez à l'URL suivante (en tant qu'admin) :
```
GET /api/commandes/diagnose-database
```

Cette route vous donnera :
- Les colonnes existantes dans la table
- Les colonnes manquantes
- Le nombre de commandes
- Les commandes sans paymentStatus

### Étape 2: Corriger la Base de Données

Accédez à l'URL suivante (en tant qu'admin) :
```
POST /api/commandes/fix-database
```

Cette route va automatiquement :
- Ajouter les colonnes manquantes (`paymentStatus`, `updatedAt`, `createdAt`, `publishedAt`)
- Mettre à jour les commandes existantes avec des valeurs par défaut
- Corriger les problèmes de structure

### Étape 3: Vérifier la Correction

Relancez le diagnostic :
```
GET /api/commandes/diagnose-database
```

Vous devriez voir :
- `missingColumns: []` (aucune colonne manquante)
- `commandesWithoutStatus: 0` (toutes les commandes ont un paymentStatus)

## 🔍 Diagnostic Manuel (Alternative)

Si les routes ne fonctionnent pas, vous pouvez exécuter ces requêtes SQL directement :

### Vérifier la Structure
```sql
PRAGMA table_info(commandes);
```

### Ajouter les Colonnes Manquantes
```sql
-- Ajouter paymentStatus
ALTER TABLE commandes ADD COLUMN paymentStatus TEXT DEFAULT 'pending';

-- Ajouter updatedAt
ALTER TABLE commandes ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Ajouter createdAt
ALTER TABLE commandes ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Ajouter publishedAt
ALTER TABLE commandes ADD COLUMN publishedAt DATETIME;
```

### Mettre à Jour les Données Existantes
```sql
-- Mettre à jour les commandes sans paymentStatus
UPDATE commandes SET paymentStatus = 'pending' WHERE paymentStatus IS NULL OR paymentStatus = '';

-- Mettre à jour les commandes sans updatedAt
UPDATE commandes SET updatedAt = datetime('now') WHERE updatedAt IS NULL;
```

## 🧪 Test Après Correction

1. **Redémarrer le serveur Strapi**
2. **Tester un webhook :**
   ```bash
   stripe trigger payment_intent.succeeded
   ```
3. **Vérifier les logs** - vous devriez voir :
   ```
   ✅ Commande mise à jour avec succès via SQL direct
   ```

## 🚨 Si le Problème Persiste

### Option 1: Reconstruire la Base de Données
```bash
# Supprimer la base de données
rm .tmp/data.db

# Redémarrer Strapi (reconstruira automatiquement)
npm run strapi develop
```

### Option 2: Migration Manuelle
```bash
# Exécuter les migrations
npm run strapi migrate
```

### Option 3: Synchronisation Forcée
```bash
# Synchroniser le schéma avec la base de données
npm run strapi strapi:deploy
```

## 📊 Vérification Finale

Après correction, votre table `commandes` devrait avoir ces colonnes :
- `id` (INTEGER PRIMARY KEY)
- `commentaire` (TEXT)
- `state` (TEXT)
- `livraison` (BOOLEAN)
- `event` (INTEGER)
- `quantite` (INTEGER)
- `user` (INTEGER)
- `cancelled` (BOOLEAN)
- `paymentMethod` (TEXT)
- `paymentIntent` (TEXT)
- `amount` (DECIMAL)
- `paymentStatus` (TEXT)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)
- `publishedAt` (DATETIME)

## 🎯 Résultat Attendu

Après correction, les webhooks Stripe devraient fonctionner correctement et mettre à jour le `paymentStatus` des commandes sans erreur.

---

**Note :** Ces routes sont protégées et nécessitent des droits d'administration. 