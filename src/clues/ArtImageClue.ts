import type { DifficultyLevel } from './types';
import { BaseImageClue } from './BaseImageClue.tsx';

export class ArtImageClue extends BaseImageClue {
  getImageType(): string {
    return 'art-image';
  }

  hasRelevantData(enhancedCity: any): boolean {
    return !!(enhancedCity.art && enhancedCity.art.length > 0);
  }

  getImageDescriptions(
    _city: { name: string; country: string }, 
    _difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string[] {
    if (!enhancedCity?.art || enhancedCity.art.length === 0) {
      return [`Famous artwork from this city`];
    }

    const artwork = enhancedCity.art[Math.floor(rng() * enhancedCity.art.length)];
    return [`Image of ${artwork}`];
  }
}
