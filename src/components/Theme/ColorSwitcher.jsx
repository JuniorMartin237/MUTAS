import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const colors = [
  { name: 'mutas', label: 'Bleu ciel', class: 'bg-mutas-500' },
  { name: 'rose', label: 'Rose clair', class: 'bg-rose-500' },
  { name: 'citron', label: 'Vert citron', class: 'bg-citron-500' },
  { name: 'orange', label: 'Orange clair', class: 'bg-orange-500' },
  { name: 'rouge', label: 'Rouge', class: 'bg-red-500' },
];

function ColorSwitcher() {
  const { color, setColor } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {colors.map(c => (
        <button
          key={c.name}
          onClick={() => setColor(c.name)}
          className={`w-8 h-8 rounded-full transition-transform ${c.class} ${
            color === c.name ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
          }`}
          title={c.label}
        />
      ))}
    </div>
  );
}

export default ColorSwitcher;