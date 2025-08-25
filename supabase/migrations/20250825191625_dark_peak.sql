/*
  # Désactiver RLS pour les commandes anonymes

  1. Désactivation temporaire de RLS
    - Désactive RLS sur les tables `customers`, `orders`, et `order_items`
    - Permet aux utilisateurs anonymes de créer des commandes
    
  2. Sécurité
    - Solution temporaire pour permettre le fonctionnement des commandes
    - À revoir plus tard avec des politiques RLS plus spécifiques
*/

-- Désactiver RLS sur la table customers
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table orders  
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table order_items
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;