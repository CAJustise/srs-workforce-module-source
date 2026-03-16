import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface JobListing {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  department: {
    name: string;
  };
  job_type: {
    name: string;
  };
  salary_min: number;
  salary_max: number;
  salary_type: 'hourly' | 'yearly';
  active: boolean;
}

const CareersDrawer: React.FC = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          department:department_id(name),
          job_type:job_type_id(name)
        `)
        .eq('active', true)
        .order('title');

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none font-garamond">
        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Join Our Team</h3>
        <p className="text-gray-600 mb-6">
          At The Spoonbill Lounge, we're more than just a restaurant and bar—we're a team of passionate individuals dedicated to creating extraordinary experiences. We're always looking for talented people who share our commitment to excellence and hospitality.
        </p>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-8">
          <h4 className="text-xl font-display font-bold text-gray-900 mb-4">Why Work With Us?</h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Growth & Development</h5>
              <p className="text-gray-600">
                We invest in our team's professional growth through ongoing training, mentorship, and opportunities for advancement.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Competitive Benefits</h5>
              <p className="text-gray-600">
                Enjoy competitive pay, health benefits, meal discounts, and a positive work environment that values work-life balance.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Creative Environment</h5>
              <p className="text-gray-600">
                Be part of an innovative team that encourages creativity and fresh ideas in both our cuisine and cocktail programs.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg mb-8">
          <h4 className="text-xl font-display font-bold text-gray-900 mb-4">Current Openings</h4>
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id}>
                  <h5 className="font-medium text-gray-900">{job.title}</h5>
                  <div className="text-sm text-gray-600 mb-2">
                    <span>Department: {job.department.name}</span><br />
                    <span>Schedule: {job.job_type.name}</span><br />
                    <span>Salary: {formatSalary(job)}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{job.description}</p>
                  <Link 
                    to={`/careers/apply?position=${encodeURIComponent(job.title)}`}
                    className="inline-flex items-center text-ocean-600 hover:text-ocean-700"
                  >
                    Apply Now <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center">
                No positions currently available. Please check back later.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <h4 className="text-xl font-display font-bold text-gray-900 mb-4">Our Values</h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Passion for Excellence</h5>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from our innovative menu to our exceptional service.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Team Spirit</h5>
              <p className="text-gray-600">
                Success comes through collaboration. We support each other and celebrate our collective achievements.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Continuous Learning</h5>
              <p className="text-gray-600">
                We encourage curiosity and provide opportunities for our team to grow and develop their skills.
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Sustainability</h5>
              <p className="text-gray-600">
                We're committed to sustainable practices and responsible sourcing, making a positive impact on our community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersDrawer;