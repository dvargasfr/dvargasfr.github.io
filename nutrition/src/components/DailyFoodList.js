import React from 'react';
import './DailyFoodList.css';

function DailyFoodList({ dailyMeals }) {
  // Define meal types and their emojis
  const mealTypes = {
    Desayuno: '☕', 
    Comida: '🍽️',
    Merienda: '🥪',
    Cena: '🌙',
  };

  // Group meals by meal type
  const groupedMeals = dailyMeals.reduce((acc, meal) => {
    if (!acc[meal.mealType]) {
      acc[meal.mealType] = [];
    }
    acc[meal.mealType].push(meal.foodName);
    return acc;
  }, {});

  return (
    <div id="daily-food-list-section">
      <h3>Comidas del Día</h3>
      <ul id="daily-food-list">
        {Object.keys(mealTypes).map((mealType) => (
          <li key={mealType} className="meal-type-group">
            <span className="meal-type">
              {mealType} {mealTypes[mealType]} {/* Emoji after meal type */}
            </span>
            <ul className="food-list">
              {(groupedMeals[mealType] || []).map((foodName, index) => (
                <li key={index} className="food-item">
                  <span className="food-name">{foodName}</span>
                </li>
              ))}
              {/* Display "-" if no food items */}
              {!(groupedMeals[mealType] || []).length && (
                <li className="food-item">
                  <span className="food-name">-</span>
                </li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DailyFoodList;
