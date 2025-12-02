import type { ClueGenerator, ClueContext, ClueResult, RenderContext } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';
import React from 'react';

export class FestiveFactsClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    return !!(enhancedCity && enhancedCity.festiveFacts && enhancedCity.festiveFacts.length > 0);
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    if (!enhancedCity || !enhancedCity.festiveFacts || enhancedCity.festiveFacts.length === 0) {
      throw new Error(`No festive facts available for ${targetCity.name}`);
    }
    
    // Select a random festive fact
    const selectedFact = enhancedCity.festiveFacts[
      Math.floor(context.rng() * enhancedCity.festiveFacts.length)
    ];
    
    return {
      id: `festivefacts-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: selectedFact,
      type: 'festivefacts' as const,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    return (
      <div 
        onClick={() => {
          context.onWeirdFactsClick?.([clue.text], clue.targetCityName!);
        }}
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: context.isInModal ? '8px' : '3px',
          fontSize: context.isMobile ? '6px' : (context.isInModal ? '7px' : '4px'),
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

