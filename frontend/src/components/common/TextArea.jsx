import { forwardRef } from 'react';

const TextArea = forwardRef(({
  label,
  error,
  helperText,
  rows = 3,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="font-mono-label text-xs uppercase font-bold tracking-wider text-on-surface"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full p-3 bg-surface-container-lowest font-body-md text-sm text-on-surface border rounded-DEFAULT outline-none focus:outline-none transition-colors resize-none ${
          error
            ? 'border-error text-error focus:border-error'
            : 'border-outline-variant focus:border-primary'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-error text-xs font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-secondary text-xs">{helperText}</p>
      ) : null}
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
