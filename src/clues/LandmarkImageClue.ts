import type { DifficultyLevel } from './types';
import { BaseImageClue } from './BaseImageClue';

export class LandmarkImageClue extends BaseImageClue {
  getImageType(): string {
    return 'landmark-image';
  }

  hasRelevantData(enhancedCity: any): boolean {
    return !!(enhancedCity.landmarks && enhancedCity.landmarks.length > 0);
  }

  getImageDescriptions(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string[] {
    if (!enhancedCity?.landmarks || enhancedCity.landmarks.length === 0) {
      return [`Famous landmark in ${city.name}`];
    }

    // For landmarks, difficulty doesn't matter much - they're all recognizable
    const landmark = enhancedCity.landmarks[Math.floor(rng() * enhancedCity.landmarks.length)];
    return [`Image of ${landmark} in ${city.name}`];
  }
}
