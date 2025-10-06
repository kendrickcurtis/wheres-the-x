import type { DifficultyLevel } from './types';
import { BaseImageClue } from './BaseImageClue';

export class CuisineImageClue extends BaseImageClue {
  getImageType(): string {
    return 'cuisine-image';
  }

  hasRelevantData(enhancedCity: any): boolean {
    if (!enhancedCity?.cuisine || enhancedCity.cuisine.length === 0) {
      return false;
    }
    
    // Only use cuisine if we have specific dishes (not generic terms)
    const specificCuisines = enhancedCity.cuisine.filter((item: string) => 
      !item.toLowerCase().includes('local') && 
      !item.toLowerCase().includes('traditional') && 
      !item.toLowerCase().includes('regional') &&
      !item.toLowerCase().includes('specialties')
    );
    
    return specificCuisines.length > 0;
  }

  getImageDescriptions(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string[] {
    const options = [];
    
    // Only use cuisine if we have specific dishes (not generic terms)
    if (enhancedCity?.cuisine && enhancedCity.cuisine.length > 0) {
      const specificCuisines = enhancedCity.cuisine.filter((item: string) => 
        !item.toLowerCase().includes('local') && 
        !item.toLowerCase().includes('traditional') && 
        !item.toLowerCase().includes('regional') &&
        !item.toLowerCase().includes('specialties')
      );
      
      if (specificCuisines.length > 0) {
        const cuisine = specificCuisines[Math.floor(rng() * specificCuisines.length)];
        options.push(`Image of ${cuisine}`);
      }
    }
    
    // Fallback options - only use if we don't have specific data
    if (options.length === 0) {
      options.push(
        `Local cuisine from this city`,
        `Traditional food from this region`
      );
    }
    
    return options;
  }
}
