import React from 'react';

interface IdenticonProps {
  shape: string;
  color: string;
  size?: number;
  className?: string;
}

export function Identicon({ shape, color, size = 44, className = '' }: IdenticonProps) {
  const half = size / 2;
  const strokeWidth = Math.max(1.5, size / 24);

  const renderShape = () => {
    switch (shape) {
      case 'circle':
        return (
          <>
            <circle cx={half} cy={half} r={half - 4} fill={color} opacity="0.85" />
            <circle cx={half} cy={half} r={half / 2} fill="none" stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.6" />
            <line x1={4} y1={half} x2={size - 4} y2={half} stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.4" />
          </>
        );
      case 'triangle':
        return (
          <>
            <polygon 
              points={`${half},4 ${size - 4},${size - 6} 4,${size - 6}`} 
              fill={color} 
              opacity="0.85" 
            />
            <polygon 
              points={`${half},${half - 4} ${size - 12},${size - 12} 12,${size - 12}`} 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth={strokeWidth} 
              opacity="0.5" 
            />
          </>
        );
      case 'square':
        return (
          <>
            <rect x="5" y="5" width={size - 10} height={size - 10} rx="4" fill={color} opacity="0.85" />
            <rect x="10" y="10" width={size - 20} height={size - 20} rx="2" fill="none" stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.5" />
            <line x1="5" y1="5" x2={size - 5} y2={size - 5} stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.3" />
          </>
        );
      case 'hexagon':
        return (
          <>
            <polygon 
              points={`${half},3 ${size - 4},${size / 4 + 2} ${size - 4},${(3 * size) / 4 - 2} ${half},${size - 3} 4,${(3 * size) / 4 - 2} 4,${size / 4 + 2}`} 
              fill={color} 
              opacity="0.85" 
            />
            <line x1={half} y1="3" x2={half} y2={size - 3} stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.4" />
          </>
        );
      case 'octagon':
        const offset = size / 3.3;
        return (
          <>
            <polygon 
              points={`${offset},4 ${size - offset},4 ${size - 4},${offset} ${size - 4},${size - offset} ${size - offset},${size - 4} ${offset},${size - 4} 4,${size - offset} 4,${offset}`} 
              fill={color} 
              opacity="0.85" 
            />
            <circle cx={half} cy={half} r={half / 2.5} fill="none" stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.6" />
          </>
        );
      case 'pentagon':
        return (
          <>
            <polygon 
              points={`${half},4 ${size - 4},15 ${size - 8},${size - 4} 8,${size - 4} 4,15`} 
              fill={color} 
              opacity="0.85" 
            />
            <polygon 
              points={`${half},12 ${size - 10},20 ${size - 14},${size - 10} 14,${size - 10} 10,20`} 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth={strokeWidth} 
              opacity="0.5" 
            />
          </>
        );
      case 'diamond':
        return (
          <>
            <polygon 
              points={`${half},4 ${size - 4},${half} ${half},${size - 4} 4,${half}`} 
              fill={color} 
              opacity="0.85" 
            />
            <line x1={half} y1="4" x2={half} y2={size - 4} stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.3" />
            <line x1="4" y1={half} x2={size - 4} y2={half} stroke="#FFFFFF" strokeWidth={strokeWidth} opacity="0.3" />
          </>
        );
      case 'star':
      default:
        return (
          <>
            <polygon 
              points={`${half},3 ${half + 5},${half - 3} ${size - 4},${half - 3} ${half + 8},${half + 4} ${half + 12},${size - 4} ${half},${half + 9} ${half - 12},${size - 4} ${half - 8},${half + 4} 4,${half - 3} ${half - 5},${half - 3}`} 
              fill={color} 
              opacity="0.85" 
            />
            <circle cx={half} cy={half + 3} r="3" fill="#FFFFFF" opacity="0.7" />
          </>
        );
    }
  };

  return (
    <div 
      className={`relative inline-block select-none overflow-hidden rounded-xl bg-slate-800 border border-slate-700 p-0.5 shadow-md flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      id={`identicon-${shape}-${color.replace('#', '')}`}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${size} ${size}`} 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        {renderShape()}
      </svg>
    </div>
  );
}