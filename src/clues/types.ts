import React from 'react';

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
  date?: string; // Puzzle date/seed for festive puzzle detection
}

export interface ClueResult {
  id: string;
  text: string;
  type: 'landmark-image' | 'country-emoji' | 'art-image' | 'direction' | 'anagram' | 'flag' | 'geography' | 'weirdfacts' | 'population' | 'family' | 'family-image' | 'greeting' | 'festive-image' | 'festivefacts';
  imageUrl?: string;
  weirdFacts?: string[]; // For weird facts modal
  difficulty: DifficultyLevel;
  isRedHerring: boolean;
  targetCityName: string; // Which city this clue is actually about
}

export interface RenderContext {
  isInModal: boolean;
  isMobile: boolean;
  onImageClick?: (imageUrl: string, alt: string) => void;
  onWeirdFactsClick?: (facts: string[], cityName: string) => void;
}

export interface ClueGenerator {
  generateClue(context: ClueContext): ClueResult | Promise<ClueResult> | null | Promise<null> | Promise<ClueResult | null>;
  canGenerate(context: ClueContext): boolean;
  render(clue: ClueResult, context: RenderContext): React.ReactNode;
}
