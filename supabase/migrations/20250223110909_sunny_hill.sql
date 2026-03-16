/*
  # Add Admin User Management

  1. New Tables
    - `admin_roles` - Defines available admin roles
    - `admin_permissions` - Defines granular permissions
    - `admin_role_permissions` - Maps roles to permissions
    - `admin_user_roles` - Maps users to roles

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Create admin roles table
CREATE TABLE admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin permissions table
CREATE TABLE admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role permissions mapping table
CREATE TABLE admin_role_permissions (
  role_id uuid REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user roles mapping table
CREATE TABLE admin_user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES admin_roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view roles"
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
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Authenticated users can view permissions"
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
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Authenticated users can view role permissions"
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
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Authenticated users can view user roles"
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
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_user_roles ur
      JOIN admin_roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_permissions_updated_at
  BEFORE UPDATE ON admin_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO admin_roles (name, description) VALUES
('super_admin', 'Full system access with user management capabilities'),
('admin', 'General administrative access without user management'),
('editor', 'Can edit content but cannot manage system settings');

-- Insert default permissions
INSERT INTO admin_permissions (name, description) VALUES
('manage_users', 'Can create and manage admin users'),
('manage_roles', 'Can create and manage roles'),
('manage_menu', 'Can manage menu items and categories'),
('manage_events', 'Can manage events and bookings'),
('manage_content', 'Can manage general content'),
('manage_jobs', 'Can manage job listings and applications'),
('view_analytics', 'Can view analytics and reports');

-- Assign permissions to roles
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'super_admin';

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'admin'
AND p.name != 'manage_users'
AND p.name != 'manage_roles';

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'editor'
AND p.name IN ('manage_menu', 'manage_events', 'manage_content');