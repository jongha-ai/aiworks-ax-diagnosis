import React from 'react';

interface JoCodingAuroraBgProps {
  className?: string;
}

export const JoCodingAuroraBg: React.FC<JoCodingAuroraBgProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* Deep dark space background base */}
      <div className="absolute inset-0 bg-[#030611]" />

      {/* Atmospheric radial glows */}
      <div 
        className="absolute -right-20 -top-20 w-[480px] h-[480px] rounded-full opacity-60 filter blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.5) 0%, rgba(29, 78, 216, 0.25) 45%, rgba(3, 6, 17, 0) 70%)'
        }}
      />
      <div 
        className="absolute right-[5%] top-[20%] w-[380px] h-[520px] rounded-full opacity-55 filter blur-[70px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.45) 0%, rgba(37, 99, 235, 0.2) 50%, rgba(3, 6, 17, 0) 75%)'
        }}
      />
      <div 
        className="absolute right-[20%] -bottom-20 w-[420px] h-[340px] rounded-full opacity-50 filter blur-[80px]"
        style={{
          background: 'radial-gradient(circle, rgba(29, 78, 216, 0.4) 0%, rgba(14, 165, 233, 0.15) 50%, rgba(3, 6, 17, 0) 75%)'
        }}
      />

      {/* High-definition 3D Silk Neon Waves (SVG curves) */}
      <svg 
        className="absolute top-0 right-0 h-full w-full object-cover preserve-3d opacity-90"
        viewBox="0 0 1000 600" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Main Glowing Ribbon Gradient */}
          <linearGradient id="waveGlow1" x1="900" y1="0" x2="450" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#2563EB" stopOpacity="0.6" />
            <stop offset="85%" stopColor="#1D4ED8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#030611" stopOpacity="0" />
          </linearGradient>

          {/* Secondary Ribbon Gradient */}
          <linearGradient id="waveGlow2" x1="1000" y1="50" x2="600" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
            <stop offset="30%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#1E40AF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#030611" stopOpacity="0" />
          </linearGradient>

          {/* Soft Deep Shadow & Core Stream */}
          <linearGradient id="waveCore" x1="880" y1="0" x2="520" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.9" />
            <stop offset="20%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#1D4ED8" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#0F172A" stopOpacity="0" />
          </linearGradient>

          <filter id="blurFilter1" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
          <filter id="blurFilter2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="subtleBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Ambient Wide Diffused Ribbon */}
        <path
          d="M1050,-50 C920,80 840,220 780,340 C720,460 620,540 460,650 L1050,650 Z"
          fill="url(#waveGlow1)"
          filter="url(#blurFilter1)"
          opacity="0.65"
        />

        {/* Primary Soft Silk Wave */}
        <path
          d="M1020,-30 C890,100 810,230 750,350 C690,470 590,540 480,630 L1020,630 Z"
          fill="url(#waveGlow2)"
          filter="url(#blurFilter2)"
          opacity="0.75"
        />

        {/* Crisp Core Light Beam (The iconic bright curved edge) */}
        <path
          d="M980,-20 C870,110 790,240 730,360 C670,480 580,540 500,620"
          stroke="url(#waveCore)"
          strokeWidth="38"
          strokeLinecap="round"
          filter="url(#subtleBlur)"
          opacity="0.85"
        />

        <path
          d="M980,-20 C870,110 790,240 730,360 C670,480 580,540 500,620"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#subtleBlur)"
          opacity="0.6"
        />

        {/* Second flowing ribbon accent */}
        <path
          d="M1050,120 C960,230 890,340 820,440 C750,540 680,580 580,640"
          stroke="url(#waveGlow1)"
          strokeWidth="50"
          filter="url(#blurFilter2)"
          opacity="0.5"
        />
      </svg>

      {/* Left-side Dark Vignette for maximum text readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #030611 0%, rgba(3, 6, 17, 0.95) 35%, rgba(3, 6, 17, 0.6) 60%, rgba(3, 6, 17, 0.1) 85%, transparent 100%)'
        }}
      />
    </div>
  );
};
