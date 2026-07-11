import logoSvg from '../../assets/logo.svg';

const sizes = {
  xs: 'w-8 h-8 rounded-md',
  sm: 'w-9 h-9 rounded-lg',
  md: 'w-12 h-12 rounded-md',
};

const AppLogo = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center overflow-hidden ${sizes[size]} ${className}`}>
    <img src={logoSvg} alt="Domate" className="w-full h-full object-cover" />
  </div>
);

export default AppLogo;
