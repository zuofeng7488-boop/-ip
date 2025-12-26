export type RoleType = string;

export type ViewType = 'Front' | 'Side' | 'Full';

export interface CharacterImages {
  front: string | null;
  side: string | null;
  full: string | null;
  composite: string | null;
}

export interface CharacterPrompts {
  front: string;
  side: string;
  full: string;
  composite: string;
}

export interface SceneSetting {
  id: string;
  name: string;
  description: string;
  environment: string; // Formerly 'scene' on CharacterProfile
  time: string;
  clothing: string;
  props: string;
  clothingImage: string | null;
  propsImage: string | null;
  clothingPrompt: string;
  propsPrompt: string;
  generatedImages: CharacterImages;
  prompts: CharacterPrompts;
}

export interface CharacterProfile {
  id: string;
  roleType: RoleType;
  name: string;
  physicalFeatures: string;
  scenes: SceneSetting[];
}

export interface GenerateImageParams {
  character: CharacterProfile;
  scene: SceneSetting;
  view: ViewType;
}

export interface ReferenceImage {
  type: 'Face' | 'Clothing' | 'Prop' | 'Base';
  data: string; // base64 string
}