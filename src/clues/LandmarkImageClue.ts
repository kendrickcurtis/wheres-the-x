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

    // Prioritize more distinctive landmarks over generic ones
    const landmarks = enhancedCity.landmarks;
    
    // Filter out generic landmarks that aren't very distinctive
    const genericTerms = ['old town', 'medieval town', 'historic center', 'city center', 'downtown'];
    const distinctiveLandmarks = landmarks.filter(landmark => 
      !genericTerms.some(term => landmark.toLowerCase().includes(term))
    );
    
    // Use distinctive landmarks if available, otherwise fall back to all landmarks
    const availableLandmarks = distinctiveLandmarks.length > 0 ? distinctiveLandmarks : landmarks;
    const landmark = availableLandmarks[Math.floor(rng() * availableLandmarks.length)];
    
    return [`Image of ${landmark} in ${city.name}`];
  }
}
