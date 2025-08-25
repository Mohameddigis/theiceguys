/*
  # Schéma de base de données pour les commandes de glaçons

  1. Nouvelles Tables
    - `customers`
      - `id` (uuid, primary key)
      - `type` (enum: 'professional', 'individual')
      - `name` (text) - nom complet ou nom de l'entreprise
      - `contact_name` (text) - nom du contact (pour les professionnels)
      - `phone` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `order_number` (text, unique)
      - `status` (enum: 'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')
      - `delivery_type` (enum: 'standard', 'express')
      - `delivery_date` (date)
      - `delivery_time` (text)
      - `delivery_address` (text)
      - `delivery_coordinates` (point)
      - `notes` (text)
      - `subtotal` (decimal)
      - `delivery_fee` (decimal)
      - `total` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `ice_type` (enum: 'nuggets', 'gourmet', 'cubique')
      - `package_size` (enum: '5kg', '10kg', '20kg')
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour permettre aux utilisateurs authentifiés de gérer leurs données
    - Politiques pour les administrateurs

  3. Index
    - Index sur order_number pour les recherches rapides
    - Index sur customer_id pour les jointures
    - Index sur status pour filtrer les commandes
*/

-- Créer les types enum
CREATE TYPE customer_type AS ENUM ('professional', 'individual');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled');
CREATE TYPE delivery_type AS ENUM ('standard', 'express');
CREATE TYPE ice_type AS ENUM ('nuggets', 'gourmet', 'cubique');
CREATE TYPE package_size AS ENUM ('5kg', '10kg', '20kg');

-- Table des clients
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type customer_type NOT NULL,
  name text NOT NULL,
  contact_name text,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL DEFAULT 'CMD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  status order_status NOT NULL DEFAULT 'pending',
  delivery_type delivery_type NOT NULL DEFAULT 'standard',
  delivery_date date,
  delivery_time text,
  delivery_address text NOT NULL,
  delivery_coordinates point,
  notes text,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des articles de commande
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ice_type ice_type NOT NULL,
  package_size package_size NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price > 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price > 0),
  created_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les clients
CREATE POLICY "Users can read own customer data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own customer data"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own customer data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Politiques RLS pour les commandes
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = orders.customer_id 
    AND auth.uid()::text = customers.id::text
  ));

CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = orders.customer_id 
    AND auth.uid()::text = customers.id::text
  ));

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = orders.customer_id 
    AND auth.uid()::text = customers.id::text
  ));

-- Politiques RLS pour les articles de commande
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    JOIN customers ON customers.id = orders.customer_id
    WHERE orders.id = order_items.order_id 
    AND auth.uid()::text = customers.id::text
  ));

CREATE POLICY "Users can insert own order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    JOIN customers ON customers.id = orders.customer_id
    WHERE orders.id = order_items.order_id 
    AND auth.uid()::text = customers.id::text
  ));

-- Politiques pour les administrateurs (optionnel)
CREATE POLICY "Admins can manage all data"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@glaconsmarrakech.com'
    )
  );

CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@glaconsmarrakech.com'
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@glaconsmarrakech.com'
    )
  );