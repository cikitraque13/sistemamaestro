import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ size = 'default', linkTo = '/', className = '' }) => {
  const sizes = {
    small: { img: 28, text: 'text-lg' },
    default: { img: 36, text: 'text-xl' },
    large: { img: 48, text: 'text-2xl' }
  };

  const { img, text } = sizes[size] || sizes.default;

  return (
    <Link 
      to={linkTo} 
      className={`flex items-center gap-2 ${className}`}
      data-testid="logo"
    >
      <img 
        src="/logo.png" 
        alt="Sistema Maestro" 
        style={{ height: img, width: 'auto' }}
        className="object-contain"
      />
    </Link>
  );
};

export default Logo;
