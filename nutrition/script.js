// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const WEB_APP_URL = '\
https://script.google.com/macros/s/AKfycbwKxBZ2l2Npfu6T9RoUTZRfJcIwJazUaTpYJgAw45hgMWaizeTL-eP2kCnSAxluP_GhWA/exec';    
// --- SELECTORES DEL DOM ---
    const foodListContainer = document.getElementById('food-list');
    const filterInput = document.getElementById('filter-food');
    const addFoodForm = document.getElementById('add-food-form');
    const foodNameInput = document.getElementById('food-name');
    const caloriesInput = document.getElementById('calories');
    const fatsInput = document.getElementById('fats');
    const carbsInput = document.getElementById('carbs');
    const sugarsInput = document.getElementById('sugars');
    const proteinInput = document.getElementById('protein');
    const addFoodButton = document.getElementById('add-food-button'); // Ya capturado por el form submit, pero puede ser útil
    const mealTypeSelect = document.getElementById('meal-type');
    const selectedFoodsContainer = document.getElementById('selected-foods');
    const recordMealButton = document.getElementById('record-meal-button');
    const totalCaloriesEl = document.getElementById('total-calories');
    const totalFatsEl = document.getElementById('total-fats');
    const totalCarbsEl = document.getElementById('total-carbs');
    const totalSugarsEl = document.getElementById('total-sugars');
    const totalProteinEl = document.getElementById('total-protein');

    // --- ESTADO DE LA APLICACIÓN ---
    let allFoods = []; // Almacenará la lista completa de alimentos [{name: 'Manzana', ...}, ...]
    let selectedMealFoods = []; // Almacenará los nombres de los alimentos para la comida actual ['Manzana', 'Plátano']

    // --- FUNCIONES ---

    /**
     * Obtiene la fecha actual en formato DD-MM-YYYY
     * @returns {string} Fecha formateada
     */
    const getCurrentDateYYYYMMDD = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
        const day = String(today.getDate()).padStart(2, '0');
        return `${day}-${month}-${year}`;
    };

    /**
     * Muestra un mensaje temporal al usuario (puede ser mejorado con un div específico)
     * @param {string} message - El mensaje a mostrar
     * @param {boolean} isError - Si es un mensaje de error (opcional)
     */
    const showMessage = (message, isError = false) => {
        // Implementación simple con alert. Puedes cambiar esto por un div de notificaciones.
        console.log(isError ? `Error: ${message}` : `Success: ${message}`);
        alert(message);
    };

    /**
     * Renderiza la lista de alimentos en el contenedor #food-list
     * @param {Array} foodsToRender - Array de objetos de alimentos a mostrar
     */
    const renderFoodList = (foodsToRender) => {
        foodListContainer.innerHTML = ''; // Limpiar lista actual

        if (!foodsToRender || foodsToRender.length === 0) {
            foodListContainer.innerHTML = '<p>No se encontraron alimentos o la lista está vacía.</p>';
            return;
        }

        foodsToRender.forEach(food => {
            // Solo necesitamos el nombre para esta vista según la descripción inicial,
            // pero guardamos todo el objeto por si acaso o para futuras mejoras.
            // Podríamos mostrar más detalles si quisiéramos.
            console.log(food);
            // print(food);
            const foodElement = document.createElement('div');
            foodElement.innerHTML = `
                <span>${food.Nombre}</span>
                <button class="add-to-meal-btn" data-food-name="${food.Nombre}">Add</button>
            `;
            // Guardamos el objeto completo por si lo necesitamos al añadir
            foodElement.querySelector('.add-to-meal-btn').dataset.foodObject = JSON.stringify(food);
            foodListContainer.appendChild(foodElement);
        });
    };

    /**
     * Renderiza la lista de alimentos seleccionados para la comida actual
     */
    const renderSelectedFoods = () => {
        selectedFoodsContainer.innerHTML = ''; // Limpiar
        if (selectedMealFoods.length === 0) {
            selectedFoodsContainer.innerHTML = '<p>Ningún alimento seleccionado aún.</p>';
            return;
        }

        selectedMealFoods.forEach((foodName, index) => {
            const selectedFoodElement = document.createElement('div');
            selectedFoodElement.innerHTML = `
                <span>${foodName}</span>
                <button class="remove-from-meal-btn" data-food-index="${index}">Quitar</button>
            `;
            selectedFoodsContainer.appendChild(selectedFoodElement);
        });
    };

    /**
     * 1. Obtiene y muestra la lista de alimentos del backend
     */
    const fetchAndDisplayFoods = async () => {
        foodListContainer.innerHTML = '<p>Cargando alimentos...</p>'; // Mensaje de carga
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getFoods`);
            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            allFoods = data.foods || []; // Asume que la respuesta es { foods: [...] }
            renderFoodList(allFoods);
        } catch (error) {
            console.error('Error al obtener alimentos:', error);
            showMessage(`Error al cargar alimentos: ${error.message}`, true);
            foodListContainer.innerHTML = '<p>Error al cargar alimentos.</p>';
        }
    };

    /**
     * 2. Filtra la lista de alimentos mostrada
     */
    const handleFilterFoods = () => {
        const filterText = filterInput.value.toLowerCase().trim();
        if (!filterText) {
            renderFoodList(allFoods); // Mostrar todos si no hay filtro
            return;
        }
        const filteredFoods = allFoods.filter(food =>
            food.Nombre.toLowerCase().includes(filterText)
        );
        renderFoodList(filteredFoods);
    };

    /**
     * 3. Añade un nuevo alimento a través del backend
     * @param {Event} event - El evento de submit del formulario
     */
    const handleAddFood = async (event) => {
        event.preventDefault(); // Prevenir recarga de página

        const foodData = {
            Nombre: foodNameInput.value.trim(),
            Kilocalorias: parseFloat(caloriesInput.value) || 0,
            Grasas: parseFloat(fatsInput.value) || 0,
            Carbohidratos: parseFloat(carbsInput.value) || 0,
            Azucares: parseFloat(sugarsInput.value) || 0,
            Proteinas: parseFloat(proteinInput.value) || 0,
        };

        // Validación simple (se podría añadir más)
        if (!foodData.Nombre || isNaN(foodData.Kilocalorias) || foodData.Kilocalorias < 0) {
            showMessage('Por favor, introduce al menos un nombre y calorías válidas.', true);
            return;
        }

        // Deshabilitar botón mientras se envía
        addFoodButton.disabled = true;
        addFoodButton.textContent = 'Añadiendo...';

        try {
            const response = await fetch(`${WEB_APP_URL}?action=addFood`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Apps Script a menudo necesita que el payload esté en una estructura específica,
                // A veces necesita redirigirse o ser texto plano. Ajusta según tu backend.
                // Aquí asumimos que acepta JSON directamente en el body.
                // Si usas doGet/doPost, Apps Script parseará esto automáticamente en e.postData.contents
                 body: JSON.stringify(foodData),
                // Alternativa si Apps Script espera texto plano:
                // body: JSON.stringify(foodData),
                // headers: {'Content-Type': 'text/plain;charset=utf-8'},
                // mode: 'no-cors' // Puede ser necesario si hay problemas CORS y no se maneja en Apps Script
            });

            // IMPORTANTE: Las respuestas de Apps Script Web Apps después de un POST
            // pueden ser redirecciones o texto plano. Ajusta cómo procesas la respuesta.
            // Aquí asumimos que devuelve JSON con { success: true } o { error: 'mensaje' }
            // Si devuelve texto, usa response.text()
            const result = await response.json(); // o response.text()

            if (result.success) {
                showMessage('Alimento añadido correctamente.');
                addFoodForm.reset(); // Limpiar formulario
                await fetchAndDisplayFoods(); // Recargar lista de alimentos
            } else {
                throw new Error(result.error || 'Error desconocido al añadir alimento.');
            }
        } catch (error) {
            console.error('Error al añadir alimento:', error);
            showMessage(`Error al añadir alimento: ${error.message}`, true);
        } finally {
            // Rehabilitar botón
             addFoodButton.disabled = false;
             addFoodButton.textContent = 'Añadir Alimento';
        }
    };


    /**
     * Añade un alimento de la lista disponible a la lista de comida actual
     * @param {Event} event - El evento de click
     */
    const handleAddFoodToMeal = (event) => {
        if (event.target.classList.contains('add-to-meal-btn')) {
            const foodName = event.target.dataset.foodName;
            if (foodName && !selectedMealFoods.includes(foodName)) {
                selectedMealFoods.push(foodName);
                renderSelectedFoods();
            } else if (selectedMealFoods.includes(foodName)) {
                 showMessage('Este alimento ya está en la lista de la comida actual.', true);
            }
        }
    };

     /**
     * Quita un alimento de la lista de comida actual
     * @param {Event} event - El evento de click
     */
    const handleRemoveFoodFromMeal = (event) => {
        if (event.target.classList.contains('remove-from-meal-btn')) {
            const indexToRemove = parseInt(event.target.dataset.foodIndex, 10);
            if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < selectedMealFoods.length) {
                selectedMealFoods.splice(indexToRemove, 1); // Elimina el elemento en el índice
                renderSelectedFoods();
            }
        }
    };

    /**
     * 4. Registra la comida actual (todos los alimentos seleccionados) en el backend
     */
    const handleRecordMeal = async () => {
        const mealType = mealTypeSelect.value;
        const currentDate = getCurrentDateYYYYMMDD();

        console.log(mealType, currentDate);

        if (!mealType) {
            showMessage('Por favor, selecciona un tipo de comida.', true);
            return;
        }
        if (selectedMealFoods.length === 0) {
            showMessage('Por favor, añade al menos un alimento a la comida.', true);
            return;
        }

        recordMealButton.disabled = true;
        recordMealButton.textContent = 'Registrando...';

        const mealPromises = selectedMealFoods.map(foodName => {
            const mealData = {
                date: currentDate,
                mealType: mealType,
                foodName: foodName,
                // Podríamos buscar el objeto completo en allFoods si el backend necesita más datos
                // const foodDetails = allFoods.find(f => f.name === foodName);
                // ... pasar foodDetails completo o sus nutrientes
            };

            // Retornamos la promesa de fetch para cada alimento

            console.log('Haciendo fetch para:', mealData);
            return fetch(`${WEB_APP_URL}?action=recordMeal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mealData),
                // Considera las mismas notas que en handleAddFood sobre el body y headers
            })
            .then(response => {
                console.log('Response:', response);
                 // Asumimos que cada petición individual devuelve JSON {success: true} o {error: ...}
                 // O podría devolver solo texto de éxito/error
                 // Aquí solo verificamos si la petición fue OK (status 2xx) para simplificar
                 if (!response.ok) {
                    // Podríamos intentar leer el error del cuerpo si está disponible
                    return response.text().then(text => { throw new Error(`Error registrando ${foodName}: ${text || response.statusText}`) });
                 }
                 return response.json(); // o response.text()
            })
            .then(result => {
                // Opcional: verificar result.success si el backend devuelve JSON detallado
                 console.log(`Registro de ${foodName} exitoso.`);
                 return { success: true, foodName: foodName }; // Para Promise.all
            })
            .catch(error => {
                console.error(`Error al registrar ${foodName}:`, error);
                // Retornamos un objeto de error para Promise.all
                return { success: false, foodName: foodName, error: error.message };
            });
        });

        try {
            // Esperar a que todas las peticiones terminen
            const results = await Promise.all(mealPromises);

            const failedRecords = results.filter(r => !r.success);

            if (failedRecords.length > 0) {
                const failedNames = failedRecords.map(r => r.foodName).join(', ');
                showMessage(`Comida registrada, pero hubo errores con: ${failedNames}. Revisa la consola para más detalles.`, true);
            } else {
                showMessage('Comida registrada correctamente.');
            }

            // Limpiar y actualizar independientemente de errores parciales
            selectedMealFoods = [];
            renderSelectedFoods();
            mealTypeSelect.value = ''; // Resetear select
            await updateDailyNutrition(); // Actualizar totales

        } catch (error) {
            // Error general si Promise.all falla (poco probable con el catch individual)
            console.error('Error general al registrar la comida:', error);
            showMessage('Ocurrió un error inesperado al registrar la comida.', true);
        } finally {
            recordMealButton.disabled = false;
            recordMealButton.textContent = 'Registrar Comida';
        }
    };

    /**
     * 5. Obtiene y muestra el resumen nutricional del día actual
     */
    const updateDailyNutrition = async () => {
        const currentDate = getCurrentDateYYYYMMDD();
        // Mostrar carga o resetear a 0 mientras se carga
        totalCaloriesEl.textContent = '...';
        totalFatsEl.textContent = '...';
        totalCarbsEl.textContent = '...';
        totalSugarsEl.textContent = '...';
        totalProteinEl.textContent = '...';

        try {
            const response = await fetch(`${WEB_APP_URL}?action=getDailyNutrition&date=${currentDate}`);
            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Asume que la respuesta es { totals: { calories: N, fats: N, ... } } o similar
            const totals = data.totals || {};
            totalCaloriesEl.textContent = totals.calories?.toFixed(1) ?? '0';
            totalFatsEl.textContent = totals.fats?.toFixed(1) ?? '0';
            totalCarbsEl.textContent = totals.carbs?.toFixed(1) ?? '0';
            totalSugarsEl.textContent = totals.sugars?.toFixed(1) ?? '0';
            totalProteinEl.textContent = totals.protein?.toFixed(1) ?? '0';

        } catch (error) {
            console.error('Error al obtener el resumen diario:', error);
            showMessage(`Error al obtener resumen diario: ${error.message}`, true);
            // Resetear a 0 en caso de error
             totalCaloriesEl.textContent = '0';
             totalFatsEl.textContent = '0';
             totalCarbsEl.textContent = '0';
             totalSugarsEl.textContent = '0';
             totalProteinEl.textContent = '0';
        }
    };

    // --- EVENT LISTENERS ---
    filterInput.addEventListener('input', handleFilterFoods);
    addFoodForm.addEventListener('submit', handleAddFood);
    recordMealButton.addEventListener('click', handleRecordMeal);

    // Event Delegation para botones "Añadir" en la lista de alimentos
    foodListContainer.addEventListener('click', handleAddFoodToMeal);

     // Event Delegation para botones "Quitar" en la lista de seleccionados
    selectedFoodsContainer.addEventListener('click', handleRemoveFoodFromMeal);


    // --- INICIALIZACIÓN ---
    const initializeApp = () => {
        fetchAndDisplayFoods();
        updateDailyNutrition();
        renderSelectedFoods(); // Para mostrar el placeholder inicial
    };

    initializeApp();

}); // Fin de DOMContentLoaded