import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client directly using the process.env.API_KEY constant as per guidelines.
const ai = new GoogleGenAI({ apiKey: "AIzaSyDMoQviyboqko5kL_kDVZkElxDnqoUhGpo" });

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
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
          { text: 'Extract all picking rows from this table. Identify Linea (Line), Ubicacion (Location), Articulo (Article) and Cantidad (Quantity). Return as a structured JSON array.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: pickingSchema,
      }
    });

    // Access the .text property directly as it is a getter, not a method.
    const text = response.text;
    if (!text) throw new Error("No data extracted");
    // Trim the text result to ensure valid JSON parsing.
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
}