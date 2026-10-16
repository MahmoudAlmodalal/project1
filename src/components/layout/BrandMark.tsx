import React from "react";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-gradient-to-br from-indigo-500 via-primary to-violet-600 shadow-[0_8px_22px_rgba(79,70,229,0.28)] ring-1 ring-white/30">
        <svg viewBox="0 0 40 40" className="h-7 w-7" fill="none" aria-hidden="true">
          <path d="M10 14.5 20 9l10 5.5v11L20 31l-10-5.5v-11Z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="m10.5 14.5 9.5 5.3 9.5-5.3M20 19.8V30.5" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M25.5 11.9 32 8.5M30 7.2l2.5 1.3-1.1 2.6" stroke="#C4B5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="absolute -bottom-5 -end-5 h-12 w-12 rounded-full bg-white/10" />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-heading text-[17px] font-extrabold tracking-tight text-foreground">Borrow<span className="text-primary">Hub</span></span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.08em] text-muted-foreground">CAMPUS EQUIPMENT</span>
        </div>
      )}
    </div>
  );
}
