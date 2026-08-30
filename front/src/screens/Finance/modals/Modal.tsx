import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content / Mobile Bottom Sheet */}
      <div className="relative bg-white dark:bg-earth-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-250 border border-earth-200 dark:border-earth-800">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1 bg-earth-300 dark:bg-earth-700 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        <div className="flex items-center justify-between px-5 py-3.5 sm:p-5 border-b border-earth-100 dark:border-earth-800 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-earth-900 dark:text-earth-100">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-earth-400 hover:text-earth-700 dark:hover:text-earth-200 hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain pb-6 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
