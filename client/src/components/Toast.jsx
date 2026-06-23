import React from 'react';

export default function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-center justify-between border backdrop-blur-md animate-fade-in ${
            toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
            toast.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' :
            toast.type === 'info' ? 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300' :
            'bg-amber-950/80 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-current pulse-slow" />
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
