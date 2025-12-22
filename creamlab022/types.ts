
export enum FlavorPreference {
  SWEET = '甜',
  SOUR = '酸',
  BITTER = '苦',
  SPICY = '辣',
  SALTY = '咸'
}

export interface FlavorProfile {
  sweetness: number;
  acidity: number;
  complexity: number;
  creaminess: number;
  innovation: number;
}

export interface CreamRecipe {
  id: string;
  timestamp: number;
  recipeName: string;
  summary: string;
  ingredients: {
    item: string;
    amount: string;
  }[];
  steps: string[];
  textureTips: string;
  pairingSuggestions: string;
  imageUrl?: string;
  flavorProfile: FlavorProfile;
}

export interface UserPreferences {
  ingredients: string;
  flavorLevels: Record<FlavorPreference, number>;
  texture: string;
}
