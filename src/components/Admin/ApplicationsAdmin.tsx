import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

interface JobApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  status: 'new' | 'reviewed' | 'contacted' | 'archived';
  created_at: string;
  resume_url: string | null;
  video_url: string | null;
}

const ApplicationsAdmin: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed' | 'contacted' | 'archived'>('all');

  const fetchApplications = useCallback(async () => {
    try {
      let query = supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Error fetching applications: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (id: string, status: JobApplication['status']) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status } : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Error updating status: ' + (error as Error).message);
    }
  };

  const getStatusIcon = (status: JobApplication['status']) => {
    switch (status) {
      case 'new':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'reviewed':
        return <Eye className="h-5 w-5 text-yellow-500" />;
      case 'contacted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'archived':
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: JobApplication['status']) => {
    switch (status) {
      case 'new':
        return 'New Application';
      case 'reviewed':
        return 'Application Reviewed';
      case 'contacted':
        return 'Candidate Contacted';
      case 'archived':
        return 'Application Archived';
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Job Applications</h1>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            >
              <option value="all">All Applications</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedApplication?.id === application.id
                      ? 'bg-ocean-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedApplication(application)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{application.full_name}</h3>
                      <p className="text-sm text-gray-500">{application.position}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{application.email}</span>
                    <span>{application.phone}</span>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No applications found.
                </div>
              )}
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedApplication ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900">
                      {selectedApplication.full_name}
                    </h2>
                    <p className="text-gray-600">{selectedApplication.position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    <span className="text-sm text-gray-500">
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-500">Email</span>
                    <span className="text-gray-900">{selectedApplication.email}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Phone</span>
                    <span className="text-gray-900">{selectedApplication.phone}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {selectedApplication.resume_url && (
                    <a
                      href={selectedApplication.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </a>
                  )}
                  {selectedApplication.video_url && (
                    <a
                      href={selectedApplication.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Video
                    </a>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Update Status</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(selectedApplication.id, 'reviewed')}
                      className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => updateStatus(selectedApplication.id, 'contacted')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Mark as Contacted
                    </button>
                    <button
                      onClick={() => updateStatus(selectedApplication.id, 'archived')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Eye className="h-12 w-12 mb-4" />
                <p>Select an application to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsAdmin;
