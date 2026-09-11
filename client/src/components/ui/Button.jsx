import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  let baseStyle = "px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm";
  
  if (variant === 'primary') {
    baseStyle += " bg-stone-900 hover:bg-stone-800 text-white hover:text-white font-medium shadow-sm active:scale-95";
  } else if (variant === 'secondary') {
    baseStyle += " bg-stone-100 hover:bg-stone-200 text-stone-900 hover:text-stone-950 border border-stone-200 font-medium active:scale-95";
  } else if (variant === 'gold') {
    baseStyle += " bg-emerald-600 hover:bg-emerald-500 text-white hover:text-white font-bold shadow-sm active:scale-95";
  } else if (variant === 'danger') {
    baseStyle += " bg-rose-600 hover:bg-rose-500 text-white hover:text-white font-bold active:scale-95";
  }

  return (
    <button className={`${baseStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}
