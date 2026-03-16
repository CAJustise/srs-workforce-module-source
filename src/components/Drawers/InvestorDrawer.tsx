import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InvestorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvestorDrawer: React.FC<InvestorDrawerProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    accreditedStatus: '',
    investmentAmount: '',
    priorExperience: '',
    interestReason: '',
    willingToSignNDA: false,
    preferredContact: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('investor_submissions')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          accredited_status: formData.accreditedStatus,
          investment_amount: formData.investmentAmount,
          prior_experience: formData.priorExperience,
          interest_reason: formData.interestReason,
          willing_to_sign_nda: formData.willingToSignNDA,
          preferred_contact: formData.preferredContact
        }]);

      if (submitError) throw submitError;

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        accreditedStatus: '',
        investmentAmount: '',
        priorExperience: '',
        interestReason: '',
        willingToSignNDA: false,
        preferredContact: ''
      });

      alert('Thank you for your interest! We will be in touch shortly.');
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('There was an error submitting your form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 overflow-hidden z-50" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="pointer-events-auto w-screen max-w-md"
              >
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="bg-ocean-600 px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-display font-bold text-white" id="slide-over-title">
                        Investor Interest Form
                      </h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="rounded-md text-white hover:text-white/80"
                          onClick={onClose}
                        >
                          <span className="sr-only">Close panel</span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/80 font-garamond">
                      Join us in shaping the future of elevated dining and craft cocktails in Redondo Beach.
                    </p>
                  </div>

                  <div className="relative flex-1 px-4 py-6 sm:px-6">
                    {error && (
                      <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Basic Contact Information */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-display font-bold text-gray-900">Contact Information</h3>
                        <div className="grid grid-cols-1 gap-6">
                          <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              name="fullName"
                              id="fullName"
                              required
                              value={formData.fullName}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              required
                              value={formData.email}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            />
                          </div>

                          <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                              Company (if applicable)
                            </label>
                            <input
                              type="text"
                              name="company"
                              id="company"
                              value={formData.company}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Investment Qualifications */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-display font-bold text-gray-900">Investment Qualifications</h3>
                        <div className="space-y-6">
                          <div>
                            <label htmlFor="accreditedStatus" className="block text-sm font-medium text-gray-700">
                              Are you an accredited investor? *
                            </label>
                            <select
                              name="accreditedStatus"
                              id="accreditedStatus"
                              required
                              value={formData.accreditedStatus}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            >
                              <option value="">Select an option</option>
                              <option value="accredited">Yes, I am an accredited investor</option>
                              <option value="experienced">No, but I have significant investment experience</option>
                              <option value="exploring">No, I am exploring investment opportunities</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700">
                              How much are you looking to invest? *
                            </label>
                            <select
                              name="investmentAmount"
                              id="investmentAmount"
                              required
                              value={formData.investmentAmount}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            >
                              <option value="">Select an amount</option>
                              <option value="25-50k">$25,000 - $50,000</option>
                              <option value="50-100k">$50,000 - $100,000</option>
                              <option value="100-250k">$100,000 - $250,000</option>
                              <option value="250k+">$250,000+</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Investment Interest */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-display font-bold text-gray-900">Investment Interest</h3>
                        <div className="space-y-6">
                          <div>
                            <label htmlFor="priorExperience" className="block text-sm font-medium text-gray-700">
                              Have you invested in hospitality, restaurants, or F&B before? *
                            </label>
                            <select
                              name="priorExperience"
                              id="priorExperience"
                              required
                              value={formData.priorExperience}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            >
                              <option value="">Select an option</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="interestReason" className="block text-sm font-medium text-gray-700">
                              What interests you most about investing in Spoonbill? *
                            </label>
                            <textarea
                              name="interestReason"
                              id="interestReason"
                              required
                              rows={4}
                              value={formData.interestReason}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-display font-bold text-gray-900">Next Steps</h3>
                        <div className="space-y-6">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="willingToSignNDA"
                              id="willingToSignNDA"
                              checked={formData.willingToSignNDA}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                willingToSignNDA: e.target.checked
                              }))}
                              className="h-4 w-4 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                            />
                            <label htmlFor="willingToSignNDA" className="ml-2 block text-sm text-gray-700">
                              I am willing to sign an NDA before reviewing financials
                            </label>
                          </div>

                          <div>
                            <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700">
                              Preferred method of follow-up *
                            </label>
                            <select
                              name="preferredContact"
                              id="preferredContact"
                              required
                              value={formData.preferredContact}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-ocean-500"
                            >
                              <option value="">Select a method</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="video">Video Call</option>
                              <option value="inperson">In-Person Meeting</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-ocean-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? 'Submitting...' : 'Submit Interest'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvestorDrawer;