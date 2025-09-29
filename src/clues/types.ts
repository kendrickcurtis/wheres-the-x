export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface ClueContext {
  targetCity: {
    name: string;
    lat: number;
    lng: number;
    country: string;
  };
  previousCity?: {
    name: string;
    lat: number;
    lng: number;
    country: string;
  };
  finalCity: {
    name: string;
    lat: number;
    lng: number;
    country: string;
  };
  stopIndex: number; // 0 = start, 1-3 = stops, 4 = final
  difficulty: DifficultyLevel;
  isRedHerring?: boolean;
  redHerringCity?: {
    name: string;
    lat: number;
    lng: number;
    country: string;
  };
  rng: () => number; // Seeded random number generator
}

export interface ClueResult {
  id: string;
  text: string;
  type: 'text' | 'image' | 'direction' | 'anagram' | 'flag';
  imageUrl?: string;
  difficulty: DifficultyLevel;
  isRedHerring: boolean;
  targetCityName: string; // Which city this clue is actually about
}

export interface ClueGenerator {
  generateClue(context: ClueContext): ClueResult;
  canGenerate(context: ClueContext): boolean;
}
