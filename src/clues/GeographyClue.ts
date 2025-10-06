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
    const { elevation, distanceToSea, positionInCountry } = geographyData;
    
    // Format position text properly
    let positionText: string;
    switch (positionInCountry.toLowerCase()) {
      case 'central':
        positionText = 'located centrally';
        break;
      case 'centre':
        positionText = 'located in the centre';
        break;
      case 'center':
        positionText = 'located in the center';
        break;
      case 'outside':
        positionText = 'located outside the country';
        break;
      default:
        positionText = `located in the ${positionInCountry.toLowerCase()}`;
    }
    
    // Always show all three pieces of information: elevation, distance to sea, and position in country
    return `This city is ${elevation}m above sea level, ${distanceToSea}km from the nearest sea, and ${positionText} of the country.`;
  }
}
