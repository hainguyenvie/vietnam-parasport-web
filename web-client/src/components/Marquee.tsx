"use client";

import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // seconds for one full cycle, default 20
  className?: string;
  pauseOnHover?: boolean;
}

export default function Marquee({ children, speed = 20, className = "", pauseOnHover = true }: MarqueeProps) {
  return (
    <div className={`relative w-full flex overflow-hidden ${className}`}>
      {/* Fade masks */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
      <div
        className={`flex gap-16 items-center whitespace-nowrap ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        style={{
          animation: `marquee ${speed}s linear infinite`,
          display: 'flex',
          width: 'max-content',
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
