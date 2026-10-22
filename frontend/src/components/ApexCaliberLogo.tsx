import React from 'react';

interface ApexCaliberLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'lockup' | 'icon-only';
}

export const ApexCaliberLogo: React.FC<ApexCaliberLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  // Dimension maps
  const dimensions = {
    sm: {
      img: 'h-7 w-7',
      text: 'text-base',
      gap: 'gap-2',
      badge: 'text-[9px] px-1 py-0.2',
    },
    md: {
      img: 'h-8 w-8',
      text: 'text-lg',
      gap: 'gap-2.5',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      img: 'h-11 w-11',
      text: 'text-2xl',
      gap: 'gap-3.5',
      badge: 'text-xs px-2 py-0.5',
    },
  }[size];

  return (
    <div className={`flex items-center ${dimensions.gap} select-none ${className}`}>
      {/* Emblem: Neural Nodes + Golden Apex Peak */}
      <div className="relative flex shrink-0 items-center justify-center">
        {/* Ambient backlight glow */}
        <div
          className="absolute -inset-1 rounded-full bg-gradient-to-t from-purple-600/30 via-amber-500/25 to-yellow-300/30 blur-sm pointer-events-none opacity-80 dark:opacity-100"
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-lg bg-[#0B0814] p-0.5 border border-purple-500/25 dark:border-amber-500/20 shadow-sm transition-transform duration-300 hover:scale-105">
          <img
            src="/apex-emblem.png"
            alt="ApexCaliber Emblem"
            className={`${dimensions.img} relative object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]`}
          />
        </div>
      </div>

      {/* Precision typography */}
      {showText && (
        <div className="flex items-center tracking-tight leading-none">
          <span className={`font-sans font-black text-chalk ${dimensions.text} tracking-wider`}>
            APEX
          </span>
          <span
            className={`font-sans font-black ${dimensions.text} tracking-wider bg-gradient-to-r from-purple-700 via-amber-600 to-amber-700 dark:from-purple-300 dark:via-amber-300 dark:to-yellow-200 bg-clip-text text-transparent ml-1`}
          >
            CALIBER
          </span>
        </div>
      )}
    </div>
  );
};

export default ApexCaliberLogo;
