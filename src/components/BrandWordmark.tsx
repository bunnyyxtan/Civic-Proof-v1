import React from 'react';

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 group cursor-default select-none ${className}`}>
      {/* Small Seal / Motif */}
      <div className="relative w-[22px] h-[22px] flex items-center justify-center shrink-0 border-[1.5px] border-ink bg-paper transition-all duration-200">
        <span className="font-display font-black text-[11px] leading-none text-ink mt-[1px]">CP</span>
        {/* Offset print shadow effect */}
        <div className="absolute top-[3px] left-[3px] w-full h-full bg-ink/20 -z-10 transition-transform duration-200 group-hover:translate-x-px group-hover:translate-y-px"></div>
      </div>
      
      {/* Text Mark */}
      <div className="flex items-baseline tracking-tighter leading-[0.8] relative pb-1">
        <span className="font-display font-black text-ink text-2xl" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.1)' }}>CIVIC</span>
        <span className="font-display font-black text-ink text-2xl relative z-10" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.1)' }}>
          PROOF
          {/* Subtle stamp underline */}
          <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-stamp opacity-90 group-hover:opacity-100 transition-all duration-200 -z-10 group-hover:translate-y-[1px]"></span>
        </span>
      </div>
    </div>
  );
}
