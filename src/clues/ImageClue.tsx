import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import React from 'react';
import enhancedCitiesData from '../data/enhanced-cities.json';
import { ImageService } from '../services/ImageService';

export class ImageClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    return Boolean(enhancedCity) && Boolean(
      (enhancedCity?.landmarks && enhancedCity.landmarks.length > 0) ||
      (enhancedCity?.cuisine && enhancedCity.cuisine.filter(c => !['Local cuisine', 'Traditional dishes'].includes(c)).length > 0) ||
      (enhancedCity?.art && enhancedCity.art.length > 0)
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
      type: 'art-image',
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
    const searchTerm = `${randomDescription.replace('Image of ', '').replace(' in this city', '').replace(' from this city', '')} ${city.name}`;
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
        
      default:
        // Default to hard difficulty options (FESTIVE normalized to HARD)
        const defaultOptions = [];
        
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
            defaultOptions.push(`Image of ${cuisine}`);
          }
        }
        
        // Add art options
        if (enhancedCity?.art && enhancedCity.art.length > 0) {
          const artwork = enhancedCity.art[Math.floor(rng() * enhancedCity.art.length)];
          defaultOptions.push(`Image of ${artwork}`);
        }
        
        // Fallback options - only use if we don't have specific data
        if (defaultOptions.length === 0) {
          defaultOptions.push(
            `Local cuisine from this city`,
            `Traditional food from this region`,
            `Famous artwork from this city`
          );
        }
        
        return defaultOptions;
    }
  }

  // Commented out unused methods to fix build errors

  render(clue: ClueResult, _context: RenderContext): React.ReactNode {
    return (
      <div style={{ padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <strong>Image:</strong> {clue.text}
      </div>
    );
  }
}
