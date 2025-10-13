import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';

export class FamilyClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;

    // Get enhanced city data
    const enhancedCity = enhancedCitiesData.find(city =>
      city.name === targetCity.name && city.country === targetCity.country
    );

    // Only generate if we have family clue text
    return !!(enhancedCity && enhancedCity.familyClue && enhancedCity.familyClue.trim().length > 0);
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    // Get the family clue text (we know it exists because canGenerate returned true)
    const clueText = enhancedCity!.familyClue!.trim();
    
    const result = {
      id: `family-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: clueText,
      type: 'family' as const,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
    
    return result;
  }
}
