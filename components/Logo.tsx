
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
   <svg
        viewBox="0 0 500 500"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="softGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CA8A04" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        <g stroke="url(#softGold)" strokeWidth="20" strokeLinecap="round" fill="none">
          <line x1="150" y1="450" x2="350" y2="100" />
          <line x1="200" y1="450" x2="400" y2="100" />
          <line x1="165" y1="410" x2="215" y2="410" strokeWidth="15" />
          <line x1="195" y1="350" x2="245" y2="350" strokeWidth="15" />
          <line x1="225" y1="290" x2="275" y2="290" strokeWidth="15" />
          <line x1="255" y1="230" x2="305" y2="230" strokeWidth="15" />
        </g>

        <path
          d="M 380 30 L 392 68 L 430 68 L 400 92 L 412 130 L 380 106 L 348 130 L 360 92 L 330 68 L 368 68 Z"
          fill="url(#softGold)"
        />
      </svg>
  );
};
