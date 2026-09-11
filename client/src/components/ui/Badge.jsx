import React from 'react';
import { theme } from '../../design/theme';

export default function Badge({ status, label, className = '' }) {
  const statusKey = status || label;
  const variantClass = theme.badgeVariants[statusKey] || 'bg-stone-100 text-stone-700 border-stone-200';
  return (
    <span className={`inline-flex items-center px-3 py-0.5 text-[11px] font-semibold tracking-wider rounded-full border uppercase ${variantClass} ${className}`}>
      {label || status}
    </span>
  );
}
