/*
  # Permettre les commandes anonymes

  1. Nouvelles politiques RLS
    - Permettre aux utilisateurs anonymes de créer des clients
    - Permettre aux utilisateurs anonymes de créer des commandes
    - Permettre aux utilisateurs anonymes de créer des articles de commande
  
  2. Sécurité
    - Les utilisateurs anonymes peuvent seulement créer (INSERT)
    - Ils ne peuvent pas lire, modifier ou supprimer les données d'autres utilisateurs
    - Les admins gardent tous les droits
*/

-- Politique pour permettre aux anonymes de créer des clients
CREATE POLICY "Anonymous users can create customers"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique pour permettre aux anonymes de créer des commandes
CREATE POLICY "Anonymous users can create orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique pour permettre aux anonymes de créer des articles de commande
CREATE POLICY "Anonymous users can create order items"
  ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Optionnel: Permettre aux utilisateurs authentifiés de créer des commandes aussi
CREATE POLICY "Authenticated users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);