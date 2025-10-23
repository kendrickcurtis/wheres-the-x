/** @jsx React.createElement */
import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import { globalData } from '../data/globalData';
import React from 'react';

export class PopulationClue implements ClueGenerator {
  canGenerate(_context: ClueContext): boolean {
    return true; // Can always generate population clues
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data
    const enhancedCity = globalData.enhancedCities?.find((city: any) => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const cityPopulation = enhancedCity?.population || 0;
    const countryPopulation = (globalData.countryPopulations as any)?.[targetCity.country] || 0;
    
    // Generate the population visual
    const populationVisual = this.generatePopulationVisual(cityPopulation, countryPopulation, context.difficulty, context.rng);
    
    return {
      id: `population-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: '', // Empty text for population clues
      type: 'population',
      imageUrl: populationVisual,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private generatePopulationVisual(cityPopulation: number, countryPopulation: number, _difficulty: DifficultyLevel, _rng: () => number): string {
    // Generate CSS-based population visual with two segments
    return this.generatePopulationCSS(cityPopulation, countryPopulation);
  }

  private generatePopulationCSS(cityPopulation: number, countryPopulation: number): string {
    // Generate population scale indicators
    const cityScale = this.getPopulationScale(cityPopulation, 'city');
    const countryScale = this.getPopulationScale(countryPopulation, 'country');
    
    // Format population numbers
    const cityFormatted = this.formatPopulation(cityPopulation, 'city');
    const countryFormatted = this.formatPopulation(countryPopulation, 'country');
    
    const width = '200px';
    const height = '120px';
    const iconSize = '36px';
    const padding = '4px';
    const borderRadius = '4px';
    const segmentIconSize = '12px';
    const segmentLabelSize = '3px';
    const segmentValueSize = '6px';
    const segmentMarginBottom = '2px';
    const segmentLabelMargin = '1px';
    

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
        <!-- Population icon in middle -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: ${iconSize};
          z-index: 1;
          background: white;
          padding: ${padding};
          border-radius: ${borderRadius};
        ">👥</div>
        
        <!-- City Population (left side) -->
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
          <div style="font-size: ${segmentLabelSize}; color: #666; margin-bottom: ${segmentLabelMargin}; line-height: 1;">${cityScale}</div>
          <div style="font-size: ${segmentValueSize}; font-weight: bold; text-align: center; line-height: 1.2;">${cityFormatted}</div>
        </div>
        
        <!-- Country Population (right side) -->
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
          <div style="font-size: ${segmentLabelSize}; color: #666; margin-bottom: ${segmentLabelMargin}; line-height: 1;">${countryScale}</div>
          <div style="font-size: ${segmentValueSize}; font-weight: bold; text-align: center; line-height: 1.2;">${countryFormatted}</div>
        </div>
      </div>
    `;
  }


  private getPopulationScale(population: number, type: 'city' | 'country'): string {
    if (type === 'city') {
      // City population scale (0 to ~15M)
      const maxCityPop = 15000000;
      const intensity = Math.min(population / maxCityPop, 1);
      
      if (intensity >= 0.8) return '●●●●●'; // Very High - 5 dots
      if (intensity >= 0.6) return '●●●●○'; // High - 4 dots
      if (intensity >= 0.4) return '●●●○○'; // Medium - 3 dots
      if (intensity >= 0.2) return '●●○○○'; // Low - 2 dots
      return '●○○○○'; // Very Low - 1 dot
    } else {
      // Country population scale (0 to ~150M)
      const maxCountryPop = 150000000;
      const intensity = Math.min(population / maxCountryPop, 1);
      
      if (intensity >= 0.8) return '●●●●●'; // Very High - 5 dots
      if (intensity >= 0.6) return '●●●●○'; // High - 4 dots
      if (intensity >= 0.4) return '●●●○○'; // Medium - 3 dots
      if (intensity >= 0.2) return '●●○○○'; // Low - 2 dots
      return '●○○○○'; // Very Low - 1 dot
    }
  }

  private formatPopulation(population: number, type: 'city' | 'country'): string {
    if (type === 'country') {
      // Country population formatting rules
      if (population >= 10000000) {
        // Round to nearest 10 million
        const rounded = Math.round(population / 10000000) * 10;
        return `${rounded}M`;
      } else if (population >= 1000000) {
        // Round to nearest 1 million
        const rounded = Math.round(population / 1000000);
        return `${rounded}M`;
      } else {
        // Less than 1 million
        return '<1M';
      }
    } else {
      // City population formatting (keep original logic)
      if (population >= 1000000) {
        return `${(population / 1000000).toFixed(1)}M`;
      } else if (population >= 1000) {
        return `${(population / 1000).toFixed(0)}K`;
      } else {
        return population.toString();
      }
    }
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
