import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

export class FlagClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return true; // Can always generate flag clues
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    const flagData = this.getFlagData(targetCity, context.difficulty);
    
    return {
      id: `flag-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: flagData.description,
      type: 'flag',
      imageUrl: flagData.url,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private getFlagData(city: { name: string; country: string }, difficulty: DifficultyLevel): { url: string; description: string } {
    const flagUrl = this.getFlagUrl(city.country);
    
    // No text needed for flag clues - just the flag emoji
    return {
      url: flagUrl,
      description: ''
    };
  }

  private getFlagUrl(country: string): string {
    // Map country names to flag emoji or placeholder URLs
    const flagMap: Record<string, string> = {
      'France': '🇫🇷',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Netherlands': '🇳🇱',
      'Austria': '🇦🇹',
      'Czech Republic': '🇨🇿',
      'Poland': '🇵🇱',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Belgium': '🇧🇪',
      'Switzerland': '🇨🇭',
      'Hungary': '🇭🇺',
      'Romania': '🇷🇴',
      'Bulgaria': '🇧🇬',
      'Croatia': '🇭🇷',
      'Slovenia': '🇸🇮',
      'Slovakia': '🇸🇰',
      'Lithuania': '🇱🇹',
      'Latvia': '🇱🇻',
      'Estonia': '🇪🇪',
      'Ireland': '🇮🇪',
      'Portugal': '🇵🇹',
      'Greece': '🇬🇷',
      'Cyprus': '🇨🇾',
      'Malta': '🇲🇹',
      'Luxembourg': '🇱🇺',
      'Monaco': '🇲🇨',
      'San Marino': '🇸🇲',
      'Vatican City': '🇻🇦',
      'Andorra': '🇦🇩',
      'Liechtenstein': '🇱🇮',
      'Iceland': '🇮🇸',
      'Russia': '🇷🇺',
      'Ukraine': '🇺🇦',
      'Belarus': '🇧🇾',
      'Moldova': '🇲🇩',
      'Georgia': '🇬🇪',
      'Armenia': '🇦🇲',
      'Azerbaijan': '🇦🇿',
      'Turkey': '🇹🇷'
    };

    // Return flag emoji if available, otherwise use placeholder
    return flagMap[country] || `🏳️ ${country}`;
  }
}
