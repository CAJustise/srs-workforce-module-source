import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MenuContent from './MenuContent';

const MenuPage: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isMobile) {
    return null; // Desktop users will see the drawer version
  }

  return (
    <div className="min-h-screen bg-white pt-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <MenuContent />
      </div>
    </div>
  );
};

export default MenuPage;