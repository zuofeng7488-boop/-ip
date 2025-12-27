import { GoogleGenAI } from "@google/genai";
import { CharacterProfile, SceneSetting, ReferenceImage } from "../types";

export const generateCharacterImage = async (
  apiKey: string,
  modelName: string,
  character: CharacterProfile,
  scene: SceneSetting,
  customPrompt: string,
  references: ReferenceImage[],
  aspectRatio: "1:1" | "9:16",
  style?: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key 未配置。请在左侧配置面板中输入您的 Gemini API Key。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const styleInstruction = style ? style : 'Cinematic, detailed digital painting, photorealistic textures, 4k resolution';

  const prompt = `
    Task: Generate a high-quality piece of concept art.
    Style: ${styleInstruction}.
    
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
      model: modelName,
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
    
    throw new Error("模型未返回图片，请检查提示词或更换模型重试。");
  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    if (error.message?.includes('API key not valid')) {
       throw new Error("API Key 无效或不正确，请检查后重试。");
    }
    throw error;
  }
};


export const editCharacterImage = async (
  apiKey: string,
  modelName: string,
  baseImage: string, // base64 string
  editPrompt: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key 未配置。");
  }
  if (!baseImage) {
    throw new Error("需要一张基础图片才能进行编辑。");
  }

  const ai = new GoogleGenAI({ apiKey });

  const base64Data = baseImage.split(',')[1];
  const imagePart = {
    inlineData: {
      mimeType: 'image/png', // Assuming png, could detect from base64 header
      data: base64Data,
    },
  };

  const textPart = { text: editPrompt };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, textPart] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("模型未返回编辑后的图片。");
  } catch (error: any) {
    console.error("Gemini Image Editing Error:", error);
    if (error.message?.includes('API key not valid')) {
       throw new Error("API Key 无效或不正确，请检查后重试。");
    }
    throw error;
  }
};