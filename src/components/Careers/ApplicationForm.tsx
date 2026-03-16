import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Upload, ArrowLeft } from 'lucide-react';

interface JobListing {
  id: string;
  title: string;
  department: {
    name: string;
  };
}

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          department:department_id(name)
        `)
        .eq('active', true)
        .order('title');

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      // Upload resume if provided
      let resumeUrl = '';
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);

        resumeUrl = publicUrl;
      }

      // Upload video if provided
      let videoUrl = '';
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);

        videoUrl = publicUrl;
      }

      // Submit application
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          full_name: formData.get('full_name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          contact_method: formData.get('contact_method'),
          position: formData.get('position'),
          availability: formData.get('availability'),
          resume_url: resumeUrl,
          interest_reason: formData.get('interest_reason'),
          passion: formData.get('passion'),
          video_url: videoUrl,
          additional_info: formData.get('additional_info')
        }]);

      if (error) throw error;

      alert('Application submitted successfully! We will contact you soon.');
      navigate('/');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-ocean-600 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-6">
            Job Application
          </h1>
          
          <p className="text-gray-600 font-garamond mb-8">
            Thank you for your interest in joining the team at The Spoonbill Lounge, where we pride ourselves on exceptional cuisine and outstanding service. Please complete the following application to tell us more about yourself.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                1. Basic Information
              </h2>
              <div className="grid gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Contact Method
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="contact_method"
                        value="email"
                        required
                        className="text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="ml-2">Email</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="contact_method"
                        value="phone"
                        className="text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="ml-2">Phone</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="contact_method"
                        value="text"
                        className="text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="ml-2">Text Message</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Position Applying For
                  </label>
                  <select
                    id="position"
                    name="position"
                    required
                    defaultValue={searchParams.get('position') || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                  >
                    <option value="">Select a position</option>
                    {loadingJobs ? (
                      <option disabled>Loading positions...</option>
                    ) : (
                      jobs.map(job => (
                        <option key={job.id} value={job.title}>
                          {job.title} - {job.department.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>
                  <select
                    id="availability"
                    name="availability"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                  >
                    <option value="">Select availability</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Weekends">Weekends Only</option>
                    <option value="Evenings">Evenings Only</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                2. Resume Upload
              </h2>
              <p className="text-gray-600 font-garamond mb-4">
                Please upload your resume. We'll use this to review your experience and qualifications.
              </p>
              <label className="block">
                <span className="sr-only">Choose resume file</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-ocean-50 file:text-ocean-700
                    hover:file:bg-ocean-100
                  "
                />
              </label>
            </div>

            {/* About You */}
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                3. Tell Us About Yourself
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="interest_reason" className="block text-sm font-medium text-gray-700 mb-1">
                    What drew you to apply to The Spoonbill Lounge?
                  </label>
                  <textarea
                    id="interest_reason"
                    name="interest_reason"
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                    placeholder="Tell us why you're interested in joining our team..."
                  />
                </div>

                <div>
                  <label htmlFor="passion" className="block text-sm font-medium text-gray-700 mb-1">
                    What's one thing you're passionate about—food-related or otherwise?
                  </label>
                  <textarea
                    id="passion"
                    name="passion"
                    rows={4}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                    placeholder="Share your passion with us..."
                  />
                </div>
              </div>
            </div>

            {/* Video Introduction */}
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                4. Video Introduction
              </h2>
              <p className="text-gray-600 font-garamond mb-4">
                We want to hear from you directly! Please record a short video (1-2 minutes) answering:
              </p>
              <ul className="list-disc pl-5 text-gray-600 font-garamond mb-4">
                <li>Why do you want to work at The Spoonbill Lounge?</li>
                <li>What unique qualities or skills would you bring to our team?</li>
              </ul>
              <label className="block">
                <span className="sr-only">Choose video file</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-ocean-50 file:text-ocean-700
                    hover:file:bg-ocean-100
                  "
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Tip: Keep it casual but professional—imagine you're introducing yourself to the team.
                Use good lighting and sound if possible.
              </p>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                5. Anything Else?
              </h2>
              <div>
                <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-1">
                  Is there anything else you'd like us to know about you?
                </label>
                <textarea
                  id="additional_info"
                  name="additional_info"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                  placeholder="Optional: Share any additional information..."
                />
              </div>
            </div>

            {/* Agreement and Submit */}
            <div>
              <label className="flex items-center mb-6">
                <input
                  type="checkbox"
                  required
                  className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                />
                <span className="ml-2 text-gray-700">
                  I certify that the information provided is accurate to the best of my knowledge.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;