import React from 'react';
import Button from './Button';
import Card from './Card';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-white">
        <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={onClose} variant="secondary" className="w-full !bg-gray-200 !text-gray-800 hover:!bg-gray-300 !border-gray-300">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} variant="primary" className="w-full !bg-purple-600 !text-white hover:!bg-purple-700 !border-transparent">
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;