import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="bg-white border border-stone-200/80 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto my-6 shadow-sm">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 mx-auto flex items-center justify-center mb-2">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="font-serif font-bold text-lg text-stone-900">{title || 'No data available'}</h4>
      <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">{description || 'There are no items to display at this time.'}</p>
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}
