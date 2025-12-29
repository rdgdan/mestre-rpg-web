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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl border border-accent/20 animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-text/10">
          <h2 className="text-2xl font-bold font-serif text-accent">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-text/70 hover:text-accent transition-colors"
            aria-label="Fechar modal"
            >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
