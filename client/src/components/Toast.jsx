import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} color="#10b981" />,
  error:   <XCircle    size={16} color="#f43f5e" />,
  warning: <AlertTriangle size={16} color="#f59e0b" />,
  info:    <Info       size={16} color="#0ea5e9" />,
};

export default function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type || 'success'} animate-fade-in`}
        >
          {icons[toast.type] || icons.info}
          <p style={{ fontFamily: 'var(--font-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  );
}
