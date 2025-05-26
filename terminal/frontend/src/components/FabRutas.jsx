// src/components/FABRutas.jsx
import React from 'react';
import { Plus, Map } from 'lucide-react';

function FabRutas({ onClick, icon = 'plus', label = 'Acción' }) {
  const Icon = icon === 'map' ? Map : Plus;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110 flex items-center justify-center"
    >
      <Icon size={24} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default FabRutas;
