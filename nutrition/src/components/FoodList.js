import React from 'react';
import './FoodList.css'; // Import the CSS file

function FoodList({ foods, filterText, onFilterFoods, onAddFoodToMeal }) {
  return (
    <div id="food-list-section">
      <input
        type="text"
        id="filter-food"
        placeholder="Filtrar alimentos"
        value={filterText}
        onChange={(e) => onFilterFoods(e.target.value)}
      />
      <div id="food-list">
        {foods.length === 0 ? (
          <p>No se encontraron alimentos o la lista está vacía.</p>
        ) : (
          foods.map((food) => (
            <div key={food.Nombre} className="food-item">
              <div className="food-name">{food.Nombre}</div>
              <div className="food-grid">
                <div className="grid-cell">{food.Kilocalorias}</div>
                <div className="grid-cell">{food.Grasas}</div>
                <div className="grid-cell">{food.Carbohidratos}</div>
                <div className="grid-cell">{food.Azucares}</div>
                <div className="grid-cell">{food.Proteinas}</div>
              </div>
              <button
                className="add-to-meal-btn"
                onClick={() => onAddFoodToMeal(food)}
              >
                Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FoodList;
