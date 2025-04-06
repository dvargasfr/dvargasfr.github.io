import React, { useRef } from 'react';
import './AddFoodForm.css'; // Import the CSS file

function AddFoodForm({ onAddFood, isAddingFood }) {
  const foodNameInputRef = useRef(null);
  const caloriesInputRef = useRef(null);
  const fatsInputRef = useRef(null);
  const carbsInputRef = useRef(null);
  const sugarsInputRef = useRef(null);
  const proteinInputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const foodData = {
      Nombre: foodNameInputRef.current.value.trim(),
      Kilocalorias: parseFloat(caloriesInputRef.current.value) || 0,
      Grasas: parseFloat(fatsInputRef.current.value) || 0,
      Carbohidratos: parseFloat(carbsInputRef.current.value) || 0,
      Azucares: parseFloat(sugarsInputRef.current.value) || 0,
      Proteinas: parseFloat(proteinInputRef.current.value) || 0,
    };
    onAddFood(foodData);
    event.target.reset();
  };

  return (
    <>
      <h2>Añadir Alimento</h2>
      <form id="add-food-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="food-name">Nombre</label>
          <input type="text" id="food-name" ref={foodNameInputRef} required />
        </div>
        <div className="form-row">
          <div className="nutrition-label">Calorías</div>
          <div className="nutrition-label">Grasas</div>
          <div className="nutrition-label">Carbos</div>
          <div className="nutrition-label">Azúcares</div>
          <div className="nutrition-label">Proteínas</div>
        </div>
        <div className="form-row">
          <input type="number" id="calories" ref={caloriesInputRef} required />
          <input type="number" id="fats" ref={fatsInputRef} />
          <input type="number" id="carbs" ref={carbsInputRef} />
          <input type="number" id="sugars" ref={sugarsInputRef} />
          <input type="number" id="protein" ref={proteinInputRef} />
        </div>
        <button type="submit" id="add-food-button" disabled={isAddingFood}>
          {isAddingFood ? 'Añadiendo...' : 'Añadir Alimento'}
        </button>
      </form>
    </>
  );
}

export default AddFoodForm;
