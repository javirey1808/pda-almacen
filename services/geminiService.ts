import { GoogleGenAI, Type } from "@google/genai";

// 1. CLAVE PUESTA A FUEGO (Para que no falle nunca)
const apiKey = "AIzaSyDMoQviyboqko5kL_kDVZkElxDnqoUhGpo";

const ai = new GoogleGenAI({ apiKey: apiKey });

const pickingSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      line: { type: Type.STRING, description: 'Line number (e.g., 1, 2, 3)' },
      location: { type: Type.STRING, description: 'Storage Location (e.g., A1-20-09-10-01)' },
      article: { type: Type.STRING, description: 'Article Number or Code' },
      quantity: { type: Type.NUMBER, description: 'Amount of cases/units' },
      unit: { type: Type.STRING, description: 'Unit type (e.g., CT, UN)' }
    },
    required: ['line', 'location', 'article', 'quantity'],
  },
};

export async function extractPickingData(base64Image: string) {
  try {
    // 2. CORRECCIÓN VITAL: Usamos 'gemini-1.5-flash' que sí existe
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: {
        parts: [
          // Limpiamos la imagen por si acaso viene con cabeceras
          { inlineData: { mimeType: 'image/png', data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image } },
          { text: 'Extract all picking rows from this table. Identify Linea (Line), Ubicacion (Location), Articulo (Article) and Cantidad (Quantity). Return as a structured JSON array.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: pickingSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data extracted");
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
