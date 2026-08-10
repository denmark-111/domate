const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-1 select-none">
            Domate
          </h1>
          {subtitle && (
            <p className="font-body-sm text-sm text-secondary">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form / Content */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCard;
