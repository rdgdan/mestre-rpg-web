import React, { useState } from 'react';
import Modal from '@/components/Modal';

interface ExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentExperience: number;
    onAddXP: (amount: number) => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
    isOpen,
    onClose,
    currentExperience,
    onAddXP
}) => {
    const [xpAmountToAdd, setXpAmountToAdd] = useState<string>('100');

    const handleConfirm = () => {
        const amount = parseInt(xpAmountToAdd);
        if (!isNaN(amount)) {
            onAddXP(amount);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar Experiência"
        >
            <div className="p-2 space-y-6">
                <div className="text-center">
                    <p className="text-rpg-grey text-xs uppercase font-cinzel tracking-widest mb-4">
                        Insira a quantidade adquirida
                    </p>
                    <div className="relative group">
                        <input
                            type="number"
                            inputMode="numeric"
                            value={xpAmountToAdd}
                            onChange={(e) => setXpAmountToAdd(e.target.value)}
                            className="w-full bg-black/40 border-2 border-rpg-gold/20 rounded-xl px-4 py-6 text-4xl font-medieval text-rpg-gold text-center focus:border-rpg-gold outline-none transition-all shadow-inner"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirm();
                            }}
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rpg-gold text-rpg-dark text-[10px] font-black px-3 py-0.5 rounded shadow-lg uppercase tracking-wider">
                            XP
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 px-4 bg-rpg-red/10 border border-rpg-red/20 text-rpg-red rounded-xl font-cinzel text-xs font-bold hover:bg-rpg-red/20 transition-all uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-4 px-4 bg-rpg-gold hover:bg-yellow-400 text-rpg-dark rounded-xl font-cinzel text-xs font-bold transition-all shadow-lg hover:shadow-rpg-gold/40 active:scale-95 uppercase tracking-widest"
                    >
                        Adicionar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ExperienceModal;
