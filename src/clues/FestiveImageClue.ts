import type { DifficultyLevel } from './types';
import { BaseImageClue } from './BaseImageClue.tsx';

export class FestiveImageClue extends BaseImageClue {
  getImageType(): string {
    return 'festive-image';
  }

  hasRelevantData(enhancedCity: any): boolean {
    return !!(enhancedCity.festiveImages && enhancedCity.festiveImages.length > 0);
  }

  getImageDescriptions(
    city: { name: string; country: string }, 
    _difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string[] {
    if (!enhancedCity?.festiveImages || enhancedCity.festiveImages.length === 0) {
      return [`Festive scene in ${city.name}`];
    }

    const festiveImages = enhancedCity.festiveImages;
    const image = festiveImages[Math.floor(rng() * festiveImages.length)];
    
    return [`Festive image: ${image} in ${city.name}`];
  }
}


