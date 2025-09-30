import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

export class AnagramClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return true; // Can always generate anagrams
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const cityName = targetCity.name;
    
    const anagram = this.createAnagram(cityName, context.difficulty, context.rng);
    
    return {
      id: `anagram-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: anagram,
      type: 'anagram',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private createAnagram(cityName: string, difficulty: DifficultyLevel, rng: () => number): string {
    const cleanName = cityName.toLowerCase().replace(/[^a-z]/g, '');
    
    switch (difficulty) {
      case 'EASY':
        return this.createEasyAnagram(cleanName, rng);
      case 'MEDIUM':
        return this.createMediumAnagram(cleanName, rng);
      case 'HARD':
        return this.createHardAnagram(cleanName, rng);
    }
  }

  private createEasyAnagram(cityName: string, rng: () => number): string {
    // EASY: 1-2 extra letters, partial shuffle
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(1, 2, rng);
    const allLetters = [...letters, ...extraLetters];
    
    // Partial shuffle - keep some letters in roughly correct positions
    const shuffled = [...allLetters];
    const shuffleCount = Math.floor(rng() * 3) + 2; // 2-4 swaps
    
    for (let i = 0; i < shuffleCount; i++) {
      const pos1 = Math.floor(rng() * shuffled.length);
      const pos2 = Math.floor(rng() * shuffled.length);
      [shuffled[pos1], shuffled[pos2]] = [shuffled[pos2], shuffled[pos1]];
    }
    
    return shuffled.join('').toUpperCase();
  }

  private createMediumAnagram(cityName: string, rng: () => number): string {
    // MEDIUM: 2-4 extra letters, more thorough shuffle
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(2, 4, rng);
    const allLetters = [...letters, ...extraLetters];
    
    // More thorough shuffle
    const shuffled = [...allLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.join('').toUpperCase();
  }

  private createHardAnagram(cityName: string, rng: () => number): string {
    // HARD: 3-5 extra letters, complete shuffle
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(3, 5, rng);
    const allLetters = [...letters, ...extraLetters];
    
    // Complete shuffle
    const shuffled = [...allLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.join('').toUpperCase();
  }

  private getExtraLetters(minExtra: number, maxExtra: number, rng: () => number): string[] {
    // Variable number of extra letters to prevent pattern recognition
    const numExtra = Math.floor(rng() * (maxExtra - minExtra + 1)) + minExtra;
    
    // Use common letters that could plausibly be in city names
    const commonLetters = ['a', 'e', 'i', 'o', 'u', 'r', 's', 't', 'n', 'l', 'h', 'd', 'c', 'm', 'p', 'b', 'g', 'f', 'w', 'y', 'v', 'k', 'j', 'x', 'q', 'z'];
    const extra: string[] = [];
    
    for (let i = 0; i < numExtra; i++) {
      extra.push(commonLetters[Math.floor(rng() * commonLetters.length)]);
    }
    
    return extra;
  }
}
