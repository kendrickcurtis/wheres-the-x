import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';
import { ImageService } from '../services/ImageService';

export class ImageClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    return !!enhancedCity && (
      (enhancedCity.landmarks && enhancedCity.landmarks.length > 0) ||
      (enhancedCity.cuisine && enhancedCity.cuisine.filter(c => !['Local cuisine', 'Traditional dishes'].includes(c)).length > 0) ||
      (enhancedCity.art && enhancedCity.art.length > 0)
    );
  }

  /**
   * Generate appropriate clue text for image clues
   */
  private generateClueText(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string {
    const imageDescriptions = this.getImageDescriptions(city, difficulty, enhancedCity, rng);
    const randomDescription = imageDescriptions[Math.floor(rng() * imageDescriptions.length)];
    
    // Convert the description into a proper clue text
    if (randomDescription.includes('Image of ')) {
      // For specific landmarks/items, make it more clue-like
      const item = randomDescription.replace('Image of ', '').replace(' in this city', '').replace(' from this city', '');
      return `This city is known for: ${item}`;
    } else if (randomDescription.includes('Local cuisine') || randomDescription.includes('Traditional food')) {
      return `This city is famous for its local cuisine`;
    } else if (randomDescription.includes('Cultural tradition')) {
      return `This city has distinctive cultural traditions`;
    } else {
      return `This city has notable landmarks and attractions`;
    }
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data for more specific image clues
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const forcedLandmark = (context as any).forcedLandmark;
    const imageResult = await this.getImageUrl(targetCity, context.difficulty, enhancedCity, context.rng, forcedLandmark);
    
    // If no image found, return null to indicate fallback needed
    if (!imageResult.url) {
      return null;
    }
    
    // Generate proper clue text
    const clueText = this.generateClueText(targetCity, context.difficulty, enhancedCity, context.rng);
    
    return {
      id: `image-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: clueText,
      type: 'image',
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
    rng: () => number,
    forcedLandmark?: string
  ): Promise<{ url: string | null; searchTerm: string }> {
    const imageDescriptions = this.getImageDescriptions(city, difficulty, enhancedCity, rng, forcedLandmark);
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

  private getImageDescriptions(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number,
    forcedLandmark?: string
  ): string[] {
    switch (difficulty) {
      case 'EASY':
        // Landmarks - most recognizable
        if (forcedLandmark) {
          return [`Image of ${forcedLandmark} in ${city.name}`];
        }
        if (enhancedCity?.landmarks && enhancedCity.landmarks.length > 0) {
          const landmark = enhancedCity.landmarks[Math.floor(rng() * enhancedCity.landmarks.length)];
          return [`Image of ${landmark} in ${city.name}`];
        }
        return [`Famous landmark in ${city.name}`];
        
      case 'MEDIUM':
        // Cuisines or art
        const mediumOptions = [];
        
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
            mediumOptions.push(`Image of ${cuisine}`);
          }
        }
        
        // Add art options
        if (enhancedCity?.art && enhancedCity.art.length > 0) {
          const artwork = enhancedCity.art[Math.floor(rng() * enhancedCity.art.length)];
          mediumOptions.push(`Image of ${artwork}`);
        }
        
        // Fallback options - only use if we don't have specific data
        if (mediumOptions.length === 0) {
          mediumOptions.push(
            `Local cuisine from this city`,
            `Traditional food from this region`,
            `Famous artwork from this city`
          );
        }
        
        return mediumOptions;
        
      case 'HARD':
        // Cuisine and art - same as medium but with different fallback options
        const hardOptions = [];
        
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
            hardOptions.push(`Image of ${cuisine}`);
          }
        }
        
        // Add art options
        if (enhancedCity?.art && enhancedCity.art.length > 0) {
          const artwork = enhancedCity.art[Math.floor(rng() * enhancedCity.art.length)];
          hardOptions.push(`Image of ${artwork}`);
        }
        
        // Fallback options - only use if we don't have specific data
        if (hardOptions.length === 0) {
          hardOptions.push(
            `Local cuisine from this city`,
            `Traditional food from this region`,
            `Famous artwork from this city`
          );
        }
        
        return hardOptions;
    }
  }

  private getPlaceholderImageUrl(cityName: string, difficulty: DifficultyLevel, description: string): string {
    // Create more realistic placeholder images that simulate what Google would return
    const baseUrl = 'https://via.placeholder.com';
    
    // Extract the main subject from the description
    let text = description.replace('Image of ', '').replace(' in this city', '').replace(' from this city', '');
    
    // Add city context to make it more realistic
    const searchTerm = `${text} in ${cityName}`;
    
    // Create different styles based on difficulty
    switch (difficulty) {
      case 'EASY':
        // Landmarks - bright, clear, iconic
        return `${baseUrl}/400x300/2E7D32/FFFFFF?text=${encodeURIComponent(searchTerm)}&font-size=16`;
      case 'MEDIUM':
        // Cuisines/traditions - warm, inviting colors
        return `${baseUrl}/400x300/E65100/FFFFFF?text=${encodeURIComponent(searchTerm)}&font-size=16`;
      case 'HARD':
        // Street scenes - muted, realistic colors
        return `${baseUrl}/400x300/424242/FFFFFF?text=${encodeURIComponent(searchTerm)}&font-size=16`;
    }
  }

  /**
   * Create a search term optimized for Wikimedia Commons
   */
  private createSearchTerm(description: string, cityName: string): string {
    // Extract the main subject from the description
    let subject = description.replace('Image of ', '').replace(' in this city', '').replace(' from this city', '');
    
    // For specific cuisine items, create more targeted search terms
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

  // Future method for image blurring based on difficulty
  private applyBlurFilter(imageUrl: string, difficulty: DifficultyLevel): string {
    // This will be implemented when we have actual images
    // EASY: no blur, MEDIUM: slight blur, HARD: heavy blur
    return imageUrl;
  }
}
