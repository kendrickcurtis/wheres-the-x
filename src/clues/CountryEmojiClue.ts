import type { ClueGenerator, ClueContext, ClueResult } from './types';
import countryEmojisData from '../data/country-emojis.json';

export class CountryEmojiClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    return !!(countryEmojisData as any)[targetCity.country];
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const countryEmojis = (countryEmojisData as any)[targetCity.country];
    
    if (!countryEmojis || countryEmojis.length < 3) {
      return null;
    }

    // Shuffle the emojis and take 3
    const shuffledEmojis = [...countryEmojis].sort(() => context.rng() - 0.5);
    const selectedEmojis = shuffledEmojis.slice(0, 3);

    return {
      id: `country-emoji-${Date.now()}-${Math.random()}`,
      text: selectedEmojis.join(' '),
      type: 'country-emoji',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }
}
