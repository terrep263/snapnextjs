/**
 * Toggle Component
 * Reusable toggle switch
 */

import React from 'react';

export interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <label className="flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={`
              w-5 h-5 rounded
              accent-purple-600
              cursor-pointer
              ${className}
            `}
            {...props}
          />
        </label>
        {label && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-900">
              {label}
            </label>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
