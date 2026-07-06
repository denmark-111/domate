const sizes = {
  sm: 'w-9 h-9 rounded-xl text-sm',
  md: 'w-12 h-12 rounded-lg text-base',
};

const AppLogo = ({ size = 'md', className = '' }) => (
  <div className={`inline-flex items-center justify-center bg-button text-white font-bold ${sizes[size]} ${className}`}>
    B
  </div>
);

export default AppLogo;
