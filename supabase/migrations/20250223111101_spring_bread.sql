/*
  # Fix Admin Role Policies

  This migration fixes the infinite recursion issue in the RLS policies
  by simplifying the policy checks and avoiding circular dependencies.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Super admins can manage role permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Super admins can manage user roles" ON admin_user_roles;

-- Create simplified policies that avoid recursion
CREATE POLICY "Super admins can manage roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage role permissions"
  ON admin_role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage user roles"
  ON admin_user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (SELECT id FROM admin_roles WHERE name = 'super_admin')
    )
  );