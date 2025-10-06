import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';
import { ImageService } from '../services/ImageService';

export abstract class BaseImageClue implements ClueGenerator {
  abstract getImageType(): string;
  abstract getImageDescriptions(city: { name: string; country: string }, difficulty: DifficultyLevel, enhancedCity: any, rng: () => number): string[];

  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    return !!enhancedCity && this.hasRelevantData(enhancedCity);
  }

  abstract hasRelevantData(enhancedCity: any): boolean;

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data for more specific image clues
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const imageResult = await this.getImageUrl(targetCity, context.difficulty, enhancedCity, context.rng);
    
    // If no image found, return null to indicate fallback needed
    if (!imageResult.url) {
      return null;
    }
    
    return {
      id: `${this.getImageType()}-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: imageResult.searchTerm || '', // Include search term for debug
      type: this.getImageType() as any,
      imageUrl: imageResult.url,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private async getImageUrl(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): Promise<{ url: string | null; searchTerm: string }> {
    const imageDescriptions = this.getImageDescriptions(city, difficulty, enhancedCity, rng);
    const randomDescription = imageDescriptions[Math.floor(rng() * imageDescriptions.length)];
    
    // Try to get a real image first
    const searchTerm = this.createSearchTerm(randomDescription, city.name);
    const realImages = await ImageService.searchWikimediaImages(searchTerm, 1);
    
    if (realImages.length > 0) {
      return { url: realImages[0].url, searchTerm };
    }
    
    // No fallback to placeholder - return null to trigger fallback to different clue type
    return { url: null, searchTerm };
  }

  /**
   * Create a search term optimized for Wikimedia Commons
   */
  private createSearchTerm(description: string, cityName: string): string {
    // Extract the main subject from the description
    let subject = description.replace('Image of ', '').replace(' in this city', '').replace(' from this city', '');
    
    // For specific items, create more targeted search terms
    if (description.includes('Image of ') && !description.includes('Local cuisine') && !description.includes('Traditional food')) {
      // This is a specific item like "Baguette" or "Eiffel Tower"
      return `${subject} ${cityName}`;
    }
    
    // For generic terms, use more descriptive search terms
    if (description.includes('Local cuisine')) {
      return `traditional food ${cityName}`;
    }
    if (description.includes('Traditional food')) {
      return `local cuisine ${cityName}`;
    }
    if (description.includes('Cultural tradition')) {
      return `cultural tradition ${cityName}`;
    }
    
    // Default case
    return `${subject} ${cityName}`;
  }
}
