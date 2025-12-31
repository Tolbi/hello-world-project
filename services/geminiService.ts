import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Producer, ChatMessage, KnowledgeFile } from "../types";

const getApiKey = () => {
  // Use Vite's import.meta.env for environment variables
  return (import.meta as any).env?.GEMINI_API_KEY || '';
};

export async function* chatWithInsights(
  message: string,
  history: ChatMessage[],
  producers: Producer[],
  knowledgeBase: KnowledgeFile[],
  systemInstruction: string
) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  // Construction du contexte des données producteurs
  const producerContext = `DONNÉES PRODUCTEURS ACTUELLES: ${JSON.stringify(producers)}`;
  
  // Préparation des fichiers de connaissances
  const fileParts = knowledgeBase.map(file => ({
    inlineData: {
      data: file.data.split(',')[1] || file.data,
      mimeType: file.mimeType
    }
  }));

  // Préparation de l'historique pour le chat Gemini
  const contents = [
    ...history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    {
      role: 'user',
      parts: [
        ...fileParts,
        { text: `${producerContext}\n\nQUESTION UTILISATEUR: ${message}` }
      ]
    }
  ];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: contents as any,
      config: {
        systemInstruction: systemInstruction || "Tu es l'assistant intelligent TOLBI OS. Tu aides les gestionnaires agricoles à analyser les données de télédétection et à prendre des décisions basées sur les documents de connaissance fournis.",
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      yield (chunk as GenerateContentResponse).text;
    }
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

// Anciennes fonctions gardées pour compatibilité si nécessaire
export async function getSeasonInsights(producers: Producer[]) {
  const prompt = `Analyse les données de production suivantes: ${JSON.stringify(producers)}. Fais un rapport synthétique en Français.`;
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || "";
}
