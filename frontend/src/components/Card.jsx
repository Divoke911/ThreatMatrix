import React from 'react';

const Card = ({ children, className = '', hoverGlow = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-panel p-5
        ${hoverGlow ? 'glass-panel-hover' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
