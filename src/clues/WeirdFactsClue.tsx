import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';
import React from 'react';

export class WeirdFactsClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const canGen = !!enhancedCity && enhancedCity.weirdFacts && enhancedCity.weirdFacts.length >= 2;
    
    return canGen || false;
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    if (!enhancedCity || !enhancedCity.weirdFacts || enhancedCity.weirdFacts.length < 2) {
      throw new Error(`No weird facts available for ${targetCity.name}`);
    }
    
    // Select 2 out of 3 facts based on difficulty
    const selectedFacts = this.selectFacts(enhancedCity.weirdFacts, context.difficulty, context.rng);
    
    // Use full facts as clue text - no truncation
    const clueText = selectedFacts.join(' • ');
    
    const result = {
      id: `weirdfacts-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: clueText,
      type: 'weirdfacts' as const,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
    
    
    
    return result;
  }

  private selectFacts(facts: string[], _difficulty: DifficultyLevel, rng: () => number): string[] {
    // Shuffle the facts array
    const shuffledFacts = [...facts].sort(() => rng() - 0.5);
    
    // Always select 2 facts
    return shuffledFacts.slice(0, 2);
  }

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    return (
      <div 
        onClick={() => {
          const facts = clue.text.split(' • ');
          context.onWeirdFactsClick?.(facts, clue.targetCityName!);
        }}
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: context.isInModal ? '8px' : '3px',
          fontSize: context.isInModal ? '7px' : '4px',
          lineHeight: '1.3',
          textAlign: 'center',
          color: '#333',
          overflow: 'hidden'
        }}
      >
        {clue.text}
      </div>
    );
  }
}
