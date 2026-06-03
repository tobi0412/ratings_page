import React from 'react';

export const HORIZONTAL_POSITIONS = [
  { id: 'PO', x: 10, y: 50, label: 'PO' },
  { id: 'DFC', x: 26, y: 50, label: 'DFC' },
  { id: 'DFI', x: 26, y: 20, label: 'DFI' },
  { id: 'DFD', x: 26, y: 80, label: 'DFD' },
  { id: 'MCD', x: 42, y: 50, label: 'MCD' },
  { id: 'MC', x: 56, y: 50, label: 'MC' },
  { id: 'MI', x: 56, y: 15, label: 'MI' },
  { id: 'MD', x: 56, y: 85, label: 'MD' },
  { id: 'MCO', x: 70, y: 50, label: 'MCO' },
  { id: 'EI', x: 80, y: 20, label: 'EI' },
  { id: 'ED', x: 80, y: 80, label: 'ED' },
  { id: 'DC', x: 90, y: 50, label: 'DC' },
];

interface Props {
  selectedPositions: string[];
}

export default function HorizontalFootballField({ selectedPositions }: Props) {
  return (
    <div 
      className="relative rounded-lg overflow-hidden stripe-texture"
      style={{
        width: '200px',
        height: '130px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      {/* Field Lines (Horizontal styling) */}
      {/* Midfield line (vertical center) */}
      <div className="absolute left-1/2 top-0 w-[1px] h-full" style={{ background: 'var(--border-subtle)' }}></div>
      {/* Center circle */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-solid" 
        style={{ width: '40px', height: '40px', borderColor: 'var(--border-subtle)' }}
      ></div>
      {/* Center dot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full" style={{ background: 'var(--border-subtle)' }}></div>

      {/* Left Penalty Area (Goalkeeper side) */}
      <div className="absolute left-0 top-1/4 w-1/6 h-1/2 border-r border-t border-b border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>
      {/* Left Goal Area */}
      <div className="absolute left-0 top-[35%] w-[6%] h-[30%] border-r border-t border-b border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>

      {/* Right Penalty Area (Attackers side) */}
      <div className="absolute right-0 top-1/4 w-1/6 h-1/2 border-l border-t border-b border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>
      {/* Right Goal Area */}
      <div className="absolute right-0 top-[35%] w-[6%] h-[30%] border-l border-t border-b border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>

      {/* Selected Positions Renders */}
      {HORIZONTAL_POSITIONS.map(pos => {
        const isSelected = selectedPositions.includes(pos.id);
        if (!isSelected) return null;

        return (
          <div
            key={pos.id}
            className="absolute flex items-center justify-center rounded-full text-[0.6rem] font-extrabold"
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              width: '20px',
              height: '20px',
              marginLeft: '-10px',
              marginTop: '-10px',
              background: 'var(--accent-lime)',
              color: '#040a06',
              border: '1px solid var(--accent-lime)',
              boxShadow: '0 0 10px rgba(0, 230, 118, 0.4)',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.02em",
              zIndex: 10
            }}
          >
            {pos.label}
          </div>
        );
      })}

      {/* Empty State Message */}
      {selectedPositions.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
          <span 
            className="block text-[var(--accent-lime)] opacity-40 text-[0.65rem] uppercase tracking-widest"
            style={{ 
              fontFamily: "'Bebas Neue', sans-serif",
              textShadow: '0 0 5px rgba(0, 230, 118, 0.1)'
            }}
          >
            SIN POSICIONES
          </span>
        </div>
      )}
    </div>
  );
}
