import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

const DepartmentsAdmin: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('job_departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('Error fetching departments: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const departmentData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      active: formData.get('active') === 'on'
    };

    try {
      if (editingDepartment) {
        const { error } = await supabase
          .from('job_departments')
          .update(departmentData)
          .eq('id', editingDepartment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_departments')
          .insert([departmentData]);
        if (error) throw error;
      }

      await fetchDepartments();
      setIsFormOpen(false);
      setEditingDepartment(null);
      form.reset();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving department: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This may affect existing job listings.')) return;

    try {
      const { error } = await supabase
        .from('job_departments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Departments</h1>
          <button
            onClick={() => {
              setEditingDepartment(null);
              setIsFormOpen(true);
            }}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
          >
            <Plus className="h-5 w-5" />
            Add Department
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingDepartment?.name}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingDepartment?.description}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingDepartment?.active ?? true}
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingDepartment(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
              >
                {editingDepartment ? 'Update' : 'Create'} Department
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((department) => (
                <tr key={department.id} className={!department.active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{department.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{department.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {department.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingDepartment(department);
                        setIsFormOpen(true);
                      }}
                      className="text-ocean-600 hover:text-ocean-700 mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(department.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsAdmin;
