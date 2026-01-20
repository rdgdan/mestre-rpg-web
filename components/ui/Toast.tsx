import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const bgColor = {
    success: 'bg-green-900/90 border-green-500/50',
    error: 'bg-red-900/90 border-red-500/50',
    info: 'bg-blue-900/90 border-blue-500/50',
    warning: 'bg-amber-900/90 border-amber-500/50',
  }[toast.type];

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  }[toast.type];

  return (
    <div
      className={`fixed bottom-6 right-6 max-w-sm px-6 py-4 rounded-lg border ${bgColor} text-white shadow-xl animate-fade-in backdrop-blur-sm z-50`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <p className="text-sm leading-relaxed flex-1">{toast.message}</p>
      </div>
    </div>
  );
};

export default Toast;
