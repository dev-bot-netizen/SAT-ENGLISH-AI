
import React from 'react';
import { MegaphoneIcon } from './icons/MegaphoneIcon';

interface AdBannerProps {
  orientation: 'horizontal' | 'vertical';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ orientation, className = '' }) => {
  const baseClasses = 'bg-gray-900/70 backdrop-blur-sm border-gray-800 flex items-center justify-center text-gray-500 text-sm';
  
  const orientationClasses = {
    horizontal: 'w-full h-20 border-t',
    vertical: 'w-40 h-[600px] border rounded-lg',
  };

  return (
    <div
      className={`${baseClasses} ${orientationClasses[orientation]} ${className}`}
      role="complementary"
      aria-label="Advertisement"
    >
      <div className="flex flex-col items-center space-y-2">
        <MegaphoneIcon className="w-6 h-6" />
        <span>Advertisement</span>
      </div>
    </div>
  );
};

export default AdBanner;