-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Anyone can view permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Anyone can view role permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Super admins can manage role permissions" ON admin_role_permissions;
DROP POLICY IF EXISTS "Anyone can view user roles" ON admin_user_roles;
DROP POLICY IF EXISTS "Super admins can manage user roles" ON admin_user_roles;

-- Create a materialized view for super admin role ID
CREATE MATERIALIZED VIEW super_admin_role AS
SELECT id FROM admin_roles WHERE name = 'super_admin';

-- Create index on the materialized view
CREATE UNIQUE INDEX idx_super_admin_role_id ON super_admin_role(id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_super_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY super_admin_role;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the materialized view
CREATE TRIGGER refresh_super_admin_role_trigger
AFTER INSERT OR UPDATE OR DELETE ON admin_roles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_super_admin_role();

-- Create new simplified policies for admin_roles
CREATE POLICY "Public read access for admin_roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin write access for admin_roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur, super_admin_role sar
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = sar.id
    )
  );

-- Create new simplified policies for admin_permissions
CREATE POLICY "Public read access for admin_permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin write access for admin_permissions"
  ON admin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur, super_admin_role sar
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = sar.id
    )
  );

-- Create new simplified policies for admin_role_permissions
CREATE POLICY "Public read access for admin_role_permissions"
  ON admin_role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin write access for admin_role_permissions"
  ON admin_role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur, super_admin_role sar
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = sar.id
    )
  );

-- Create new simplified policies for admin_user_roles
CREATE POLICY "Public read access for admin_user_roles"
  ON admin_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin write access for admin_user_roles"
  ON admin_user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_user_roles ur, super_admin_role sar
      WHERE ur.user_id = auth.uid()
      AND ur.role_id = sar.id
    )
  );

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW super_admin_role;