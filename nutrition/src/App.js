import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DailySummary from './components/DailySummary';
import AddFoodForm from './components/AddFoodForm';
import RecordMeal from './components/RecordMeal';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';

const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwAPNM3d7osS25kwjDePPch6RUU7H-fD8ItDKSa31gIB0LrNs0w61VJvui5uybfwQTNXQ/exec';

function App() {
  const [allFoods, setAllFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [selectedMealFoods, setSelectedMealFoods] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [mealType, setMealType] = useState('');
  const [dailyNutrition, setDailyNutrition] = useState({
    kilocalorias: '...',
    grasas: '...',
    carbohidratos: '...',
    azucares: '...',
    proteinas: '...',
  });
  const [dailyMeals, setDailyMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isRecordingMeal, setIsRecordingMeal] = useState(false);
  const [activeSection, setActiveSection] = useState('daily-summary');
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // New state for selected date

  // --- HELPER FUNCTIONS ---

  const getCurrentDateYYYYMMDD = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const getCurrentDateDDMMYYYY = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const showMessage = (message, isError = false) => {
    console.log(isError ? `Error: ${message}` : `Success: ${message}`);
    alert(message);
  };

  // --- API FUNCTIONS ---

  const fetchAndDisplayFoods = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${WEB_APP_URL}?action=getFoods`);
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAllFoods(data.foods || []);
      setFilteredFoods(data.foods || []);
    } catch (error) {
      console.error('Error al obtener alimentos:', error);
      setErrorMessage(`Error al cargar alimentos: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = async (foodData) => {
    setIsAddingFood(true);
    setErrorMessage(null);

    if (!foodData.Nombre || isNaN(foodData.Kilocalorias) || foodData.Kilocalorias < 0) {
      showMessage('Por favor, introduce al menos un nombre y calorías válidas.', true);
      setIsAddingFood(false);
      return;
    }

    try {
      const response = await fetch(`${WEB_APP_URL}?action=addFood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(foodData),
      });

      const result = await response.json();

      if (result.success) {
        showMessage('Alimento añadido correctamente.');
        await fetchAndDisplayFoods();
      } else {
        throw new Error(result.error || 'Error desconocido al añadir alimento.');
      }
    } catch (error) {
      console.error('Error al añadir alimento:', error);
      setErrorMessage(`Error al añadir alimento: ${error.message}`);
    } finally {
      setIsAddingFood(false);
    }
  };

  const handleRecordMeal = async () => {
    setIsRecordingMeal(true);
    setErrorMessage(null);
    const currentDate = getCurrentDateYYYYMMDD();

    if (!mealType) {
      showMessage('Por favor, selecciona un tipo de comida.', true);
      setIsRecordingMeal(false);
      return;
    }
    if (selectedMealFoods.length === 0) {
      showMessage('Por favor, añade al menos un alimento a la comida.', true);
      setIsRecordingMeal(false);
      return;
    }

    const mealPromises = selectedMealFoods.map((foodName) => {
      const foodDetails = allFoods.find((f) => f.Nombre === foodName);
      const mealData = {
        date: currentDate,
        mealType: mealType,
        foodName: foodName,
        foodDetails: foodDetails,
      };

      return fetch(`${WEB_APP_URL}?action=recordMeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(mealData),
      })
        .then((response) => {
          if (response.ok) {
            return response.json().then((result) => {
              console.log(`Registro de ${foodName} exitoso.`);
              return { success: true, foodName: foodName };
            }).catch(() => {
              console.log(`Registro de ${foodName} exitoso.`);
              return { success: true, foodName: foodName };
            });
          } else {
            let errorMessage = response.statusText;
            try {
              errorMessage = response.text() || response.statusText;
            } catch (e) {
              // If fails, use default message
            }
            console.error(`Error al registrar ${foodName}:`, errorMessage);
            throw new Error(`Error registrando ${foodName}: ${errorMessage}`);
          }
        })
        .catch((error) => {
          console.error(`Error de red al registrar ${foodName}`);
          return { success: false, foodName: foodName, error: error.message };
        });
    });

    try {
      const results = await Promise.all(mealPromises);
      const failedRecords = results.filter((r) => !r.success);

      if (failedRecords.length > 0) {
        const failedNames = failedRecords.map((r) => r.foodName).join(', ');
        showMessage(
          `Comida registrada, pero hubo errores con: ${failedNames}. Revisa la consola para más detalles.`,
          true
        );
      } else {
        showMessage('Comida registrada correctamente.');
      }

      setSelectedMealFoods([]);
      setMealType('');
      await updateDailyNutrition();
      await updateDailyMeals(); // Update daily meals after recording
    } catch (error) {
      console.error('Error general al registrar la comida:', error);
      setErrorMessage('Ocurrió un error inesperado al registrar la comida.');
    } finally {
      setIsRecordingMeal(false);
    }
  };

  const updateDailyNutrition = async (date = selectedDate) => { // Use selectedDate as default
    const currentDate = getCurrentDateYYYYMMDD(date);
    setDailyNutrition({
      kilocalorias: '...',
      grasas: '...',
      carbohidratos: '...',
      azucares: '...',
      proteinas: '...',
    });
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${WEB_APP_URL}?action=getDailyNutrition&date=${currentDate}`
      );
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setDailyNutrition({
        kilocalorias: data.kilocalorias ?? '0',
        grasas: data.grasas ?? '0',
        carbohidratos: data.carbohidratos ?? '0',
        azucares: data.azucares ?? '0',
        proteinas: data.proteinas ?? '0',
      });
    } catch (error) {
      console.error('Error al obtener el resumen diario:', error);
      setErrorMessage(`Error al obtener resumen diario: ${error.message}`);
      setDailyNutrition({
        kilocalorias: '0',
        grasas: '0',
        carbohidratos: '0',
        azucares: '0',
        proteinas: '0',
      });
    }
  };

  const updateDailyMeals = async (date = selectedDate) => { // Use selectedDate as default
    setIsLoading(true);
    setErrorMessage(null);
    const currentDate = getCurrentDateYYYYMMDD(date);
    try {
      const response = await fetch(`${WEB_APP_URL}?action=getDailyMeals&date=${currentDate}`);
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setDailyMeals(data.meals || []);
    } catch (error) {
      console.error('Error al obtener las comidas del día:', error);
      setErrorMessage(`Error al obtener las comidas del día: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EVENT HANDLERS ---

  const handleFilterFoods = (text) => {
    setFilterText(text);
    if (!text) {
      setFilteredFoods(allFoods);
      return;
    }
    const filtered = allFoods.filter((food) =>
      food.Nombre.toLowerCase().includes(text)
    );
    setFilteredFoods(filtered);
  };

  const handleAddFoodToMeal = (food) => {
    if (!selectedMealFoods.includes(food.Nombre)) {
      setSelectedMealFoods([...selectedMealFoods, food.Nombre]);
    } else {
      showMessage('Este alimento ya está en la lista de la comida actual.', true);
    }
  };

  const handleRemoveFoodFromMeal = (index) => {
    const newSelectedFoods = [...selectedMealFoods];
    newSelectedFoods.splice(index, 1);
    setSelectedMealFoods(newSelectedFoods);
  };

  const handleMealTypeChange = (value) => {
    setMealType(value);
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleDateChange = async (date) => { // New handler for date change
    setSelectedDate(date);
    await updateDailyNutrition(date);
    await updateDailyMeals(date);
  };

  // --- EFFECTS ---

  useEffect(() => {
    fetchAndDisplayFoods();
    updateDailyNutrition();
    updateDailyMeals();
  }, []);

  // --- RENDER ---

  return (
    <div className="nutrition-app">
      <Header onSectionChange={handleSectionChange} />
      <main>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {isLoading && <Loading />}
        {/* Daily Summary Section */}
        <section id="daily-summary" style={{ display: activeSection === 'daily-summary' ? 'block' : 'none' }}>
          <DailySummary
            dailyNutrition={dailyNutrition}
            dailyMeals={dailyMeals}
            selectedDate={selectedDate} // Pass selectedDate as a prop
            onDateChange={handleDateChange} // Pass handleDateChange as a prop
            getCurrentDateDDMMYYYY={getCurrentDateDDMMYYYY}
          />
        </section>

        {/* Add Food Section */}
        <section id="add-food" style={{ display: activeSection === 'add-food' ? 'block' : 'none' }}>
          <AddFoodForm onAddFood={handleAddFood} isAddingFood={isAddingFood} />
        </section>

        {/* Record Meal Section */}
        <section id="record-meal" style={{ display: activeSection === 'record-meal' ? 'block' : 'none' }}>
          <RecordMeal
            mealType={mealType}
            onMealTypeChange={handleMealTypeChange}
            selectedMealFoods={selectedMealFoods}
            onRemoveFoodFromMeal={handleRemoveFoodFromMeal}
            onRecordMeal={handleRecordMeal}
            isRecordingMeal={isRecordingMeal}
            foods={filteredFoods}
            filterText={filterText}
            onFilterFoods={handleFilterFoods}
            onAddFoodToMeal={handleAddFoodToMeal}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
