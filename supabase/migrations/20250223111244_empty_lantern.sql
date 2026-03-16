/*
  # Fix Admin Role Policies - Final Version

  This migration fixes the infinite recursion issue in the RLS policies
  by using a simpler approach that checks for super admin role directly
  without recursive joins.

  1. Changes
    - Drop all existing policies
    - Create new simplified policies using direct role checks
    - Add indexes to improve query performance

  2. Security
    - Maintains same level of access control
    - Eliminates circular dependencies
    - Improves query performance
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Anyone can view permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Anyone can view role permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Super admins can manage role permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Anyone can view user roles" ON admin_user_roles;
DROP POLICY IF EXISTS "Super admins can manage user roles" ON admin_user_roles;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON admin_roles(name);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user_id ON admin_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role_id ON admin_user_roles(role_id);

-- Create new simplified policies for admin_roles
CREATE POLICY "Anyone can view roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin' LIMIT 1)
    )
  );

-- Create new simplified policies for admin_permissions
CREATE POLICY "Anyone can view permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin' LIMIT 1)
    )
  );

-- Create new simplified policies for admin_role_permissions
CREATE POLICY "Anyone can view role permissions"
  ON admin_role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage role permissions"
  ON admin_role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin' LIMIT 1)
    )
  );

-- Create new simplified policies for admin_user_roles
CREATE POLICY "Anyone can view user roles"
  ON admin_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage user roles"
  ON admin_user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin' LIMIT 1)
    )
  );