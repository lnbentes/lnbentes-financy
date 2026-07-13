import { Modal } from './Modal';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={28} className="text-red-600 dark:text-red-400 animate-bounce" />;
      case 'warning':
        return <AlertTriangle size={28} className="text-amber-600 dark:text-amber-400" />;
      case 'info':
        return <Info size={28} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <HelpCircle size={28} className="text-earth-500" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30';
      default:
        return 'bg-earth-50 dark:bg-earth-800';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50';
      default:
        return 'bg-forest-600 hover:bg-forest-700 text-white disabled:opacity-50';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center py-2 space-y-5 animate-in fade-in duration-200">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${getIconBg()}`}>
          {getIcon()}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-earth-600 dark:text-earth-400 font-medium px-4">
            {message}
          </p>
        </div>

        <div className="flex gap-3 pt-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-earth-100 dark:bg-earth-800 hover:bg-earth-200 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-200 rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${getConfirmButtonClass()}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
