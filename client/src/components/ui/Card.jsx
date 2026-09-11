import React from 'react';

export default function Card({ children, className = '', hover = false, padding = 'p-6' }) {
  return (
    <div className={`bg-white border border-stone-200/80 rounded-3xl ${padding} shadow-sm ${
      hover ? 'hover:border-stone-300 hover:shadow-md transition-all duration-200' : ''
    } ${className}`}>
      {children}
    </div>
  );
}
