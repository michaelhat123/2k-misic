"use client";

import React from "react";

/**
 * Animated three-dot loader for 2k Music brand.
 * Colors: #00BFFF (primary), #333333 (secondary)
 * Props: size (px), color (default: #00BFFF), secondaryColor (default: #333333), className
 */
export function ThreeDotLoader({
  size = 18,
  color = "#00BFFF",
  secondaryColor = "#333333",
  className = ""
}: {
  size?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
}) {
  // Dot spacing is 1x dot size
  const dotStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "inline-block",
    margin: `0 ${size * 0.25}px`,
    background: color,
    animation: "three-dot-bounce 1.2s infinite both"
  } as React.CSSProperties;
  const dot2Style = { ...dotStyle, background: secondaryColor, animationDelay: "0.2s" };
  const dot3Style = { ...dotStyle, animationDelay: "0.4s" };

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ minHeight: size * 2 }}>
      <span style={dotStyle} />
      <span style={dot2Style} />
      <span style={dot3Style} />
      <style>{`
        @keyframes three-dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ThreeDotLoader;
