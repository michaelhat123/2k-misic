"use client";

import React from "react";

interface PillProgressBarProps {
  value: number; // current progress (seconds or percent)
  max: number;   // total (seconds or percent)
  height?: number; // px
  gradient?: string; // e.g., "linear-gradient(90deg, #00bfff, #1e90ff)"
  background?: string; // e.g., "#333"
  onChange?: (value: number) => void;
  className?: string;
}

export const PillProgressBar: React.FC<PillProgressBarProps> = ({
  value,
  max,
  height = 3,
  gradient = "linear-gradient(90deg, #00bfff, #1e90ff)",
  background = "#444",
  onChange,
  className = "",
}) => {
  const percent = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  // Use a very large borderRadius to guarantee pill shape
  const barRadius = 9999;
  const [dragging, setDragging] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const barRef = React.useRef<HTMLDivElement>(null);

  // Drag logic
  const updateValueFromClientX = (clientX: number) => {
    if (!barRef.current || !onChange) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newPercent = x / rect.width;
    onChange(newPercent * max);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updateValueFromClientX(clientX);
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging]);

  // Thumb position
  const thumbSize = height * 2;
  const thumbLeft = `calc(${percent * 100}% - ${thumbSize / 2}px)`;

  return (
    <div
      ref={barRef}
      className={`relative w-full flex items-center select-none ${className}`}
      style={{ height, minHeight: height, maxHeight: height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onChange ? (e) => {
        if ((e.target as HTMLElement).dataset.thumb) return; // Don't double-fire on thumb
        updateValueFromClientX((e as React.MouseEvent).clientX);
      } : undefined}
    >
      {/* Background track */}
      <div
        className="overflow-hidden w-full flex items-center"
        style={{ height: '100%', borderRadius: barRadius, background }}
      >
        {/* Progress fill (gradient) */}
        <div
          style={{
            width: `${percent * 100}%`,
            height: '100%',
            background: gradient,
            borderRadius: barRadius,
            transition: dragging ? 'none' : "width 0.15s cubic-bezier(.4,1,.6,1)",
          }}
        />
      </div>
      {/* Draggable thumb (visible only on hover or dragging) */}
      {onChange && (hovered || dragging) && (
        <div
          data-thumb
          tabIndex={0}
          role="slider"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-valuemin={0}
          className={
            `absolute z-10 transition-colors duration-150 top-1/2`
          }
          style={{
            left: thumbLeft,
            transform: 'translateY(-50%)',
            width: `${height * 3}px`,
            height: `${height * 3}px`,
            borderRadius: 9999,
            background: gradient,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            outline: 'none',
            border: 'none',
          }}
          onMouseDown={() => setDragging(true)}
          onTouchStart={() => setDragging(true)}
          onKeyDown={e => {
            if (!onChange) return;
            if (e.key === 'ArrowLeft') {
              onChange(Math.max(0, value - max * 0.01));
            } else if (e.key === 'ArrowRight') {
              onChange(Math.min(max, value + max * 0.01));
            }
          }}
        />
      )}
      {/* Invisible overlay for pointer events */}
      <div
        style={{
          width: "100%",
          height: height * 2,
          position: "absolute",
          top: -height / 2,
          left: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
};
