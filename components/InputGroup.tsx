import React from 'react';

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  multiline = false 
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};