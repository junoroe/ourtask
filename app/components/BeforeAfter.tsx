'use client';

import { useState, useRef } from 'react';

interface BeforeAfterProps {
  before: string;
  after: string;
  title?: string;
}

export default function BeforeAfter({ before, after, title }: BeforeAfterProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  function handleMove(clientX: number) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }

  function onMouseDown() { isDragging.current = true; }
  function onMouseUp() { isDragging.current = false; }
  function onMouseMove(e: React.MouseEvent) {
    if (isDragging.current) handleMove(e.clientX);
  }
  function onTouchMove(e: React.TouchEvent) {
    handleMove(e.touches[0].clientX);
  }

  return (
    <div className="rounded-xl overflow-hidden">
      {title && (
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Before</span>
          <span className="font-medium">{title}</span>
          <span>After ✨</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="relative w-full cursor-col-resize select-none"
        style={{ aspectRatio: '16/9' }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
      >
        {/* After image (full width, behind) */}
        <img
          src={after}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={before}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%', maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
            style={{ cursor: 'col-resize' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 3L2 8L5 13" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 3L14 8L11 13" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium">
          Before
        </div>
        <div className="absolute bottom-3 right-3 bg-green-600/80 text-white text-xs px-2 py-1 rounded-md font-medium">
          After ✨
        </div>
      </div>
    </div>
  );
}
