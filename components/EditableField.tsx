'use client';

import { useState, useEffect } from 'react';

interface EditableFieldProps {
  initialValue: string | number;
  onSave: (value: string | number) => void;
  label?: string;
  isTextarea?: boolean;
  className?: string; // Classe para o container (div)
  valueClassName?: string; // Classe para o texto (span) quando não está editando
  editClassName?: string; // Classe para o input/textarea quando editando
}

export const EditableField = ({ initialValue, onSave, label, isTextarea = false, className = '', valueClassName = '', editClassName = '' }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    // Salva apenas se o valor mudou
    let newValue = value;
    if (typeof initialValue === 'number') {
      // Se campo vazio, considera zero
      newValue = value === '' ? 0 : Number(value);
    }
    if (newValue !== initialValue) {
      onSave(newValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTextarea) {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue); // Reverte para o valor original
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      value: typeof initialValue === 'number' && (value === 0 || value === '') ? '' : value,
      onChange: (e: any) => setValue(typeof initialValue === 'number' ? (e.target.value === '' ? '' : e.target.value) : e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      autoFocus: true,
      className: `bg-rpg-slate text-rpg-parchment p-1 rounded-md shadow-inner w-full focus:outline-none focus:ring-2 focus:ring-rpg-gold/80 border border-rpg-gold/20 font-medieval ${editClassName}`
    };
    return isTextarea ? <textarea {...commonProps} rows={3} /> : <input {...commonProps} type={typeof initialValue === 'number' ? 'number' : 'text'} />;
  }

  return (
    <div onClick={() => setIsEditing(true)} className={`cursor-pointer hover:bg-rpg-gold/10 p-1 rounded-md transition-colors duration-200 ${className}`}>
      {label && <strong className="font-cinzel text-rpg-gold text-xs uppercase tracking-wider">{label}: </strong>}
      <span className={(!value || value === 0) ? 'text-rpg-grey italic font-medieval' : (valueClassName || 'text-rpg-parchment font-medieval')}>
        {(!value || value === 0) ? (label ? '-' : 'Clique para editar') : value}
      </span>
    </div>
  );
};
