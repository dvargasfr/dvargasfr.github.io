const ALIMENTOS_SHEET_NAME = 'Alimentos';
const REGISTRO_SHEET_NAME = 'RegistroComidas';

function doGet(request) {
  const action = request.parameter.action;
  if (action === 'getFoods') {
    return getFoods();
  } else if (action === 'getDailyNutrition') {
    const date = request.parameter.date;
    return getDailyNutrition(date);
  } else {
    output = ContentService.createTextOutput(JSON.stringify({ error: 'Acción no válida en GET' }));
  }
  return output.setMimeType(ContentService.MimeType.JSON)
               .addHeader('Access-Control-Allow-Origin', '*') // Permite peticiones desde cualquier origen
               .addHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Métodos permitidos para GET
}


function doPost(request) {
  const action = request.parameter.action;
  const postData = JSON.parse(request.postData.contents);
  if (action === 'addFood') {
    return addFood(postData);
  } else if (action === 'recordMeal') {
    return recordMeal(postData);
  } else {
    output = ContentService.createTextOutput(JSON.stringify({ error: 'Acción no válida en POST' }));
  }
  return output.setMimeType(ContentService.MimeType.JSON)
               .addHeader('Access-Control-Allow-Origin', '*') // Permite peticiones desde cualquier origen
               .addHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Métodos permitidos para POST
}

function getFoods() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ALIMENTOS_SHEET_NAME);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const header = values[0];
  const foods = [];
  for (let i = 1; i < values.length; i++) {
    const food = {};
    for (let j = 0; j < header.length; j++) {
      food[header[j]] = values[i][j];
    }
    foods.push(food);
  }
  return ContentService.createTextOutput(JSON.stringify({ foods: foods })).setMimeType(ContentService.MimeType.JSON);
}

function addFood(foodData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ALIMENTOS_SHEET_NAME);
    sheet.appendRow([
      foodData.Nombre,
      foodData.Kilocalorías,
      foodData.Grasas,
      foodData.Carbohidratos,
      foodData.Azúcares,
      foodData.Proteínas,
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function recordMeal(mealData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(REGISTRO_SHEET_NAME);
    sheet.appendRow([
      mealData.date,
      mealData.mealType,
      mealData.foodName,
      mealData.quantity || '', // Si decides usar cantidad
      'UsuarioPersonal', // Usuario fijo para tu uso personal
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getDailyNutrition(date) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const registroSheet = ss.getSheetByName(REGISTRO_SHEET_NAME);
  const alimentosSheet = ss.getSheetByName(ALIMENTOS_SHEET_NAME);

  const registroData = registroSheet.getDataRange().getValues();
  const alimentosData = alimentosSheet.getDataRange().getValues();

  const headerAlimentos = alimentosData[0];
  const alimentosMap = new Map();
  for (let i = 1; i < alimentosData.length; i++) {
    const alimento = {};
    for (let j = 0; j < headerAlimentos.length; j++) {
      alimento[headerAlimentos[j]] = alimentosData[i][j];
    }
    alimentosMap.set(alimento.Nombre, alimento);
  }

  let totalKilocals = 0;
  let totalGrasas = 0;
  let totalCarbohidratos = 0;
  let totalAzucares = 0;
  let totalProteinas = 0;

  for (let i = 1; i < registroData.length; i++) {
    const rowDate = Utilities.formatDate(new Date(registroData[i][0]), Session.getTimeZone(), 'yyyy-MM-dd');
    if (rowDate === date && registroData[i][4] === 'UsuarioPersonal') { // Comprobar fecha y usuario
      const alimentoNombre = registroData[i][2];
      const cantidad = registroData[i][3] || 1; // Si usas cantidad, multiplícalo aquí

      if (alimentosMap.has(alimentoNombre)) {
        const alimento = alimentosMap.get(alimentoNombre);
        totalKilocals += Number(alimento.Kilocalorias) * cantidad;
        totalGrasas += Number(alimento.Grasas) * cantidad;
        totalCarbohidratos += Number(alimento.Carbohidratos) * cantidad;
        totalAzucares += Number(alimento.Azucares) * cantidad;
        totalProteinas += Number(alimento.Proteinas) * cantidad;
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    kilocalorias: totalKilocals,
    grasas: totalGrasas,
    carbohidratos: totalCarbohidratos,
    azucares: totalAzucares,
    proteinas: totalProteinas,
  })).setMimeType(ContentService.MimeType.JSON);
}