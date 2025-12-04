import React from 'react';

const ColorSquare = ({ color1, color2, size = 16 }) => {
  if (!color2) {
    return (
      <span
        className="color-square"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color1
        }}
      />
    );
  }

  return (
    <span
      className="color-square dual"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(to top right, ${color1} 0%, ${color1} 50%, ${color2} 50%, ${color2} 100%)`
      }}
    />
  );
};

export default ColorSquare;
