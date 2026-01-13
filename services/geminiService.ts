import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. CLAVE MAESTRA (Directa para evitar fallos)
const apiKey = "AIzaSyDMoQviyboqko5kL_kDVZkElxDnqoUhGpo";
const genAI = new GoogleGenerativeAI(apiKey);

export async function extractPickingData(base64Image: string) {
  try {
    // 2. MODELO SEGURO (Gemini 1.5 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Extract all picking rows from this table. Fields: line, location, article, quantity, unit. Return ONLY a raw JSON array. No Markdown.";

    // Limpiamos la imagen
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: "image/png"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();

    // 3. LIMPIEZA DE SEGURIDAD (Quitamos comillas raras o bloques ```json)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
