'use client';

import { useState, useEffect } from 'react';

interface EditableFieldProps {
  initialValue: string | number;
  onSave: (value: string | number) => void;
  label?: string;
  isTextarea?: boolean;
  className?: string;
}

export const EditableField = ({ initialValue, onSave, label, isTextarea = false, className = '' }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    // Salva apenas se o valor mudou
    if (value !== initialValue) {
        // Converte para número se o valor inicial era um número
        const newValue = typeof initialValue === 'number' ? Number(value) : value;
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
        value: value,
        onChange: (e: any) => setValue(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        autoFocus: true,
        className: "bg-background-end/90 text-text p-1 rounded-md shadow-inner w-full focus:outline-none focus:ring-2 focus:ring-accent/80"
    };
    return isTextarea ? <textarea {...commonProps} rows={3} /> : <input {...commonProps} type={typeof initialValue === 'number' ? 'number' : 'text'} />;
  }

  return (
    <div onClick={() => setIsEditing(true)} className={`cursor-pointer hover:bg-surface/50 p-1 rounded-md transition-colors duration-200 ${className}`}>
      {label && <strong className="font-serif text-accent text-xs uppercase tracking-wider">{label}: </strong>}
      <span className={!value ? 'text-text/50 italic' : ''}>{value || (label ? '-' : 'Clique para editar')}</span>
    </div>
  );
};
