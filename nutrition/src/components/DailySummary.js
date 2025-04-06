import React from 'react';
import './DailySummary.css';
import DailyFoodList from './DailyFoodList';

function DailySummary({ dailyNutrition, dailyMeals, selectedDate, onDateChange, getCurrentDateDDMMYYYY }) {
  return (
    <>
      <div className="daily-summary-header">
        <h2>Resumen Diario {getCurrentDateDDMMYYYY(selectedDate)}</h2>
        <input
          type="date"
          className="date-picker"
          value={selectedDate.toISOString().split('T')[0]} // Format date for input
          onChange={(e) => onDateChange(new Date(e.target.value))}
        />
      </div>
      <div className="daily-summary-grid">
        <div className="grid-row">
          <div className="grid-cell">Calorías</div>
          <div className="grid-cell">Grasas</div>
          <div className="grid-cell">Carbohidratos</div>
          <div className="grid-cell">Azúcares</div>
          <div className="grid-cell">Proteínas</div>
        </div>
        <div className="grid-row">
          <div className="grid-cell">{dailyNutrition.kilocalorias}</div>
          <div className="grid-cell">{dailyNutrition.grasas}</div>
          <div className="grid-cell">{dailyNutrition.carbohidratos}</div>
          <div className="grid-cell">{dailyNutrition.azucares}</div>
          <div className="grid-cell">{dailyNutrition.proteinas}</div>
        </div>
      </div>
      <DailyFoodList dailyMeals={dailyMeals} />
    </>
  );
}

export default DailySummary;
