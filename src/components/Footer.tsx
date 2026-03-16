import React from 'react';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenCareers: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenPrivacy, onOpenCareers }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 px-6 text-white/10 font-garamond text-sm z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div>
          © {new Date().getFullYear()} The Spoonbill Lounge
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenCareers}
            className="hover:text-white/20 transition-colors"
          >
            Careers
          </button>
          <button
            onClick={onOpenPrivacy}
            className="hover:text-white/20 transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={onOpenTerms}
            className="hover:text-white/20 transition-colors"
          >
            Terms of Use
          </button>
          <span>Designed by Justise WebDesigns</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;