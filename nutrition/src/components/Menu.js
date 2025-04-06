import React from 'react';

function Menu({ isOpen, onClose, onSectionChange }) {
  return (
    <nav id="menu" className={isOpen ? 'open' : ''}>
      <ul>
        <li id="menu-daily-summary" onClick={() => { onSectionChange('daily-summary'); onClose(); }}>
          Resumen Diario
        </li>
        <li id="menu-add-food" onClick={() => { onSectionChange('add-food'); onClose(); }}>
          Añadir Alimento
        </li>
        <li id="menu-record-meal" onClick={() => { onSectionChange('record-meal'); onClose(); }}>
          Registrar Comida
        </li>
      </ul>
    </nav>
  );
}

export default Menu;
