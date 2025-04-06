import React from 'react';

function SelectedFoodList({ selectedMealFoods, onRemoveFoodFromMeal }) {
  return (
    <div id="selected-foods">
      {selectedMealFoods.length === 0 ? (
        <p>Ningún alimento seleccionado aún.</p>
      ) : (
        selectedMealFoods.map((foodName, index) => (
          <div key={index}>
            <span>{foodName}</span>
            <button
              className="remove-from-meal-btn"
              onClick={() => onRemoveFoodFromMeal(index)}
            >
              Quitar
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default SelectedFoodList;
