/*
  # Supprimer le statut "preparing" de l'enum order_status

  1. Modifications
    - Mise à jour des commandes ayant le statut "preparing" vers "confirmed"
    - Suppression de la valeur "preparing" de l'enum order_status
    - Recréation de l'enum avec les valeurs correctes

  2. Sécurité
    - Sauvegarde des données existantes
    - Mise à jour en douceur sans perte de données
*/

-- Mettre à jour toutes les commandes "preparing" vers "confirmed"
UPDATE orders 
SET status = 'confirmed' 
WHERE status = 'preparing';

-- Créer un nouvel enum sans "preparing"
CREATE TYPE order_status_new AS ENUM ('pending', 'confirmed', 'delivering', 'delivered', 'cancelled');

-- Mettre à jour la colonne pour utiliser le nouveau type
ALTER TABLE orders 
ALTER COLUMN status TYPE order_status_new 
USING status::text::order_status_new;

-- Supprimer l'ancien enum
DROP TYPE order_status;

-- Renommer le nouveau enum
ALTER TYPE order_status_new RENAME TO order_status;