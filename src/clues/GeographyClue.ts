import type { ClueGenerator, ClueResult, DifficultyLevel, ClueContext } from './types';

export class GeographyClue implements ClueGenerator {
  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const { targetCity, difficulty, isRedHerring } = context;
    
    // Get geography data from the city
    const geographyData = (targetCity as any).geography;
    if (!geographyData) {
      return null; // No geography data available
    }

    const clueText = this.generateGeographyText(geographyData, difficulty);
    
    return {
      id: `geography-${context.stopIndex}-${targetCity.name}-${isRedHerring ? 'red' : 'normal'}`,
      text: clueText,
      type: 'geography',
      difficulty,
      isRedHerring: isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  canGenerate(context: ClueContext): boolean {
    // Check if the target city has geography data
    const geographyData = (context.targetCity as any).geography;
    return geographyData && 
           geographyData.elevation !== undefined && 
           geographyData.distanceToSea !== undefined && 
           geographyData.positionInCountry !== undefined;
  }

  private generateGeographyText(geographyData: any, difficulty: DifficultyLevel): string {
    const { elevation, distanceToSea, nearestBodyOfWater, positionInCountry } = geographyData;
    
    switch (difficulty) {
      case 'EASY':
        // Show elevation and position in country
        return `This city is located ${elevation}m above sea level in the ${positionInCountry.toLowerCase()} of the country.`;
        
      case 'MEDIUM':
        // Show distance to sea and position
        return `This city is ${distanceToSea}km from the nearest ${nearestBodyOfWater.toLowerCase()} and is in the ${positionInCountry.toLowerCase()} of the country.`;
        
      case 'HARD':
        // Show all three pieces of information
        return `This city is ${elevation}m above sea level, ${distanceToSea}km from the nearest ${nearestBodyOfWater.toLowerCase()}, and located in the ${positionInCountry.toLowerCase()} of the country.`;
        
      default:
        return `This city is ${elevation}m above sea level.`;
    }
  }
}
