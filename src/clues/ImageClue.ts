import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

export class ImageClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return true; // Can always generate image clues (with fallback to text)
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // For now, we'll use placeholder image URLs and text descriptions
    // Later this will be replaced with actual Wikimedia Commons integration
    const imageData = this.getImageData(targetCity, context.difficulty);
    
    return {
      id: `image-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: imageData.description,
      type: 'image',
      imageUrl: imageData.url,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private getImageData(city: { name: string; country: string }, difficulty: DifficultyLevel): { url: string; description: string } {
    // Placeholder implementation - will be replaced with actual image scraping
    const imageDescriptions = this.getImageDescriptions(city, difficulty);
    const randomDescription = imageDescriptions[Math.floor(Math.random() * imageDescriptions.length)];
    
    return {
      url: this.getPlaceholderImageUrl(city.name, difficulty),
      description: randomDescription
    };
  }

  private getImageDescriptions(city: { name: string; country: string }, difficulty: DifficultyLevel): string[] {
    switch (difficulty) {
      case 'EASY':
        return [
          `Famous landmark in ${city.name}`,
          `Iconic building in ${city.name}`,
          `Well-known monument in ${city.name}`,
          `Historic site in ${city.name}`
        ];
      case 'MEDIUM':
        return [
          `Architectural feature of ${city.name}`,
          `Cultural site in ${city.name}`,
          `Notable building in ${city.name}`,
          `Historic district of ${city.name}`
        ];
      case 'HARD':
        return [
          `Local architectural detail`,
          `Cultural artifact from this city`,
          `Historical element`,
          `Regional characteristic feature`
        ];
    }
  }

  private getPlaceholderImageUrl(cityName: string, difficulty: DifficultyLevel): string {
    // Placeholder URLs - will be replaced with actual Wikimedia Commons URLs
    const baseUrl = 'https://via.placeholder.com';
    
    switch (difficulty) {
      case 'EASY':
        return `${baseUrl}/400x300/4CAF50/FFFFFF?text=${encodeURIComponent(cityName)}`;
      case 'MEDIUM':
        return `${baseUrl}/400x300/FF9800/FFFFFF?text=${encodeURIComponent(cityName)}`;
      case 'HARD':
        return `${baseUrl}/400x300/F44336/FFFFFF?text=${encodeURIComponent(cityName)}`;
    }
  }

  // Future method for Wikimedia Commons integration
  private async fetchWikimediaImage(cityName: string, difficulty: DifficultyLevel): Promise<string | null> {
    // This will be implemented when we add the scraping script
    // For now, return null to use placeholder
    return null;
  }

  // Future method for image blurring based on difficulty
  private applyBlurFilter(imageUrl: string, difficulty: DifficultyLevel): string {
    // This will be implemented when we have actual images
    // EASY: no blur, MEDIUM: slight blur, HARD: heavy blur
    return imageUrl;
  }
}
