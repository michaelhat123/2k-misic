"use client";

import React from "react";

/**
 * Animated three-dot loader using the 2k Music word gradient for each dot.
 * Visually matches the search bar loader, but each dot is filled with the sidebar "2k Music" word gradient.
 * Gradient: linear-gradient(135deg, #00bfff, #1e90ff)
 * Props: size (px), className
 */
export function GradientDotLoader({
  size = 18,
  className = ""
}: {
  size?: number;
  className?: string;
}) {
  // Use SVG for true gradient fill on each dot
  const dotRadius = size / 2;
  const dotSpacing = size * 1.25;
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ minHeight: size * 2 }}>
      {/* Three SVG dots with gradient fill, staggered bounce animation */}
      <svg width={dotSpacing * 3} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="dot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00bfff" />
            <stop offset="100%" stopColor="#1e90ff" />
          </linearGradient>
        </defs>
        {/* Dot 1 */}
        <circle cx={dotRadius} cy={dotRadius} r={dotRadius} fill="url(#dot-gradient)" className="gradient-dot-loader-dot" style={{ animationDelay: '0ms' }} />
        {/* Dot 2 */}
        <circle cx={dotSpacing + dotRadius} cy={dotRadius} r={dotRadius} fill="url(#dot-gradient)" className="gradient-dot-loader-dot" style={{ animationDelay: '150ms' }} />
        {/* Dot 3 */}
        <circle cx={dotSpacing * 2 + dotRadius} cy={dotRadius} r={dotRadius} fill="url(#dot-gradient)" className="gradient-dot-loader-dot" style={{ animationDelay: '300ms' }} />
      </svg>
      <style>{`
        .gradient-dot-loader-dot {
          transform-box: fill-box;
          transform-origin: 50% 50%;
          animation: gradient-dot-bounce 1.2s infinite both;
        }
        @keyframes gradient-dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default GradientDotLoader;
