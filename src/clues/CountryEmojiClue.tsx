/** @jsx React.createElement */
import type { ClueGenerator, ClueContext, ClueResult, RenderContext } from './types';
import { globalData } from '../data/globalData';
import React from 'react';

export class CountryEmojiClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    return !!(globalData.countryEmojis as any)?.[targetCity.country];
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const countryEmojis = (globalData.countryEmojis as any)?.[targetCity.country];
    
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

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    return (
      <span style={{ 
        fontSize: context.isInModal ? '24px' : '19px', 
        lineHeight: '1.2',
        textAlign: 'center',
        display: 'block'
      }}>
        {clue.text}
      </span>
    );
  }
}
