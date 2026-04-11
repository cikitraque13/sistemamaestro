import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ size = 'default', linkTo = '/', className = '' }) => {
  const sizes = {
    small: { img: 36 },
    default: { img: 44 },
    large: { img: 56 },
    xlarge: { img: 72 }
  };

  const { img } = sizes[size] || sizes.default;

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
