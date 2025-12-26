import { GoogleGenAI } from "@google/genai";
import { CharacterProfile, SceneSetting, ReferenceImage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateCharacterImage = async (
  character: CharacterProfile,
  scene: SceneSetting,
  customPrompt: string,
  references: ReferenceImage[],
  aspectRatio: "1:1" | "9:16"
): Promise<string> => {
  
  const prompt = `
    Task: Generate a high-quality piece of concept art.
    Style: Cinematic, detailed digital painting, photorealistic textures, 4k resolution.
    
    Character Context (for style consistency):
    - Name: ${character.name} (${character.roleType})
    - Core Features: ${character.physicalFeatures}
    - Environment: ${scene.environment} at ${scene.time}

    Primary Instruction:
    ${customPrompt}

    Reference Image Instructions:
    - You MUST strictly adhere to all provided reference images.
    - If multiple references (face, clothing, prop) are given, your primary goal is to combine them into a single, cohesive character.
    - If a 'Base' reference is provided, you are creating a detailed close-up portrait based on it, as per the Primary Instruction.
  `;

  const parts: any[] = [{ text: prompt }];

  for (const ref of references) {
    if (ref.data) {
        const base64Data = ref.data.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: 'image/png', // This could be improved to detect mime type
            data: base64Data,
          }
        });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};