
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
   <svg
        viewBox="0 0 500 500"
        className="w-72 h-72 filter drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* تدرج ذهبي فاتح (Champagne Gold) */}
          <linearGradient id="softGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C5A028" />
            <stop offset="50%" stopColor="#F9E2AF" />
            <stop offset="100%" stopColor="#E2C275" />
          </linearGradient>

          <style>
            {`
              @keyframes drawLine {
                from { stroke-dashoffset: 400; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes starPulse {
                0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
                50% { transform: scale(1.2) rotate(15deg); opacity: 1; }
              }
              @keyframes climb {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
              .ladder-line {
                stroke-dasharray: 400;
                stroke-dashoffset: 400;
                animation: drawLine 2s ease-out forwards;
              }
              .star-bright {
                animation: starPulse 3s infinite ease-in-out;
                transform-origin: 380px 80px;
              }
              .climber-1 { animation: climb 3s infinite ease-in-out; }
              .climber-2 { animation: climb 3s infinite ease-in-out 0.5s; }
            `}
          </style>
        </defs>

        {/* السلم (المثابرة) */}
        <g stroke="url(#softGold)" strokeWidth="12" strokeLinecap="round">
          {/* قوائم السلم */}
          <line x1="150" y1="450" x2="350" y2="100" className="ladder-line" />
          <line x1="200" y1="450" x2="400" y2="100" className="ladder-line" />
          
          {/* درجات السلم */}
          <line x1="165" y1="410" x2="215" y2="410" className="ladder-line" style={{animationDelay: '0.2s'}} />
          <line x1="195" y1="350" x2="245" y2="350" className="ladder-line" style={{animationDelay: '0.4s'}} />
          <line x1="225" y1="290" x2="275" y2="290" className="ladder-line" style={{animationDelay: '0.6s'}} />
          <line x1="255" y1="230" x2="305" y2="230" className="ladder-line" style={{animationDelay: '0.8s'}} />
          <line x1="285" y1="170" x2="335" y2="170" className="ladder-line" style={{animationDelay: '1s'}} />
        </g>

        {/* النجمة الساطعة (الوعي والهدف) */}
        <g className="star-bright">
          <path
            d="M 380 30 L 392 68 L 430 68 L 400 92 L 412 130 L 380 106 L 348 130 L 360 92 L 330 68 L 368 68 Z"
            fill="url(#softGold)"
          />
          {/* هالة الضوء حول النجمة */}
          <circle cx="380" cy="80" r="55" fill="none" stroke="#F9E2AF" strokeWidth="2" strokeDasharray="4 8" opacity="0.5" />
        </g>

        {/* الشخصان (الرفقة) */}
        <g className="climber-1">
          <circle cx="210" cy="315" r="12" fill="#F9E2AF" />
          <path d="M 210 327 Q 210 350 190 360" stroke="#F9E2AF" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
        
        <g className="climber-2">
          <circle cx="260" cy="225" r="12" fill="#D4AF37" />
          <path d="M 260 237 Q 260 260 240 270" stroke="#D4AF37" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>

        {/* النص السفلي */}
        <text
          x="250"
          y="490"
          textAnchor="middle"
          className="fill-amber-600 font-medium text-xl tracking-widest"
          style={{ fontFamily: 'system-ui' }}
        >
          رَفِيقُ الوعي والمُثابرة
        </text>
      </svg>
  );
};
