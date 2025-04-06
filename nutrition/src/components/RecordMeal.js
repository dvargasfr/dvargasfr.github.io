import React from 'react';
import SelectedFoodList from './SelectedFoodList';
import FoodList from './FoodList';

function RecordMeal({
  mealType,
  onMealTypeChange,
  selectedMealFoods,
  onRemoveFoodFromMeal,
  onRecordMeal,
  isRecordingMeal,
  foods,
  filterText,
  onFilterFoods,
  onAddFoodToMeal,
}) {
  return (
    <>
      <h2>Registrar Comida</h2>
      <select id="meal-type" value={mealType} onChange={(e) => onMealTypeChange(e.target.value)}>
        <option value="">Selecciona tipo de comida</option>
        <option value="Desayuno">Desayuno</option>
        <option value="Comida">Comida</option>
        <option value="Merienda">Merienda</option>
        <option value="Cena">Cena</option>
        
      </select>
      <FoodList
        foods={foods}
        filterText={filterText}
        onFilterFoods={onFilterFoods}
        onAddFoodToMeal={onAddFoodToMeal}
      />
      <SelectedFoodList selectedMealFoods={selectedMealFoods} onRemoveFoodFromMeal={onRemoveFoodFromMeal} />
      <button id="record-meal-button" onClick={onRecordMeal} disabled={isRecordingMeal}>
        {isRecordingMeal ? 'Registrando...' : 'Registrar Comida'}
      </button>
    </>
  );
}

export default RecordMeal;
