/*
  # Fix Admin Role Policies

  1. Changes
    - Drop existing policies and materialized view
    - Create function to check super admin status
    - Create new simplified policies using the function
    - Add indexes for performance

  2. Security
    - Maintains same security model but with better performance
    - Avoids infinite recursion in policy checks
*/

-- Drop existing policies and views
DROP POLICY IF EXISTS "Public read access for admin_roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admin write access for admin_roles" ON admin_roles;
DROP POLICY IF EXISTS "Public read access for admin_permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Super admin write access for admin_permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Public read access for admin_role_permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Super admin write access for admin_role_permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Public read access for admin_user_roles" ON admin_user_roles;
DROP POLICY IF EXISTS "Super admin write access for admin_user_roles" ON admin_user_roles;
DROP MATERIALIZED VIEW IF EXISTS super_admin_role;
DROP TRIGGER IF EXISTS refresh_super_admin_role_trigger ON admin_roles;
DROP FUNCTION IF EXISTS refresh_super_admin_role();

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  super_admin_role_id uuid;
BEGIN
  -- Get super admin role ID
  SELECT id INTO super_admin_role_id
  FROM admin_roles
  WHERE name = 'super_admin'
  LIMIT 1;

  -- Check if user has super admin role
  RETURN EXISTS (
    SELECT 1
    FROM admin_user_roles
    WHERE user_id = $1
    AND role_id = super_admin_role_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON admin_roles(name);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user_id ON admin_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role_id ON admin_user_roles(role_id);

-- Create new policies for admin_roles
CREATE POLICY "Anyone can view admin roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Create new policies for admin_permissions
CREATE POLICY "Anyone can view admin permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Create new policies for admin_role_permissions
CREATE POLICY "Anyone can view admin role permissions"
  ON admin_role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin role permissions"
  ON admin_role_permissions
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Create new policies for admin_user_roles
CREATE POLICY "Anyone can view admin user roles"
  ON admin_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin user roles"
  ON admin_user_roles
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));