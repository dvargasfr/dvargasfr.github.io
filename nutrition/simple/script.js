// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const WEB_APP_URL = '\
https://script.google.com/macros/s/AKfycbxAjOwHDhgQjfoRrkT_9krqCLBo8mlHer4YnrtmDZN6Jgxe7wWC3NQP5BK7CyxMv8gQDQ/exec';  
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

    const menuButton = document.getElementById('menu-button');
    const menu = document.getElementById('menu');
    const dailySummarySection = document.getElementById('daily-summary');
    const addFoodSection = document.getElementById('add-food');
    const recordMealSection = document.getElementById('record-meal');

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
        foodListContainer.innerHTML = '';

        if (!foodsToRender || foodsToRender.length === 0) {
            foodListContainer.innerHTML = '<p>No se encontraron alimentos o la lista está vacía.</p>';
            return;
        }

        foodsToRender.forEach(food => {
            const foodElement = document.createElement('div');
            foodElement.innerHTML = `
                <span>${food.Nombre}</span>
                <span>${food.Kilocalorias}</span> 
                <span>${food.Grasas}</span>
                <span>${food.Carbohidratos}</span>
                <span>${food.Azucares}</span>
                <span>${food.Proteinas}</span>
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
        selectedFoodsContainer.innerHTML = '';
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
            const xhr = new XMLHttpRequest();
            const requestPromise = new Promise((resolve, reject) => {
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            // Intentar parsear como JSON primero
                            try {
                                const result = JSON.parse(xhr.responseText);
                                resolve(result);
                            } catch (e) {
                                // Si no es JSON, devolver el texto
                                resolve({
                                    success: true,
                                    message: "Operación completada",
                                    responseText: xhr.responseText
                                });
                            }
                        } else {
                            reject(new Error(`Error HTTP: ${xhr.status}`));
                        }
                    }
                };
                
                xhr.onerror = function() {
                    reject(new Error("Error de red"));
                };
            });
            
            // Abrir y enviar la solicitud
            xhr.open('POST', `${WEB_APP_URL}?action=addFood`, true);
            xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
            xhr.send(JSON.stringify(foodData));
            
            const result = await requestPromise;
            
            console.log("Respuesta del servidor:", result);
            
            if (result.success) {
                showMessage('Alimento añadido correctamente.');
                addFoodForm.reset(); 
                await fetchAndDisplayFoods(); 
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
            const foodDetails = allFoods.find(f => f.Nombre === foodName);
            console.log(`foodDetails: ${foodDetails.Nombre} ${foodDetails.Kilocalorias} ${foodDetails.Grasas} ${foodDetails.Carbohidratos} ${foodDetails.Azucares} ${foodDetails.Proteinas}`);
            const mealData = {
                date: currentDate,
                mealType: mealType,
                foodName: foodName,
                foodDetails: foodDetails,
                // Podríamos buscar el objeto completo en allFoods si el backend necesita más datos
                // const foodDetails = allFoods.find(f => f.name === foodName);
                // ... pasar foodDetails completo o sus nutrientes
            };

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            // Intentar parsear como JSON primero
                            try {
                                const result = JSON.parse(xhr.responseText);
                                console.log(`Registro de ${foodName} exitoso.`);
                                resolve({ success: true, foodName: foodName });
                            } catch (e) {
                                // Si no es JSON, considerar el texto como éxito
                                console.log(`Registro de ${foodName} exitoso.`);
                                resolve({ 
                                    success: true, 
                                    foodName: foodName,
                                    responseText: xhr.responseText 
                                });
                            }
                        } else {
                            let errorMessage = xhr.statusText;
                            try {
                                // Intentar extraer mensaje de error del cuerpo
                                errorMessage = xhr.responseText || xhr.statusText;
                            } catch (e) {
                                // Si falla, usar el mensaje por defecto
                            }
                            console.error(`Error al registrar ${foodName}:`, errorMessage);
                            reject(new Error(`Error registrando ${foodName}: ${errorMessage}`));
                        }
                    }
                };
                xhr.onerror = function() {
                    console.error(`Error de red al registrar ${foodName}`);
                    reject(new Error(`Error de red al registrar ${foodName}`));
                };
                console.log('Haciendo petición XMLHttpRequest para:', mealData);
            
                // Abrir y enviar la solicitud
                xhr.open('POST', `${WEB_APP_URL}?action=recordMeal`, true);
                xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
                xhr.send(JSON.stringify(mealData));
            }).catch(error => {
                // Capturar cualquier error en la promesa y devolver un objeto de error uniforme
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

            console.log(data);
            //const totals = data.totals || {};
            totalCaloriesEl.textContent = data.kilocalorias ?? '0';
            totalFatsEl.textContent = data.grasas ?? '0';
            totalCarbsEl.textContent = data.carbohidratos ?? '0';
            totalSugarsEl.textContent = data.azucares ?? '0';
            totalProteinEl.textContent = data.proteinas ?? '0';

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

    /**
     * Muestra una sección y oculta las demás.
     * @param {string} sectionId - El ID de la sección a mostrar.
     */
    const showSection = (sectionId) => {
        dailySummarySection.style.display = 'none';
        addFoodSection.style.display = 'none';
        recordMealSection.style.display = 'none';

        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) {
            sectionToShow.style.display = 'block';
        }
    };

    /**
     * Abre o cierra el menú.
     */
    const toggleMenu = () => {
        menu.classList.toggle('open');
    };

    // --- EVENT LISTENERS ---
    filterInput.addEventListener('input', handleFilterFoods);
    addFoodForm.addEventListener('submit', handleAddFood);
    recordMealButton.addEventListener('click', handleRecordMeal);

    // Event Delegation para botones "Añadir" en la lista de alimentos
    foodListContainer.addEventListener('click', handleAddFoodToMeal);

     // Event Delegation para botones "Quitar" en la lista de seleccionados
    selectedFoodsContainer.addEventListener('click', handleRemoveFoodFromMeal);

    // --- EVENT LISTENERS PARA EL MENÚ ---
    menuButton.addEventListener('click', toggleMenu);
    document.getElementById('menu-daily-summary').addEventListener('click', () => {
        showSection('daily-summary');
        toggleMenu();
    });
    document.getElementById('menu-add-food').addEventListener('click', () => {
        showSection('add-food');
        toggleMenu();
    });
    document.getElementById('menu-record-meal').addEventListener('click', () => {
        showSection('record-meal');
        toggleMenu();
    });

    // --- INICIALIZACIÓN ---
    const initializeApp = () => {
        fetchAndDisplayFoods();
        updateDailyNutrition();
        renderSelectedFoods();
        showSection('daily-summary');
    };

    initializeApp();

}); // Fin de DOMContentLoaded