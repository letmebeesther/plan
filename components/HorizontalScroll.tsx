
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({ children, className = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 320; // Approximate width of a card
      const targetScroll = direction === 'left' 
        ? current.scrollLeft - scrollAmount 
        : current.scrollLeft + scrollAmount;
        
      current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`relative group md:px-14 ${className}`}>
      {/* Left Button (Desktop Only) */}
      <button 
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full p-3 shadow-lg text-slate-700 hover:text-brand-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 focus:outline-none"
        aria-label="Scroll Left"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide px-4 -mx-4 md:mx-0 md:px-2 scroll-smooth snap-x snap-mandatory md:snap-none"
      >
        {children}
      </div>

      {/* Right Button (Desktop Only) */}
      <button 
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full p-3 shadow-lg text-slate-700 hover:text-brand-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:outline-none"
        aria-label="Scroll Right"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};
