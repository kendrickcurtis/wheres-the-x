import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';
import { ImageService } from '../services/ImageService';
import React from 'react';

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

  /**
   * Generate appropriate clue text based on the image type
   */
  protected generateClueText(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string {
    const imageDescriptions = this.getImageDescriptions(city, difficulty, enhancedCity, rng);
    const randomDescription = imageDescriptions[Math.floor(rng() * imageDescriptions.length)];
    
    return this.generateClueTextFromDescription(randomDescription);
  }

  /**
   * Generate clue text from a specific description
   */
  private generateClueTextFromDescription(description: string): string {
    // Convert the description into a proper clue text
    if (description.includes('Image of ')) {
      // For specific landmarks/items, make it more clue-like
      const item = description.replace('Image of ', '').replace(' in this city', '').replace(' from this city', '');
      return `This city is known for: ${item}`;
    } else if (description.includes('Local cuisine') || description.includes('Traditional food')) {
      return `This city is famous for its local cuisine`;
    } else if (description.includes('Cultural tradition')) {
      return `This city has distinctive cultural traditions`;
    } else {
      return `This city has notable ${this.getImageType().replace('-image', '')}`;
    }
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data for more specific image clues
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    // Get the image descriptions once and use the same selection for both text and image
    const imageDescriptions = this.getImageDescriptions(targetCity, context.difficulty, enhancedCity, context.rng);
    const selectedDescription = imageDescriptions[Math.floor(context.rng() * imageDescriptions.length)];
    
    const imageResult = await this.getImageUrlWithDescription(targetCity, selectedDescription);
    
    // If no image found, return null to indicate fallback needed
    if (!imageResult.url) {
      return null;
    }
    
    // Generate clue text based on the same selected description
    const clueText = this.generateClueTextFromDescription(selectedDescription);
    
    return {
      id: `${this.getImageType()}-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: clueText,
      type: this.getImageType() as any,
      imageUrl: imageResult.url,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  /*
  private async _getImageUrl(
    city: { name: string; country: string }, 
    difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): Promise<{ url: string | null; searchTerm: string }> {
    const imageDescriptions = this.getImageDescriptions(city, difficulty, enhancedCity, rng);
    const randomDescription = imageDescriptions[Math.floor(rng() * imageDescriptions.length)];
    
    return this.getImageUrlWithDescription(city, randomDescription);
  }
  */

  private async getImageUrlWithDescription(
    city: { name: string; country: string }, 
    description: string
  ): Promise<{ url: string | null; searchTerm: string }> {
    // Try to get a real image first
    const searchTerm = this.createSearchTerm(description, city.name);
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
    
    // For art descriptions, extract just the main artwork name (before any dashes or descriptions)
    if (description.includes('Image of ') && subject.includes(' - ')) {
      // For art like "Colossus of Rhodes - Ancient bronze statue depicting the sun god Helios"
      // Extract just "Colossus of Rhodes"
      subject = subject.split(' - ')[0].trim();
    }
    
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

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    if (!clue.imageUrl) return null;
    
    return (
      <div style={{
        margin: '0',
        padding: '0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: context.isInModal ? 'auto' : '100%',
        overflow: 'hidden'
      }}>
        <img 
          src={clue.imageUrl} 
          alt="Clue image" 
          onClick={() => context.onImageClick?.(clue.imageUrl!, "Clue image")}
          style={{ 
            width: '100%', 
            height: context.isMobile ? '112px' : (context.isInModal ? 'auto' : '48px'),
            maxWidth: '100%',
            maxHeight: context.isMobile ? '112px' : (context.isInModal ? '120px' : '48px'),
            objectFit: 'cover',
            borderRadius: '3px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            display: 'block',
            margin: '0',
            padding: '0'
          }}
        />
      </div>
    );
  }
}
