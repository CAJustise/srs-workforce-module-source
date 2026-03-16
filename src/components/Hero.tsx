import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import spoonbillExterior from '../assets/SpoonbillExterior.jpg';
import logoLight from '../assets/SpoonbillLogoLight.png';

interface HeroProps {
  onOpenMenu: () => void;
  onOpenReservations?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenMenu, onOpenReservations }) => {
  return (
    <div className="relative h-screen">
      {/* Background Image with reduced blur effect */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${spoonbillExterior})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        {/* Darker overlay with fade in - reduced opacity for better visibility */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-black/50" 
        />
      </motion.div>

      {/* Admin + BOH entry via floating Spoonbill logo */}
      <Link 
        to="/admin/login" 
        className="absolute right-4 bottom-4 z-20 w-36 h-36 transition-opacity duration-200 hover:opacity-40"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="w-full h-full"
        >
          <img 
            src={logoLight} 
            alt="" 
            className="w-full h-full object-contain"
          />
        </motion.div>
      </Link>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-3xl"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-5xl md:text-7xl font-display font-bold text-white mb-6"
              style={{ 
                textShadow: '2px 2px 8px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.4)' 
              }}
            >
              Escape to Paradise
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-xl text-white mb-8 font-garamond"
              style={{ 
                textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' 
              }}
            >
              Savor Pacific Rim cuisine and craft cocktails in our immersive tropical escape.
              <br /><br />
              <span className="italic">The Spoonbill Lounge: Where luxury and paradise unite.</span>
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={onOpenReservations}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-ocean-600 hover:bg-ocean-700 transition-colors shadow-lg group font-garamond"
              >
                Make a Reservation
                <motion.span
                  className="ml-2"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </button>
              <button
                onClick={onOpenMenu}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-full text-white hover:bg-white/10 transition-colors shadow-lg backdrop-blur-sm bg-black/10 font-garamond"
              >
                View Our Menu
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
