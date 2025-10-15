/** @jsx React.createElement */
import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import React from 'react';

export class AnagramClue implements ClueGenerator {
  canGenerate(_context: ClueContext): boolean {
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
    // Normalize accented characters to their base forms (ö -> o, é -> e, etc.)
    const normalizedName = cityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const cleanName = normalizedName.replace(/[^a-z]/g, '');
    
    // Try multiple times to ensure minimum scrambling
    let bestAnagram = '';
    let bestScrambling = 0;
    const minScrambling = 0.5; // 50% minimum scrambling for better challenge
    
    for (let attempt = 0; attempt < 20; attempt++) {
      let anagram: string;
      
      switch (difficulty) {
        case 'EASY':
          anagram = this.createEasyAnagram(cleanName, rng);
          break;
        case 'MEDIUM':
          anagram = this.createMediumAnagram(cleanName, rng);
          break;
        case 'HARD':
          anagram = this.createHardAnagram(cleanName, rng);
          break;
      }
      
      const scrambling = this.calculateScrambling(cleanName, anagram.toLowerCase());
      
      if (scrambling >= minScrambling) {
        return anagram;
      }
      
      if (scrambling > bestScrambling) {
        bestScrambling = scrambling;
        bestAnagram = anagram;
      }
    }
    
    // If we couldn't achieve minimum scrambling after 10 attempts, return the best we found
    return bestAnagram || this.createHardAnagram(cleanName, rng);
  }

  private createEasyAnagram(cityName: string, rng: () => number): string {
    // EASY: 1-2 extra letters, more aggressive shuffle
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(1, 2, rng);
    const allLetters = [...letters, ...extraLetters];
    
    // More aggressive shuffle to ensure minimum scrambling
    const shuffled = [...allLetters];
    const shuffleCount = Math.floor(rng() * 5) + 5; // 5-9 swaps
    
    for (let i = 0; i < shuffleCount; i++) {
      const pos1 = Math.floor(rng() * shuffled.length);
      const pos2 = Math.floor(rng() * shuffled.length);
      [shuffled[pos1], shuffled[pos2]] = [shuffled[pos2], shuffled[pos1]];
    }
    
    return shuffled.join('').toUpperCase();
  }

  private createMediumAnagram(cityName: string, rng: () => number): string {
    // MEDIUM: 2-4 extra letters, thorough shuffle with extra randomization
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(2, 4, rng);
    const allLetters = [...letters, ...extraLetters];
    
    // Thorough shuffle with multiple passes for better randomization
    const shuffled = [...allLetters];
    
    // Multiple shuffle passes
    for (let pass = 0; pass < 3; pass++) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    
    return shuffled.join('').toUpperCase();
  }

  private createHardAnagram(cityName: string, rng: () => number): string {
    // HARD: 3-5 extra letters, maximum shuffle with multiple techniques
    const letters = cityName.split('');
    const extraLetters = this.getExtraLetters(3, 5, rng);
    const allLetters = [...letters, ...extraLetters];
    
    // Maximum shuffle with multiple techniques
    const shuffled = [...allLetters];
    
    // Technique 1: Multiple Fisher-Yates shuffles
    for (let pass = 0; pass < 5; pass++) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    
    // Technique 2: Additional random swaps
    const extraSwaps = Math.floor(rng() * 10) + 5; // 5-14 extra swaps
    for (let i = 0; i < extraSwaps; i++) {
      const pos1 = Math.floor(rng() * shuffled.length);
      const pos2 = Math.floor(rng() * shuffled.length);
      [shuffled[pos1], shuffled[pos2]] = [shuffled[pos2], shuffled[pos1]];
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

  private calculateScrambling(original: string, anagram: string): number {
    // Count how many letters are in different positions
    const originalLetters = original.split('');
    const anagramLetters = anagram.split('');
    
    // Create frequency maps to handle extra letters
    const originalFreq = new Map<string, number>();
    const anagramFreq = new Map<string, number>();
    
    // Count frequencies in original
    for (const letter of originalLetters) {
      originalFreq.set(letter, (originalFreq.get(letter) || 0) + 1);
    }
    
    // Count frequencies in anagram
    for (const letter of anagramLetters) {
      anagramFreq.set(letter, (anagramFreq.get(letter) || 0) + 1);
    }
    
    // Find the best matching positions for each letter
    let totalMoved = 0;
    let totalOriginalLetters = originalLetters.length;
    
    // For each unique letter in the original
    for (const [letter, originalCount] of originalFreq) {
      const anagramCount = anagramFreq.get(letter) || 0;
      const lettersToMatch = Math.min(originalCount, anagramCount);
      
      // Find the best positions for this letter
      const originalPositions: number[] = [];
      const anagramPositions: number[] = [];
      
      // Find positions in original
      for (let i = 0; i < originalLetters.length; i++) {
        if (originalLetters[i] === letter) {
          originalPositions.push(i);
        }
      }
      
      // Find positions in anagram
      for (let i = 0; i < anagramLetters.length; i++) {
        if (anagramLetters[i] === letter) {
          anagramPositions.push(i);
        }
      }
      
      // Calculate how many letters moved (using minimum distance matching)
      for (let i = 0; i < lettersToMatch; i++) {
        const originalPos = originalPositions[i];
        const anagramPos = anagramPositions[i];
        
        // If the letter is in a different position, count it as moved
        if (originalPos !== anagramPos) {
          totalMoved++;
        }
      }
    }
    
    // Return the percentage of letters that moved
    return totalOriginalLetters > 0 ? totalMoved / totalOriginalLetters : 0;
  }

  render(clue: ClueResult, _context: RenderContext): React.ReactNode {
    return (
      <span style={{ fontWeight: 'bold' }}>
        {clue.text}
      </span>
    );
  }
}
