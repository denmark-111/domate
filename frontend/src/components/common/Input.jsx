import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  rightIcon: RightIcon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono-label text-xs uppercase font-bold tracking-wider text-on-surface"
        >
          {label}
        </label>
      )}

      <div className="relative w-full flex items-center">
        {Icon && (
          <div className="absolute left-3 text-secondary pointer-events-none flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`h-10 w-full bg-surface-container-lowest font-body-md text-sm text-on-surface border rounded-DEFAULT outline-none focus:outline-none transition-colors ${
            Icon ? 'pl-9' : 'px-3'
          } ${
            RightIcon ? 'pr-9' : 'pr-3'
          } ${
            error
              ? 'border-error text-error focus:border-error'
              : 'border-outline-variant focus:border-primary'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3 text-secondary flex items-center justify-center">
            <RightIcon size={16} />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-error text-xs font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-secondary text-xs">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
