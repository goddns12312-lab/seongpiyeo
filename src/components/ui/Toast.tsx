'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

let toastId = 0;
const listeners: Set<(messages: ToastMessage[]) => void> = new Set();
let messages: ToastMessage[] = [];

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = `toast-${toastId++}`;
  const toast: ToastMessage = { id, type, message };

  messages = [...messages, toast];
  listeners.forEach((listener) => listener(messages));

  setTimeout(() => {
    messages = messages.filter((m) => m.id !== id);
    listeners.forEach((listener) => listener(messages));
  }, duration);

  return id;
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg font-medium text-sm animate-slide-in ${
            toast.type === 'success'
              ? 'bg-green-500/20 border border-green-500 text-green-400'
              : toast.type === 'error'
              ? 'bg-red-500/20 border border-red-500 text-red-400'
              : 'bg-blue-500/20 border border-blue-500 text-blue-400'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
