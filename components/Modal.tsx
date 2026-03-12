'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, children, title, maxWidth = 'max-w-2xl' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 overflow-hidden">
      <div className={`rounded-lg shadow-2xl w-full ${maxWidth} border-2 shadow-black/50 animate-fade-in-up flex flex-col max-h-[90vh]`} style={{
        background: 'linear-gradient(135deg, rgba(30, 24, 70, 0.98), rgba(12, 8, 26, 0.95))',
        borderColor: 'rgba(255, 120, 72, 0.3)'
      }}>
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 120, 72, 0.2)' }}>
          <h2 className="text-2xl font-bold font-cinzel" style={{ color: 'rgb(255, 120, 72)' }}>{title}</h2>
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
