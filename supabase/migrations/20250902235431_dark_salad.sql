/*
  # Activer RLS et politiques pour delivery_drivers

  1. Sécurité
    - Activer RLS sur la table `delivery_drivers`
    - Ajouter politique pour que les livreurs puissent lire leur propre profil
    - Ajouter politique pour que les livreurs puissent mettre à jour leur statut
    - Ajouter politique pour que les admins puissent gérer tous les livreurs

  2. Politiques créées
    - `drivers_can_read_own_profile`: Permet aux livreurs de lire leur profil
    - `drivers_can_update_own_status`: Permet aux livreurs de modifier leur statut
    - `admins_can_manage_all_drivers`: Permet aux admins de tout gérer
*/

-- Activer RLS sur la table delivery_drivers
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Politique pour que les livreurs puissent lire leur propre profil
CREATE POLICY "drivers_can_read_own_profile"
  ON public.delivery_drivers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique pour que les livreurs puissent mettre à jour leur propre statut
CREATE POLICY "drivers_can_update_own_status"
  ON public.delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour que les admins puissent gérer tous les livreurs
CREATE POLICY "admins_can_manage_all_drivers"
  ON public.delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'commandes@glaconsmarrakech.com'
    )
  );