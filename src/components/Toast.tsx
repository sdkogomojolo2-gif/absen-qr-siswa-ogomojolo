import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-16 md:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyles = {
    success: 'bg-slate-900 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10',
    warning: 'bg-slate-900 border-amber-500/50 text-amber-300 shadow-amber-500/10',
    error: 'bg-slate-900 border-rose-500/50 text-rose-300 shadow-rose-500/10',
    info: 'bg-slate-900 border-indigo-500/50 text-indigo-300 shadow-indigo-500/10',
  }[toast.type];

  const icon = {
    success: 'fa-circle-check text-emerald-400',
    warning: 'fa-triangle-exclamation text-amber-400',
    error: 'fa-circle-xmark text-rose-400',
    info: 'fa-circle-info text-indigo-400',
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all transform translate-y-0 animate-bounce-once ${bgStyles}`}
    >
      <i className={`fa-solid ${icon} text-lg mt-0.5`} />
      <div className="flex-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white">{toast.title}</h4>
        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
      >
        <i className="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
  );
};
