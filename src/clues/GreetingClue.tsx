import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import countryHelloData from '../data/country-hello.json';
import React from 'react';

export class GreetingClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Check if we have greeting data for this country
    const greetingData = countryHelloData[targetCity.country as keyof typeof countryHelloData];
    if (!greetingData) {
      return false;
    }
    
    // Check if the language difficulty matches the puzzle difficulty
    return this.isDifficultyMatch(greetingData.difficulty, context.difficulty);
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get greeting data for this country
    const greetingData = countryHelloData[targetCity.country as keyof typeof countryHelloData];
    
    // Generate the greeting visual
    const greetingVisual = this.generateGreetingVisual(greetingData, context.rng);
    
    return {
      id: `greeting-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: '', // Empty text for greeting clues
      type: 'greeting',
      imageUrl: greetingVisual,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private isDifficultyMatch(languageDifficulty: string, puzzleDifficulty: DifficultyLevel): boolean {
    switch (puzzleDifficulty) {
      case 'EASY':
        // Easy puzzles: only easy languages
        return languageDifficulty === 'easy';
      case 'MEDIUM':
        // Medium puzzles: easy and medium languages
        return languageDifficulty === 'easy' || languageDifficulty === 'medium';
      case 'HARD':
        // Hard puzzles: medium and hard languages
        return languageDifficulty === 'medium' || languageDifficulty === 'hard';
      default:
        return false;
    }
  }

  private generateGreetingVisual(greetingData: any, rng: () => number): string {
    const phrases = [
      { key: 'hello', text: greetingData.hello, emoji: '👋' },
      { key: 'welcome', text: greetingData.welcome, emoji: '🤗' },
      { key: 'thankYou', text: greetingData.thankYou, emoji: '🙏' }
    ];
    
    // Randomly select 2 out of 3 phrases
    const shuffledPhrases = [...phrases].sort(() => rng() - 0.5);
    const selectedPhrases = shuffledPhrases.slice(0, 2);
    
    return `
      <div style="
        display: flex;
        width: 80px;
        height: 48px;
        overflow: hidden;
        font-family: Arial, sans-serif;
        position: relative;
        background: white;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 4px;
        box-sizing: border-box;
      ">
        
        <!-- Two greeting phrases -->
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          width: 100%;
        ">
          ${selectedPhrases.map(phrase => `
            <div style="
              display: flex;
              align-items: center;
              gap: 3px;
              width: 100%;
              justify-content: center;
            ">
              <div style="font-size: 10px;">${phrase.emoji}</div>
              <div style="
                font-size: 6px;
                font-weight: bold;
                color: #333;
                text-align: center;
                line-height: 1.2;
              ">${phrase.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
        height: context.isInModal ? 'auto' : '100%'
      }}>
        <div 
          dangerouslySetInnerHTML={{ __html: clue.imageUrl }}
          style={{ 
            borderRadius: '8px',
            width: '100%',
            height: context.isInModal ? 'auto' : '100%',
            maxHeight: context.isInModal ? '300px' : '100%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        />
      </div>
    );
  }
}
