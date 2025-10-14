import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

export class FamilyImageClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Check if we have a family image for this city and difficulty
    return this.hasFamilyImage(targetCity.name, context.difficulty);
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get the family image URL
    const imageUrl = this.getFamilyImageUrl(targetCity.name, context.difficulty, context.rng);
    
    if (!imageUrl) {
      return null;
    }
    
    // Generate clue text based on difficulty
    const clueText = this.generateClueText(context.difficulty);
    
    return {
      id: `family-image-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: clueText,
      type: 'family-image',
      imageUrl: imageUrl,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private hasFamilyImage(cityName: string, difficulty: DifficultyLevel): boolean {
    // Check if we have at least one image for this city and difficulty
    // We'll check for index 0 first, then potentially more indices
    const baseFileName = this.createFileName(cityName, difficulty, 0);
    
    // For now, we'll check against known cities that have family images
    // This is a temporary solution until we implement proper file existence checking
    const citiesWithFamilyImages = [
      'barcelona', 'bath', 'doncaster', 'zermatt', 'tunis', 'cornwall', 
      'scilly', 'york', 'venice', 'avebury', 'iceland'
    ];
    
    const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '-');
    return citiesWithFamilyImages.includes(normalizedCityName);
  }

  private getFamilyImageUrl(cityName: string, difficulty: DifficultyLevel, rng: () => number): string | null {
    // For now, we'll try index 0, but in the future we might have multiple images per city/difficulty
    const index = 0; // TODO: Randomly select from available indices
    const fileName = this.createFileName(cityName, difficulty, index);
    
    // Return the path to the family image
    return `/data/familyImages/${fileName}`;
  }

  private createFileName(cityName: string, difficulty: DifficultyLevel, index: number): string {
    // Convert city name to lowercase and replace spaces with hyphens
    const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '-');
    
    // Convert difficulty to lowercase
    const difficultyStr = difficulty.toLowerCase();
    
    return `${normalizedCityName}-${difficultyStr}${index}.jpg`;
  }

  private generateClueText(difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case 'EASY':
        return 'This city has distinctive family-friendly attractions and activities';
      case 'MEDIUM':
        return 'This city offers unique experiences that families enjoy';
      case 'HARD':
        return 'This city has special characteristics that make it appealing to families';
      default:
        return 'This city has family-oriented features and attractions';
    }
  }
}
