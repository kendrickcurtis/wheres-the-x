import type { ClueGenerator, ClueResult, DifficultyLevel, ClueContext, RenderContext } from './types';
import React from 'react';

export class GeographyClue implements ClueGenerator {
  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const { targetCity, difficulty, isRedHerring } = context;
    
    // Get geography data from the city
    const geographyData = (targetCity as any).geography;
    if (!geographyData) {
      return null; // No geography data available
    }

    // Generate the geography visual
    const geographyVisual = this.generateGeographyVisual(geographyData, difficulty);
    
    return {
      id: `geography-${context.stopIndex}-${targetCity.name}-${isRedHerring ? 'red' : 'normal'}`,
      text: '', // Empty text for geography clues
      type: 'geography',
      imageUrl: geographyVisual,
      difficulty,
      isRedHerring: isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  canGenerate(context: ClueContext): boolean {
    // Check if the target city has geography data
    const geographyData = (context.targetCity as any).geography;
    return geographyData && 
           geographyData.elevation !== undefined && 
           geographyData.distanceToSea !== undefined && 
           geographyData.positionInCountry !== undefined;
  }

  private generateGeographyVisual(geographyData: any, _difficulty: DifficultyLevel): string {
    const { elevation, distanceToSea, positionInCountry } = geographyData;
    
    // Format position text properly
    let positionText: string;
    let positionIcon: string;
    const position = positionInCountry.toLowerCase();
    switch (position) {
      case 'central':
      case 'centre':
      case 'center':
        positionText = 'Central';
        positionIcon = '🎯';
        break;
      case 'outside':
        positionText = 'Outside';
        positionIcon = '🚫';
        break;
      case 'island':
        positionText = 'Island';
        positionIcon = '🏝️';
        break;
      case 'n':
      case 'north':
        positionText = 'N';
        positionIcon = '⬆️';
        break;
      case 's':
      case 'south':
        positionText = 'S';
        positionIcon = '⬇️';
        break;
      case 'e':
      case 'east':
        positionText = 'E';
        positionIcon = '➡️';
        break;
      case 'w':
      case 'west':
        positionText = 'W';
        positionIcon = '⬅️';
        break;
      case 'ne':
      case 'northeast':
        positionText = 'NE';
        positionIcon = '↗️';
        break;
      case 'nw':
      case 'northwest':
        positionText = 'NW';
        positionIcon = '↖️';
        break;
      case 'se':
      case 'southeast':
        positionText = 'SE';
        positionIcon = '↘️';
        break;
      case 'sw':
      case 'southwest':
        positionText = 'SW';
        positionIcon = '↙️';
        break;
      default:
        positionText = positionInCountry;
        positionIcon = '📍';
    }
    
    // Format elevation and distance
    const elevationText = elevation >= 1000 ? `${(elevation / 1000).toFixed(1)}km` : `${elevation}m`;
    const distanceText = distanceToSea >= 1000 ? `${(distanceToSea / 1000).toFixed(1)}k km` : `${distanceToSea}km`;
    
    const width = '200px';
    const height = '120px';
    const iconSize = '22px'; // 30px * 0.75 = 22.5px, rounded to 22px
    const labelSize = '6px'; // 8px * 0.75 = 6px
    const valueSize = '12px'; // 16px * 0.75 = 12px
    const marginBottom = '6px';
    const labelMargin = '2px';

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
        <!-- Elevation (left section) -->
        <div style="
          width: 33.33%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
          border-right: 1px solid #eee;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: ${marginBottom};">⛰️</div>
          <div style="font-size: ${labelSize}; color: #666; margin-bottom: ${labelMargin}; line-height: 1;">Elevation</div>
          <div style="font-size: ${valueSize}; font-weight: bold; text-align: center; line-height: 1.2;">${elevationText}</div>
        </div>
        
        <!-- Distance to Sea (middle section) -->
        <div style="
          width: 33.33%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
          border-right: 1px solid #eee;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: ${marginBottom};">🌊</div>
          <div style="font-size: ${labelSize}; color: #666; margin-bottom: ${labelMargin}; line-height: 1;">To Sea</div>
          <div style="font-size: ${valueSize}; font-weight: bold; text-align: center; line-height: 1.2;">${distanceText}</div>
        </div>
        
        <!-- Position in Country (right section) -->
        <div style="
          width: 33.34%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: ${marginBottom};">${positionIcon}</div>
          <div style="font-size: ${labelSize}; color: #666; margin-bottom: ${labelMargin}; line-height: 1;">Region</div>
          <div style="font-size: ${valueSize}; font-weight: bold; text-align: center; line-height: 1.2;">${positionText}</div>
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
