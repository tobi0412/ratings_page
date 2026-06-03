import React from 'react';

export const POSITIONS = [
  { id: 'DC', x: 50, y: 10, label: 'DC' },
  { id: 'EI', x: 20, y: 22, label: 'EI' },
  { id: 'ED', x: 80, y: 22, label: 'ED' },
  { id: 'MCO', x: 50, y: 32, label: 'MCO' },
  { id: 'MI', x: 15, y: 46, label: 'MI' },
  { id: 'MC', x: 50, y: 46, label: 'MC' },
  { id: 'MD', x: 85, y: 46, label: 'MD' },
  { id: 'MCD', x: 50, y: 60, label: 'MCD' },
  { id: 'DFI', x: 18, y: 76, label: 'DFI' },
  { id: 'DFC', x: 50, y: 76, label: 'DFC' },
  { id: 'DFD', x: 82, y: 76, label: 'DFD' },
  { id: 'PO', x: 50, y: 92, label: 'PO' },
];

interface Props {
  isEditing: boolean;
  selectedPositions: string[];
  onChange?: (positions: string[]) => void;
}

export default function FootballField({ isEditing, selectedPositions, onChange }: Props) {
  const togglePosition = (posId: string) => {
    if (!isEditing || !onChange) return;
    
    if (selectedPositions.includes(posId)) {
      onChange(selectedPositions.filter(p => p !== posId));
    } else {
      if (selectedPositions.length < 3) {
        onChange([...selectedPositions, posId]);
      }
    }
  };

  return (
    <div 
      className="relative w-full max-w-sm mx-auto aspect-[1/1.4] rounded-xl overflow-hidden stripe-texture"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Field Lines (Neon styled) */}
      <div className="absolute top-1/2 left-0 w-full h-[1px]" style={{ background: 'var(--border-subtle)' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--border-subtle)' }}></div>

      {/* Penalty Areas */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1/6 border-b border-l border-r border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>
      <div className="absolute bottom-0 left-1/4 w-1/2 h-1/6 border-t border-l border-r border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>

      {/* Goal Areas */}
      <div className="absolute top-0 left-[35%] w-[30%] h-[6%] border-b border-l border-r border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>
      <div className="absolute bottom-0 left-[35%] w-[30%] h-[6%] border-t border-l border-r border-solid" style={{ borderColor: 'var(--border-subtle)' }}></div>

      {/* Positions */}
      {POSITIONS.map(pos => {
        const isSelected = selectedPositions.includes(pos.id);
        
        // Hide unselected positions when not editing
        if (!isEditing && !isSelected) return null;
        
        return (
          <button
            key={pos.id}
            type="button"
            onClick={() => togglePosition(pos.id)}
            disabled={!isEditing}
            className={`absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-full flex items-center justify-center text-[0.75rem] font-bold transition-all duration-300 ${
              isSelected
                ? 'z-10'
                : 'hover:scale-110 z-0'
            } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              background: isSelected ? 'var(--accent-lime)' : 'var(--bg-field)',
              color: isSelected ? '#040a06' : 'var(--text-muted)',
              border: `1px solid ${isSelected ? 'var(--accent-lime)' : 'var(--border-subtle)'}`,
              boxShadow: isSelected ? '0 0 16px rgba(0, 230, 118, 0.4)' : 'none',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.05em",
              transform: isSelected && isEditing ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {pos.label}
          </button>
        );
      })}

      {/* Empty State Message in Middle of Field */}
      {!isEditing && selectedPositions.length === 0 && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ width: '80%' }}
        >
          <span 
            className="block text-[var(--accent-lime)] opacity-60"
            style={{ 
              fontFamily: "'Bebas Neue', sans-serif", 
              fontSize: '1.25rem',
              letterSpacing: '0.1em',
              textShadow: '0 0 10px rgba(0, 230, 118, 0.2)'
            }}
          >
            SIN POSICIONES FAVORITAS
          </span>
        </div>
      )}
    </div>
  );
}
