// CLAVE MAESTRA
const apiKey = "AIzaSyD5CdzNg0QQp06Z6WrIyDmsTomHiDSPmEE";

export async function extractPickingData(base64Image: string) {
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // LISTA DE INTENTOS: Probamos todos estos modelos por si acaso
  const modelsToTry = [
    "gemini-1.5-flash",       // El estándar
    "gemini-1.5-flash-001",   // La versión específica
    "gemini-1.5-pro",         // El potente
    "gemini-2.0-flash-exp",   // El experimental (por si estás en el futuro)
    "gemini-pro-vision"       // El clásico
  ];

  let lastError = null;

  // BUCLE MÁGICO: Prueba uno a uno hasta que funcione
  for (const model of modelsToTry) {
    try {
      console.log(`Intentando conectar con modelo: ${model}...`);
      
      // Probamos con la API v1beta que es la más compatible
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract all picking rows from this table. Fields: line, location, article, quantity, unit. Return ONLY a raw JSON array. No Markdown." },
              { inline_data: { mime_type: "image/png", data: cleanBase64 } }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Fallo en ${model} (${response.status})`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0].content) {
        throw new Error("Respuesta vacía de la IA");
      }

      // SI LLEGAMOS AQUÍ, ¡HA FUNCIONADO!
      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      console.log(`¡ÉXITO! Conectado con ${model}`);
      return JSON.parse(text);

    } catch (error) {
      console.warn(`Falló el modelo ${model}, probando el siguiente...`);
      lastError = error;
      // Si falla, el bucle continúa con el siguiente modelo de la lista
    }
  }

  // Si fallan TODOS (muy improbable), lanzamos el último error
  console.error("Han fallado todos los modelos.");
  throw lastError;
}
