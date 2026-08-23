import React from 'react';

interface AiworksLogoProps {
  className?: string;
  variant?: 'full' | 'symbol' | 'horizontal-compact';
  height?: number | string;
}

/**
 * AIWORKS Official Brand Logo Component
 * Pixel-accurate vector implementation of logo_horizontal_light.png
 * - Symbol: Exact tilted pill loop + right leg + gold dot
 * - Wordmark: "AIWORKS" in dark navy (#19234A)
 * - Subtitle: "에 이 아 이 웍 스" in brand gold (#C59135)
 */
export const AiworksLogo: React.FC<AiworksLogoProps> = ({
  className = '',
  variant = 'full',
  height = 36,
}) => {
  if (variant === 'symbol') {
    return (
      <svg
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ height }}
      >
        {/* Golden Dot */}
        <circle cx="140" cy="28" r="14.5" fill="#C59135" />

        {/* Right Leg */}
        <path
          d="M78 70L138 144"
          stroke="#19234A"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* Stadium Loop (Left 'a' shape) */}
        <path
          d="M 54.7 50.1
             A 19 19 0 0 1 89.3 65.9
             L 55.3 139.9
             A 19 19 0 0 1 20.7 124.1
             Z"
          fill="none"
          stroke="#19234A"
          strokeWidth="22"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 520 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height, width: 'auto' }}
        className="shrink-0"
      >
        {/* === 1. Exact Symbol on Left === */}
        <g id="aiworks-symbol" transform="translate(4, -8) scale(0.85)">
          {/* Gold Dot */}
          <circle cx="140" cy="30" r="14.5" fill="#C59135" />

          {/* Right Leg */}
          <path
            d="M78 72L138 146"
            stroke="#19234A"
            strokeWidth="22"
            strokeLinecap="round"
          />

          {/* Stadium Loop */}
          <path
            d="M 54.7 52.1
               A 19 19 0 0 1 89.3 67.9
               L 55.3 141.9
               A 19 19 0 0 1 20.7 126.1
               Z"
            fill="none"
            stroke="#19234A"
            strokeWidth="22"
            strokeLinejoin="round"
          />
        </g>

        {/* === 2. Wordmark "AIWORKS" === */}
        <text
          x="142"
          y="76"
          fontFamily="'Montserrat', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="800"
          fontSize="64"
          fill="#19234A"
          letterSpacing="1"
        >
          AIWORKS
        </text>

        {/* === 3. Subtitle "에 이 아 이 웍 스" === */}
        <text
          x="238"
          y="114"
          fontFamily="'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
          fontWeight="700"
          fontSize="22"
          fill="#C59135"
          letterSpacing="7"
        >
          에이아이웍스
        </text>
      </svg>
    </div>
  );
};

