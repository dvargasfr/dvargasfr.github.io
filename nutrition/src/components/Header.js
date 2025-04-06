import React, { useState } from 'react';
import Menu from './Menu';

function Header({ onSectionChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header>
      <button id="menu-button" onClick={toggleMenu}>
        Menu
      </button>
      <Menu isOpen={isMenuOpen} onClose={toggleMenu} onSectionChange={onSectionChange} />
    </header>
  );
}

export default Header;
