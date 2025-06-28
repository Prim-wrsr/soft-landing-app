import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  className = "text-sky-600",
  size = 32,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Parachute canopy */}
          <path
            d="M16 4C20.5 4 24 7.5 24 12C24 13 23.8 13.9 23.5 14.8L16 16L8.5 14.8C8.2 13.9 8 13 8 12C8 7.5 11.5 4 16 4Z"
            fill="currentColor"
            opacity="0.8"
          />
          {/* Parachute lines */}
          <path
            d="M9 14L14 20M23 14L18 20M16 16V20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Landing platform (chart arrow) */}
          <path
            d="M4 26L12 22L20 24L28 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points on the chart */}
          <circle cx="8" cy="24" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="16" cy="23" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="24" cy="22" r="2" fill="currentColor" opacity="0.6" />
          {/* Soft landing indicator */}
          <path
            d="M14 20L16 22L18 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight text-left">
          <div className="text-lg font-bold text-grey-800">Soft Landing</div>
          <div className="text-xs text-gray-500">Data Made Simple</div>
        </div>
      )}
    </div>
  );
};

export default Logo;
