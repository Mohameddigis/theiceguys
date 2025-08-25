/*
  # Permettre aux utilisateurs anonymes de créer des commandes

  1. Nouvelles politiques
    - Permettre aux utilisateurs anonymes de créer des clients
    - Permettre aux utilisateurs anonymes de créer des commandes
    - Permettre aux utilisateurs anonymes de créer des articles de commande

  2. Sécurité
    - Les utilisateurs anonymes peuvent seulement créer (INSERT)
    - Les politiques existantes pour les utilisateurs authentifiés sont conservées
    - Les admins gardent tous leurs droits
*/

-- Politique pour permettre aux utilisateurs anonymes de créer des clients
CREATE POLICY "Allow anonymous users to create customers"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique pour permettre aux utilisateurs anonymes de créer des commandes
CREATE POLICY "Allow anonymous users to create orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique pour permettre aux utilisateurs anonymes de créer des articles de commande
CREATE POLICY "Allow anonymous users to create order items"
  ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);