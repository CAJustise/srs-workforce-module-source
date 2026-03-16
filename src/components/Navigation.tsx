import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import logoNavy from '../assets/SpoonbillLogoDark.png';

interface NavigationProps {
  onOpenMenu: () => void;
  onOpenEvents: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  onOpenVisit: () => void;
  onOpenInvestor: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  onOpenMenu,
  onOpenEvents,
  onOpenAbout,
  onOpenContact,
  onOpenVisit,
  onOpenInvestor
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Menu', action: onOpenMenu },
    { name: 'Events', action: onOpenEvents },
    { name: 'About', action: onOpenAbout },
    { name: 'Contact', action: onOpenContact },
  ];

  return (
    <>
      <div className="fixed w-full z-50 px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="max-w-7xl mx-auto bg-white/50 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
          <div className="px-4 sm:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/" className="flex items-center">
                    <img src={logoNavy} alt="The Spoonbill" className="h-8 w-auto" />
                    <span className="ml-3 text-2xl font-garamond font-medium text-gray-900">The Spoonbill Lounge</span>
                  </Link>
                </motion.div>
                <motion.button 
                  onClick={onOpenVisit}
                  className="hidden lg:flex items-center ml-8 text-sm text-gray-600 hover:text-ocean-600 transition-colors"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="font-garamond">Redondo Beach</span>
                </motion.button>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <motion.div
                    key={item.name}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 2 }}
                  >
                    <button
                      onClick={() => {
                        item.action();
                        setIsOpen(false);
                      }}
                      className="text-gray-800 hover:text-ocean-600 px-3 py-2 text-sm font-garamond font-medium transition-colors"
                    >
                      {item.name}
                    </button>
                  </motion.div>
                ))}
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 2 }}
                >
                  <button
                    onClick={onOpenInvestor}
                    className="bg-ocean-600 text-white px-6 py-2 rounded-full text-sm font-garamond font-medium hover:bg-ocean-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Invest
                  </button>
                </motion.div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-white/20"
                >
                  <Menu className="h-6 w-6" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={cn("md:hidden absolute top-full left-0 right-0 mt-2", isOpen ? "block" : "hidden")}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 2 }}
                  onClick={() => {
                    onOpenVisit();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-ocean-600 font-garamond"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Redondo Beach</span>
                </motion.button>
                {navItems.map((item) => (
                  <motion.div
                    key={item.name}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 2 }}
                  >
                    <button
                      onClick={() => {
                        item.action();
                        setIsOpen(false);
                      }}
                      className="text-gray-800 hover:text-ocean-600 block w-full text-left px-3 py-2 text-base font-garamond font-medium rounded-lg hover:bg-gray-50"
                    >
                      {item.name}
                    </button>
                  </motion.div>
                ))}
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 2 }}
                  className="p-2"
                >
                  <button
                    onClick={() => {
                      onOpenInvestor();
                      setIsOpen(false);
                    }}
                    className="bg-ocean-600 text-white block w-full px-3 py-2 rounded-lg text-base font-garamond font-medium hover:bg-ocean-700 shadow-md hover:shadow-lg text-center"
                  >
                    Invest
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navigation;
