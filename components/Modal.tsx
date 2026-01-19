'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 overflow-hidden">
      <div className="bg-rpg-panel rounded-lg shadow-2xl w-full max-w-2xl border-2 border-rpg-gold/30 shadow-black/50 animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-rpg-gold/20 flex-shrink-0">
          <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">{title}</h2>
          <button
            onClick={onClose}
            className="text-rpg-grey hover:text-rpg-red transition-colors"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
