import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface JobType {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

const JobTypesAdmin: React.FC = () => {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<JobType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchJobTypes();
  }, []);

  const fetchJobTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('job_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setJobTypes(data || []);
    } catch (error) {
      console.error('Error fetching job types:', error);
      alert('Error fetching job types: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const typeData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      active: formData.get('active') === 'on'
    };

    try {
      if (editingType) {
        const { error } = await supabase
          .from('job_types')
          .update(typeData)
          .eq('id', editingType.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_types')
          .insert([typeData]);
        if (error) throw error;
      }

      await fetchJobTypes();
      setIsFormOpen(false);
      setEditingType(null);
      form.reset();
    } catch (error) {
      console.error('Error saving job type:', error);
      alert('Error saving job type: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job type? This may affect existing job listings.')) return;

    try {
      const { error } = await supabase
        .from('job_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchJobTypes();
    } catch (error) {
      console.error('Error deleting job type:', error);
      alert('Error deleting job type: ' + (error as Error).message);
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
          <h1 className="text-3xl font-display font-bold text-gray-900">Employment Types</h1>
          <button
            onClick={() => {
              setEditingType(null);
              setIsFormOpen(true);
            }}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
          >
            <Plus className="h-5 w-5" />
            Add Employment Type
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingType?.name}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Full-Time W-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  defaultValue={editingType?.code}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., W2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingType?.description}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Describe the employment type..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingType?.active ?? true}
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
                  setEditingType(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
              >
                {editingType ? 'Update' : 'Create'} Type
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
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
              {jobTypes.map((type) => (
                <tr key={type.id} className={!type.active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{type.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-600">{type.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{type.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {type.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingType(type);
                        setIsFormOpen(true);
                      }}
                      className="text-ocean-600 hover:text-ocean-700 mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
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

export default JobTypesAdmin;
