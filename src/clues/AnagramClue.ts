import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

export class AnagramClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return true; // Can always generate anagrams
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const cityName = targetCity.name;
    
    const anagram = this.createAnagram(cityName, context.difficulty);
    
    return {
      id: `anagram-${context.stopIndex}-${Date.now()}`,
      text: `Anagram: ${anagram}`,
      type: 'anagram',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private createAnagram(cityName: string, difficulty: DifficultyLevel): string {
    const cleanName = cityName.toLowerCase().replace(/[^a-z]/g, '');
    
    switch (difficulty) {
      case 'EASY':
        return this.createEasyAnagram(cleanName);
      case 'MEDIUM':
        return this.createMediumAnagram(cleanName);
      case 'HARD':
        return this.createHardAnagram(cleanName);
    }
  }

  private createEasyAnagram(cityName: string): string {
    // Simple shuffle with minimal changes
    const letters = cityName.split('');
    const shuffled = [...letters];
    
    // Swap a few adjacent letters
    for (let i = 0; i < Math.min(2, letters.length - 1); i++) {
      const j = i + 1;
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.join('').toUpperCase();
  }

  private createMediumAnagram(cityName: string): string {
    // More thorough shuffle
    const letters = cityName.split('');
    const shuffled = [...letters];
    
    // Fisher-Yates shuffle with some constraints
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.join('').toUpperCase();
  }

  private createHardAnagram(cityName: string): string {
    // Complete shuffle with extra letters
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(cityName);
    const allLetters = [...letters, ...extraLetters];
    
    // Complete shuffle
    for (let i = allLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
    }
    
    return allLetters.join('').toUpperCase();
  }

  private getExtraLetters(cityName: string): string[] {
    // Add 1-3 extra letters to make it harder
    const commonLetters = ['a', 'e', 'i', 'o', 'u', 'r', 's', 't', 'n'];
    const numExtra = Math.floor(Math.random() * 3) + 1;
    const extra: string[] = [];
    
    for (let i = 0; i < numExtra; i++) {
      extra.push(commonLetters[Math.floor(Math.random() * commonLetters.length)]);
    }
    
    return extra;
  }
}
