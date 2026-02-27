import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// Note: We use process.env.GEMINI_API_KEY which is injected by Vite
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function generateMockup(
  base64Image: string,
  mimeType: string,
  category: string,
  customPrompt: string,
  aspectRatio: string = "1:1"
): Promise<string> {
  const prompt = `Create a high-quality, photorealistic mockup of a ${category}. The provided image must be applied naturally and realistically as the main design on the ${category}. Ensure lighting, shadows, and perspective match the environment. ${customPrompt}`;
  
  // Extract base64 data without the data URL prefix
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error('Não foi possível gerar a imagem. Tente novamente.');
  } catch (error: any) {
    if (error.message?.includes('exceeded quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Limite de uso atingido. Por favor, aguarde um momento e tente novamente.');
    }
    throw error;
  }
}
