import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  GlassWater, 
  Calendar, 
  Image, 
  Briefcase, 
  Building2, 
  FileText, 
  Users, 
  Settings,
  ChefHat,
  DollarSign
} from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        {/* Menu Management Section */}
        <div className="mb-12">
          <h2 className="text-xl font-display font-medium text-gray-600 mb-6">Menu Management</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              to="/admin/menu/tasting-menus"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <ChefHat className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Tasting Menus</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage tasting menus and prix fixe offerings.
              </p>
            </Link>

            <Link 
              to="/admin/menu/food-categories"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Food Categories</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage food menu categories and organization.
              </p>
            </Link>

            <Link 
              to="/admin/menu/food-items"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Food Items</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage food menu items and pricing.
              </p>
            </Link>

            <Link 
              to="/admin/menu/drink-categories"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <GlassWater className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Drink Categories</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage drink menu categories and organization.
              </p>
            </Link>

            <Link 
              to="/admin/menu/drink-items"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <GlassWater className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Drink Items</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage drink menu items and pricing.
              </p>
            </Link>
          </div>
        </div>

        {/* Content Management Section */}
        <div className="mb-12">
          <h2 className="text-xl font-display font-medium text-gray-600 mb-6">Content Management</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link 
              to="/admin/events"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Event Management</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Create and manage events, classes, and special occasions.
              </p>
            </Link>

            <Link 
              to="/admin/images"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <Image className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Image Manager</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Upload and manage images for the website.
              </p>
            </Link>
          </div>
        </div>

        {/* Career Management Section */}
        <div className="mb-12">
          <h2 className="text-xl font-display font-medium text-gray-600 mb-6">Career Management</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              to="/admin/jobs"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Job Listings</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage open positions and job descriptions.
              </p>
            </Link>

            <Link 
              to="/admin/departments"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Departments</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage restaurant departments and teams.
              </p>
            </Link>

            <Link 
              to="/admin/job-types"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Employment Types</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage employment types and classifications.
              </p>
            </Link>

            <Link 
              to="/admin/applications"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Job Applications</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Review and manage employment applications.
              </p>
            </Link>
          </div>
        </div>

        {/* Investment Section */}
        <div className="mb-12">
          <h2 className="text-xl font-display font-medium text-gray-600 mb-6">Investment</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              to="/admin/investor-submissions"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Investor Submissions</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Review and manage investor interest submissions.
              </p>
            </Link>
          </div>
        </div>

        {/* System Section */}
        <div>
          <h2 className="text-xl font-display font-medium text-gray-600 mb-6">System</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              to="/admin/settings"
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                  <Settings className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-display font-bold text-gray-900">Settings</h3>
              </div>
              <p className="text-gray-600 font-garamond">
                Manage account settings and preferences.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;