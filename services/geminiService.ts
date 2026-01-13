// CLAVE MAESTRA (La nueva que creaste)
const apiKey = "AIzaSyD5CdzNg0QQp06Z6WrIyDmsTomHiDSPmEE";

export async function extractPickingData(base64Image: string) {
  // Limpiamos la imagen
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  // CORRECCIÓN FINAL: Usamos 'gemini-3.0-flash' (El modelo moderno de 2026)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent?key=${apiKey}`;

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
    const errorText = await response.text();
    console.error("Error de Google:", errorText);
    // Si falla el 3.0, lanzamos error para verlo en consola
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0].content) {
    throw new Error("La IA no ha devuelto datos.");
  }

  let text = data.candidates[0].content.parts[0].text;
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
}
