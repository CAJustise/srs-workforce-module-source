import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface JobListing {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  department_id: string;
  job_type_id: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: 'hourly' | 'yearly' | null;
  active: boolean;
  created_at: string;
  department: {
    name: string;
  } | null;
  job_type: {
    name: string;
    code: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface JobType {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

const JobsAdmin: React.FC = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [requirements, setRequirements] = useState<string>('');
  const [benefits, setBenefits] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingJob) {
      setRequirements(editingJob.requirements.join('\n'));
      setBenefits(editingJob.benefits.join('\n'));
    } else {
      setRequirements('');
      setBenefits('');
    }
  }, [editingJob]);

  const fetchData = async () => {
    try {
      const [jobsResponse, departmentsResponse, typesResponse] = await Promise.all([
        supabase
          .from('job_listings')
          .select(`
            *,
            department:department_id (name),
            job_type:job_type_id (name, code)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('job_departments')
          .select('*')
          .eq('active', true)
          .order('name'),
        supabase
          .from('job_types')
          .select('*')
          .eq('active', true)
          .order('name')
      ]);

      if (jobsResponse.error) throw jobsResponse.error;
      if (departmentsResponse.error) throw departmentsResponse.error;
      if (typesResponse.error) throw typesResponse.error;

      setJobs(jobsResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      setJobTypes(typesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const jobData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      requirements: requirements.split('\n').filter(r => r.trim()).map(r => r.trim()),
      benefits: benefits.split('\n').filter(b => b.trim()).map(b => b.trim()),
      department_id: formData.get('department_id') as string,
      job_type_id: formData.get('job_type_id') as string,
      salary_min: parseFloat(formData.get('salary_min') as string) || null,
      salary_max: parseFloat(formData.get('salary_max') as string) || null,
      salary_type: formData.get('salary_type') as 'hourly' | 'yearly' | null,
      active: formData.get('active') === 'on'
    };

    try {
      if (editingJob) {
        const { error } = await supabase
          .from('job_listings')
          .update(jobData)
          .eq('id', editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_listings')
          .insert([jobData]);
        if (error) throw error;
      }

      await fetchData();
      setIsJobFormOpen(false);
      setEditingJob(null);
      form.reset();
      setRequirements('');
      setBenefits('');
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error saving job: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job listing?')) return;

    try {
      const { error } = await supabase
        .from('job_listings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job: ' + (error as Error).message);
    }
  };

  const formatSalary = (job: JobListing) => {
    if (!job.salary_min && !job.salary_max) return 'Competitive';
    
    const formatNumber = (num: number) => 
      new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(num);

    const rate = job.salary_type === 'hourly' ? '/hr' : '/year';
    
    if (job.salary_min && job.salary_max) {
      return `${formatNumber(job.salary_min)} - ${formatNumber(job.salary_max)}${rate}`;
    }
    
    if (job.salary_min) {
      return `From ${formatNumber(job.salary_min)}${rate}`;
    }
    
    if (job.salary_max) {
      return `Up to ${formatNumber(job.salary_max)}${rate}`;
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
          <h1 className="text-3xl font-display font-bold text-gray-900">Job Listings</h1>
          <button
            onClick={() => {
              setEditingJob(null);
              setIsJobFormOpen(true);
            }}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
          >
            <Plus className="h-5 w-5" />
            Add Job Listing
          </button>
        </div>

        {isJobFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingJob?.title}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., General Manager"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    name="department_id"
                    required
                    defaultValue={editingJob?.department_id || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    name="job_type_id"
                    required
                    defaultValue={editingJob?.job_type_id || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Type</option>
                    {jobTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Salary
                  </label>
                  <input
                    type="number"
                    name="salary_min"
                    step="0.01"
                    defaultValue={editingJob?.salary_min || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Salary
                  </label>
                  <input
                    type="number"
                    name="salary_max"
                    step="0.01"
                    defaultValue={editingJob?.salary_max || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Type
                  </label>
                  <select
                    name="salary_type"
                    defaultValue={editingJob?.salary_type || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Type</option>
                    <option value="hourly">Per Hour</option>
                    <option value="yearly">Per Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Summary & Description
                </label>
                <textarea
                  name="description"
                  rows={6}
                  required
                  defaultValue={editingJob?.description}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Describe the role and responsibilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements (one per line)
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="5+ years of GM experience in fine dining
Strong financial acumen and people management skills
Deep knowledge of cocktail programs, fine wines, and upscale hospitality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits (one per line)
                </label>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Competitive salary
Health insurance
401(k) matching
Professional development opportunities"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingJob?.active ?? true}
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-gray-700">Active Listing</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsJobFormOpen(false);
                  setEditingJob(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
              >
                {editingJob ? 'Update' : 'Create'} Job Listing
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className={`p-6 ${!job.active ? 'bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {job.department?.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {job.job_type?.name}
                      </span>
                      <span className="text-sm font-medium text-ocean-600">
                        {formatSalary(job)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!job.active && (
                      <span className="text-sm text-gray-500">Inactive</span>
                    )}
                    <button
                      onClick={() => {
                        setEditingJob(job);
                        setIsJobFormOpen(true);
                      }}
                      className="text-ocean-600 hover:text-ocean-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{job.description}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      {job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      {job.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No job listings found. Click "Add Job Listing" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsAdmin;
