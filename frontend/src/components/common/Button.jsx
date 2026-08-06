const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'font-label-caps text-xs font-bold tracking-wider uppercase rounded-DEFAULT transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-on-primary hover:opacity-90',
    secondary: 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:border-primary',
    subtle: 'bg-surface-container-low text-on-surface hover:bg-surface-container-high',
    ghost: 'bg-transparent text-secondary hover:text-on-surface hover:bg-surface-container-low',
    danger: 'bg-error text-on-error hover:opacity-90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-6 py-2.5 text-xs',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
