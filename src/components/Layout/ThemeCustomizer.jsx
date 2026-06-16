// src/components/Layout/ThemeCustomizer.jsx
import React from 'react';
import { FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';

const colors = [
  { name: 'blue', class: 'bg-blue-500', value: 'blue' },
  { name: 'pink', class: 'bg-pink-500', value: 'pink' },
  { name: 'green', class: 'bg-green-500', value: 'green' },
  { name: 'orange', class: 'bg-orange-500', value: 'orange' },
  { name: 'red', class: 'bg-red-500', value: 'red' },
];

function ThemeCustomizer({ onClose }) {
  const { theme, primaryColor, setTheme, setPrimaryColor } = useTheme();

  return (
    <div className="absolute top-16 right-4 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Personnaliser</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <FiX size={18} />
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-sm font-medium mb-2">Thème</p>
        <div className="flex space-x-3 mb-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-2 rounded-lg border flex items-center justify-center space-x-2 ${
              theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300'
            }`}
          ><FiSun /> <span>Clair</span></button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2 rounded-lg border flex items-center justify-center space-x-2 ${
              theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300'
            }`}
          ><FiMoon /> <span>Sombre</span></button>
        </div>
        
        <p className="text-sm font-medium mb-2">Couleur principale</p>
        <div className="flex space-x-3">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => setPrimaryColor(color.value)}
              className={`w-8 h-8 rounded-full ${color.class} transition-all ${
                primaryColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThemeCustomizer;