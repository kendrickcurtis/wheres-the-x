/** @jsx React.createElement */
import type { ClueGenerator, ClueContext, ClueResult, RenderContext } from './types';
import { globalData } from '../data/globalData';
import React from 'react';

export class FlagClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Count available flags
    const countryFlag = this.getCountryFlag(targetCity.country);
    
    const enhancedCity = globalData.enhancedCities?.find((city: any) => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const hasCityFlag = Boolean(enhancedCity?.cityFlag);
    const hasRegionFlag = Boolean(enhancedCity?.regionFlag);
    
    // Need at least 2 flags out of 3 (country, region, city)
    const flagCount = (countryFlag ? 1 : 0) + (hasCityFlag ? 1 : 0) + (hasRegionFlag ? 1 : 0);
    return flagCount >= 2;
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get all available flags
    const countryFlag = this.getCountryFlag(targetCity.country);
    
    const enhancedCity = globalData.enhancedCities?.find((city: any) => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const cityFlag = enhancedCity?.cityFlag;
    const regionFlag = enhancedCity?.regionFlag;
    
    // Build array of available flags (country, region, city)
    const availableFlags: Array<{ type: 'country' | 'region' | 'city'; url: string }> = [];
    
    if (countryFlag) {
      availableFlags.push({ type: 'country', url: countryFlag });
    }
    if (regionFlag) {
      availableFlags.push({ type: 'region', url: regionFlag });
    }
    if (cityFlag) {
      availableFlags.push({ type: 'city', url: cityFlag });
    }
    
    // Apply difficulty-based rules
    let selectedFlags: Array<{ type: 'country' | 'region' | 'city'; url: string }> = [];
    
    // Normalize FESTIVE to HARD for flag selection
    const difficulty = context.difficulty === 'FESTIVE' ? 'HARD' : context.difficulty;
    
    if (difficulty === 'EASY') {
      // Easy: Always include country flag + one other
      if (!countryFlag) {
        // If no country flag available, fall back to random selection
        const shuffledFlags = [...availableFlags].sort(() => context.rng() - 0.5);
        selectedFlags = shuffledFlags.slice(0, 2);
      } else {
        // Start with country flag
        selectedFlags.push({ type: 'country', url: countryFlag });
        
        // Get other available flags (region or city)
        const otherFlags = availableFlags.filter(f => f.type !== 'country');
        if (otherFlags.length > 0) {
          // Randomly select one other flag
          const shuffledOthers = [...otherFlags].sort(() => context.rng() - 0.5);
          selectedFlags.push(shuffledOthers[0]);
        }
        // If no region/city flags available, just show country flag (already added)
      }
    } else if (difficulty === 'HARD') {
      // Hard: Never include country flag (only region and/or city)
      const nonCountryFlags = availableFlags.filter(f => f.type !== 'country');
      if (nonCountryFlags.length >= 2) {
        // Randomly select 2 from region/city
        const shuffledFlags = [...nonCountryFlags].sort(() => context.rng() - 0.5);
        selectedFlags = shuffledFlags.slice(0, 2);
      } else if (nonCountryFlags.length === 1) {
        // Only one non-country flag available, use it
        selectedFlags = nonCountryFlags;
      } else {
        // No region/city flags available, fall back to country flag only
        if (countryFlag) {
          selectedFlags = [{ type: 'country', url: countryFlag }];
        } else {
          // No flags at all, use whatever is available
          selectedFlags = availableFlags.slice(0, 1);
        }
      }
    } else {
      // Medium: Random selection (no special rules)
      const shuffledFlags = [...availableFlags].sort(() => context.rng() - 0.5);
      selectedFlags = shuffledFlags.slice(0, 2);
      
      // If we only got 1 flag and country flag is available, add it
      if (selectedFlags.length < 2 && countryFlag && !selectedFlags.find(f => f.type === 'country')) {
        selectedFlags.push({ type: 'country', url: countryFlag });
      }
    }
    
    // Sort selected flags by priority: country < region < city
    const typePriority: Record<'country' | 'region' | 'city', number> = {
      'country': 0,
      'region': 1,
      'city': 2
    };
    selectedFlags = selectedFlags.sort((a, b) => typePriority[a.type] - typePriority[b.type]);
    
    return {
      id: `flag-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: JSON.stringify({
        flags: selectedFlags
      }),
      type: 'flag',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private getCountryFlag(country: string): string | null {
    // Map country names to flag emoji
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
      'Turkey': '🇹🇷',
      'Albania': '🇦🇱',
      'Bosnia and Herzegovina': '🇧🇦',
      'Kosovo': '🇽🇰',
      'North Macedonia': '🇲🇰',
      'Serbia': '🇷🇸',
      'Tunisia': '🇹🇳'
    };

    return flagMap[country] || null;
  }

  private generateFlagCSS(flags: Array<{ type: 'country' | 'region' | 'city'; url: string }>, isMobile: boolean = false): string {
    const width = '200px';
    const height = '120px';
    const segmentIconSize = isMobile ? '24px' : '24px';
    const flagSize = isMobile ? '40px' : '40px';
    const segmentMarginBottom = '2px';
    
    // Get label emojis based on flag types
    const leftFlag = flags[0];
    const rightFlag = flags[1];
    
    const getLabelEmoji = (type: 'country' | 'region' | 'city'): string => {
      switch (type) {
        case 'country': return '🗺️';
        case 'region': return '🏞️'; // National park emoji for regions/administrative areas
        case 'city': return '🏙️';
        default: return '🏳️';
      }
    };
    
    const leftLabel = leftFlag ? getLabelEmoji(leftFlag.type) : '🏳️';
    const rightLabel = rightFlag ? getLabelEmoji(rightFlag.type) : '🏳️';
    
    // Determine if flag is emoji or URL
    const isEmoji = (url: string): boolean => {
      // Emojis are single characters or short sequences, URLs are longer
      return url.length < 20 && !url.startsWith('http');
    };
    
    const renderFlag = (flag: { type: 'country' | 'region' | 'city'; url: string }): string => {
      if (isEmoji(flag.url)) {
        // For emoji flags, use consistent sizing and alignment
        return `<div style="font-size: ${flagSize}; line-height: 1; display: flex; align-items: center; justify-content: center; height: ${flagSize};">${flag.url}</div>`;
      } else {
        // For image flags, use consistent sizing
        return `<img src="${flag.url}" alt="${flag.type} flag" style="width: ${flagSize}; height: ${flagSize}; object-fit: contain; display: block;" />`;
      }
    };
    
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
        <!-- Left Flag -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
        ">
          <div style="font-size: ${segmentIconSize}; margin-bottom: ${segmentMarginBottom}; line-height: 1;">${leftLabel}</div>
          ${leftFlag ? renderFlag(leftFlag) : `<div style="font-size: ${flagSize}; line-height: 1; display: flex; align-items: center; justify-content: center; height: ${flagSize};">🏳️</div>`}
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
        
        <!-- Right Flag -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
        ">
          <div style="font-size: ${segmentIconSize}; margin-bottom: ${segmentMarginBottom}; line-height: 1;">${rightLabel}</div>
          ${rightFlag ? renderFlag(rightFlag) : `<div style="font-size: ${flagSize}; line-height: 1; display: flex; align-items: center; justify-content: center; height: ${flagSize};">🏳️</div>`}
        </div>
      </div>
    `;
  }

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    try {
      const flagData = JSON.parse(clue.text);
      let flags = flagData.flags || [];
      
      if (flags.length === 0) {
        return null;
      }
      
      // Ensure flags are sorted by hierarchy: country < region < city
      // This handles cases where old puzzles were saved with different ordering
      const typePriority: Record<'country' | 'region' | 'city', number> = {
        'country': 0,
        'region': 1,
        'city': 2
      };
      flags = flags.sort((a: { type: 'country' | 'region' | 'city'; url: string }, b: { type: 'country' | 'region' | 'city'; url: string }) => 
        typePriority[a.type] - typePriority[b.type]
      );
      
      const flagVisual = this.generateFlagCSS(flags, context.isMobile);
      
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
            dangerouslySetInnerHTML={{ __html: flagVisual }}
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
      // Fallback to simple emoji display if JSON parsing fails
      return (
        <div style={{ 
          fontSize: context.isMobile ? '64px' : (context.isInModal ? '40px' : '32px'), 
          marginBottom: '4px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: context.isMobile ? '64px' : (context.isInModal ? '40px' : '32px')
        }}>
          {clue.imageUrl || '🏳️'}
        </div>
      );
    }
  }
}
