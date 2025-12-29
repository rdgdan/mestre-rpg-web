// Componente Modal reutilizável
import { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export default function BibliotecaModal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/20 p-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold font-cinzel text-rpg-gold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-rpg-grey hover:text-rpg-gold transition-colors text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
