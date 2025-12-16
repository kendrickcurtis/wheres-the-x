/** @jsx React.createElement */
import type { ClueGenerator, ClueContext, ClueResult, RenderContext } from './types';
import { globalData } from '../data/globalData';
import React from 'react';

export class CityEmojiClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Check if country emojis exist
    const countryEmojis = (globalData.countryEmojis as any)?.[targetCity.country];
    if (!countryEmojis || countryEmojis.length < 2) {
      return false;
    }
    
    // Check if city emojis exist in enhanced city data
    const enhancedCity = globalData.enhancedCities?.find((city: any) => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const cityEmojis = enhancedCity?.cityEmojis;
    if (!cityEmojis || !Array.isArray(cityEmojis) || cityEmojis.length < 2) {
      return false;
    }
    
    return true;
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get country emojis (4 available, pick 2 random)
    const countryEmojis = (globalData.countryEmojis as any)?.[targetCity.country];
    if (!countryEmojis || countryEmojis.length < 2) {
      return null;
    }
    
    // Get city emojis from enhanced city data (3-4 available, pick 2 random)
    const enhancedCity = globalData.enhancedCities?.find((city: any) => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const cityEmojis = enhancedCity?.cityEmojis;
    if (!cityEmojis || !Array.isArray(cityEmojis) || cityEmojis.length < 2) {
      return null;
    }
    
    // Randomly select 2 country emojis
    const shuffledCountryEmojis = [...countryEmojis].sort(() => context.rng() - 0.5);
    const selectedCountryEmojis = shuffledCountryEmojis.slice(0, 2);
    
    // Randomly select 2 city emojis
    const shuffledCityEmojis = [...cityEmojis].sort(() => context.rng() - 0.5);
    const selectedCityEmojis = shuffledCityEmojis.slice(0, 2);
    
    return {
      id: `city-emoji-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: JSON.stringify({
        country: selectedCountryEmojis,
        city: selectedCityEmojis
      }),
      type: 'city-emoji',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private generateEmojiCSS(countryEmojis: string[], cityEmojis: string[], isMobile: boolean = false): string {
    const width = '200px';
    const height = '120px';
    const segmentIconSize = isMobile ? '24px' : '24px';
    const emojiSize = isMobile ? '28px' : '28px';
    const segmentMarginBottom = '2px';
    
    return `
      <div style="
        display: flex;
        width: ${width};
        height: ${height};
        overflow: hidden;
        font-family: Arial, sans-serif;
        position: relative;
        background: white;
      ">
        <!-- Country Emojis (left side) -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
        ">
          <div style="font-size: ${segmentIconSize}; margin-bottom: ${segmentMarginBottom};">🗺️</div>
          <div style="font-size: ${emojiSize}; line-height: 1.2;">${countryEmojis.join(' ')}</div>
        </div>
        
        <!-- Vertical divider -->
        <div style="
          width: 1px;
          height: 100%;
          background-color: #e0e0e0;
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
        "></div>
        
        <!-- City Emojis (right side) -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
        ">
          <div style="font-size: ${segmentIconSize}; margin-bottom: ${segmentMarginBottom};">🏙️</div>
          <div style="font-size: ${emojiSize}; line-height: 1.2;">${cityEmojis.join(' ')}</div>
        </div>
      </div>
    `;
  }

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    try {
      const emojiData = JSON.parse(clue.text);
      const countryEmojis = emojiData.country || [];
      const cityEmojis = emojiData.city || [];
      
      if (countryEmojis.length === 0 || cityEmojis.length === 0) {
        return null;
      }
      
      const emojiVisual = this.generateEmojiCSS(countryEmojis, cityEmojis, context.isMobile);
      
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
            dangerouslySetInnerHTML={{ __html: emojiVisual }}
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
    } catch (e) {
      // Fallback to simple text display if JSON parsing fails
      return (
        <span style={{ 
          fontSize: context.isMobile ? '33px' : (context.isInModal ? '24px' : '19px'), 
          lineHeight: '1.2',
          textAlign: 'center',
          display: 'block'
        }}>
          {clue.text}
        </span>
      );
    }
  }
}

