import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MenuContent from './MenuContent';
import spoonbillExterior from '../../assets/SpoonbillExterior.jpg';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="relative min-h-screen">
              {/* Header */}
              <div className="relative h-48">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${spoonbillExterior})`,
                  }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/40" />
                </div>
                
                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm transition-colors text-white z-50"
                >
                  <X className="h-6 w-6" />
                </motion.button>

                {/* Header Content */}
                <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                  <h2 className="text-5xl font-display font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    Our Menu
                  </h2>
                </div>
              </div>

              {/* Menu Content */}
              <div className="p-6 bg-white">
                <MenuContent />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[600px] bg-white/45 backdrop-blur-md shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="relative h-48">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${spoonbillExterior})`,
                }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/40" />
              </div>
              
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm transition-colors text-white z-50"
              >
                <X className="h-6 w-6" />
              </motion.button>

              {/* Header Content */}
              <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                <h2 className="text-5xl font-display font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  Our Menu
                </h2>
              </div>
            </div>

            {/* Menu Content */}
            <div className="p-6 bg-white/45 backdrop-blur-md">
              <MenuContent />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MenuDrawer;