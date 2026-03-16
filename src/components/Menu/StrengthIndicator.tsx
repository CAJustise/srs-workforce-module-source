import React from 'react';

interface StrengthIndicatorProps {
  strength: number;
  maxStrength?: number;
  className?: string;
}

export const StrengthIndicator: React.FC<StrengthIndicatorProps> = ({
  strength,
  maxStrength = 5,
  className = "h-5 w-5"
}) => {
  return (
    <div className="flex gap-1">
      {Array(maxStrength)
        .fill(0)
        .map((_, i) => (
          <svg
            key={i}
            className={`${className} ${i < strength ? 'text-ocean-600' : 'text-gray-200'}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V5C17 5.55228 16.5523 6 16 6H15.9185C15.9720 6.31962 16 6.65584 16 7C16 9.76142 13.7614 12 11 12C8.23858 12 6 9.76142 6 7C6 6.65584 6.02799 6.31962 6.08149 6H6C5.44772 6 5 5.55228 5 5V3C5 2.44772 5.44772 2 6 2H7ZM11 22C7.13401 22 4 18.866 4 15C4 11.134 7.13401 8 11 8C14.866 8 18 11.134 18 15C18 18.866 14.866 22 11 22Z" />
            <path d="M9 16.5C9 15.6716 9.67157 15 10.5 15H11.5C12.3284 15 13 15.6716 13 16.5C13 17.3284 12.3284 18 11.5 18H10.5C9.67157 18 9 17.3284 9 16.5Z" />
            <path d="M8 13.5C8 12.6716 8.67157 12 9.5 12H12.5C13.3284 12 14 12.6716 14 13.5C14 14.3284 13.3284 15 12.5 15H9.5C8.67157 15 8 14.3284 8 13.5Z" />
          </svg>
        ))}
    </div>
  );
};