
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gold-500/10 to-gold-600/10 rounded-lg border border-gold-500/20 text-gold-500 ${className}`}>
        <Sparkles className="w-[70%] h-[70%]" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img 
      src="./logo.ico" 
      alt="Rafeeq Logo" 
      className={`object-contain ${className}`}
      onError={() => setImgError(true)}
    />
  );
};
