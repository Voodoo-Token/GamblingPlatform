import React from 'react';

export const Button = ({ className, children, onClick }) => {
  return (
    <button
      className={`bg-blue-950 hover:bg-black text-white font-bold py-2 px-4 rounded ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
