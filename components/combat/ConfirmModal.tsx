import React from 'react';
import Modal from '@/components/Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-4 text-center">
                <p className="mb-6 text-rpg-parchment font-medieval">{message}</p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onConfirm}
                        className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold font-cinzel text-white transition-all shadow-glow-green/20"
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold font-cinzel text-rpg-grey transition-all"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
