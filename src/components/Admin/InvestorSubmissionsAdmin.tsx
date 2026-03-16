import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, Mail, Phone, Video, Users, Check, Clock, X, Calendar } from 'lucide-react';

interface InvestorSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  accredited_status: string;
  investment_amount: string;
  prior_experience: string;
  interest_reason: string;
  willing_to_sign_nda: boolean;
  preferred_contact: string;
  status: 'new' | 'contacted' | 'meeting_scheduled' | 'declined' | 'approved';
  created_at: string;
}

const InvestorSubmissionsAdmin: React.FC = () => {
  const [submissions, setSubmissions] = useState<InvestorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<InvestorSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'meeting_scheduled' | 'declined' | 'approved'>('all');

  const fetchSubmissions = useCallback(async () => {
    try {
      let query = supabase
        .from('investor_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      alert('Error fetching submissions: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const updateStatus = async (id: string, status: InvestorSubmission['status']) => {
    try {
      const { error } = await supabase
        .from('investor_submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === id ? { ...sub, status } : sub
        )
      );
    } catch (error) {
      console.error('Error updating submission status:', error);
      alert('Error updating status: ' + (error as Error).message);
    }
  };

  const getStatusIcon = (status: InvestorSubmission['status']) => {
    switch (status) {
      case 'new':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'contacted':
        return <Mail className="h-5 w-5 text-yellow-500" />;
      case 'meeting_scheduled':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'approved':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'declined':
        return <X className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: InvestorSubmission['status']) => {
    switch (status) {
      case 'new':
        return 'New Submission';
      case 'contacted':
        return 'Initial Contact Made';
      case 'meeting_scheduled':
        return 'Meeting Scheduled';
      case 'approved':
        return 'Approved for Investment';
      case 'declined':
        return 'Declined';
    }
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'inperson':
        return <Users className="h-5 w-5" />;
      default:
        return null;
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
          <h1 className="text-3xl font-display font-bold text-gray-900">Investor Submissions</h1>
          
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            >
              <option value="all">All Submissions</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="meeting_scheduled">Meeting Scheduled</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id
                      ? 'bg-ocean-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{submission.full_name}</h3>
                      <p className="text-sm text-gray-500">{submission.investment_amount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{submission.email}</span>
                    {submission.phone && <span>{submission.phone}</span>}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No submissions found.
                </div>
              )}
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedSubmission ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900">
                      {selectedSubmission.full_name}
                    </h2>
                    {selectedSubmission.company && (
                      <p className="text-gray-600">{selectedSubmission.company}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedSubmission.status)}
                    <span className="text-sm text-gray-500">
                      {getStatusText(selectedSubmission.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-500">Email</span>
                    <span className="text-gray-900">{selectedSubmission.email}</span>
                  </div>
                  {selectedSubmission.phone && (
                    <div>
                      <span className="block text-gray-500">Phone</span>
                      <span className="text-gray-900">{selectedSubmission.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-gray-500">Investment Amount</span>
                    <span className="text-gray-900">{selectedSubmission.investment_amount}</span>
                  </div>

                  <div>
                    <span className="block text-gray-500">Accredited Status</span>
                    <span className="text-gray-900">{selectedSubmission.accredited_status}</span>
                  </div>

                  <div>
                    <span className="block text-gray-500">Prior F&B Investment Experience</span>
                    <span className="text-gray-900">{selectedSubmission.prior_experience}</span>
                  </div>

                  <div>
                    <span className="block text-gray-500">Interest Reason</span>
                    <p className="text-gray-900 whitespace-pre-line">{selectedSubmission.interest_reason}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {selectedSubmission.willing_to_sign_nda ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-gray-700">Willing to Sign NDA</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-gray-500">Preferred Contact Method</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getContactIcon(selectedSubmission.preferred_contact)}
                      <span className="text-gray-900 capitalize">
                        {selectedSubmission.preferred_contact === 'inperson' 
                          ? 'In-Person Meeting'
                          : selectedSubmission.preferred_contact}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Update Status</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'contacted')}
                      className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      Mark as Contacted
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'meeting_scheduled')}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                    >
                      Schedule Meeting
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'approved')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selectedSubmission.id, 'declined')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Eye className="h-12 w-12 mb-4" />
                <p>Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorSubmissionsAdmin;
