// CLAVE NUEVA (La correcta de Gemini)
const apiKey = "AIzaSyD5CdzNg0QQp06Z6WrIyDmsTomHiDSPmEE";

export async function extractPickingData(base64Image: string) {
  // Limpiamos la imagen
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // URL directa a Google
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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
    throw new Error(`Error conectando con Gemini: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Protección extra por si la IA devuelve vacío
  if (!data.candidates || !data.candidates[0].content) {
    throw new Error("La IA no ha devuelto datos legibles.");
  }

  let text = data.candidates[0].content.parts[0].text;

  // Limpieza de seguridad
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
}
