/**
 * Textarea Component
 * Reusable textarea with consistent styling
 */

import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  characterCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      characterCount,
      maxLength,
      className,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(
      typeof value === 'string' ? value.length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          onChange={handleChange}
          value={value}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            transition-colors resize-vertical
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        <div className="flex justify-between items-start mt-1">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {helperText && !error && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
          {characterCount && maxLength && (
            <p className="text-xs text-gray-500">
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
