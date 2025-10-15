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
    switch (positionInCountry.toLowerCase()) {
      case 'central':
        positionText = 'Central';
        positionIcon = '🎯';
        break;
      case 'centre':
        positionText = 'Centre';
        positionIcon = '🎯';
        break;
      case 'center':
        positionText = 'Center';
        positionIcon = '🎯';
        break;
      case 'outside':
        positionText = 'Outside';
        positionIcon = '🚫';
        break;
      case 'north':
        positionText = 'North';
        positionIcon = '⬆️';
        break;
      case 'south':
        positionText = 'South';
        positionIcon = '⬇️';
        break;
      case 'east':
        positionText = 'East';
        positionIcon = '➡️';
        break;
      case 'west':
        positionText = 'West';
        positionIcon = '⬅️';
        break;
      case 'northeast':
        positionText = 'NE';
        positionIcon = '↗️';
        break;
      case 'northwest':
        positionText = 'NW';
        positionIcon = '↖️';
        break;
      case 'southeast':
        positionText = 'SE';
        positionIcon = '↘️';
        break;
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
    
    return `
      <div style="
        display: flex;
        width: 200px;
        height: 120px;
        overflow: hidden;
        font-family: Arial, sans-serif;
        position: relative;
        background: white;
      ">
        <!-- Elevation (left section) -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
          border-right: 1px solid #eee;
        ">
          <div style="font-size: 30px; margin-bottom: 6px;">⛰️</div>
          <div style="font-size: 8px; color: #666; margin-bottom: 2px; line-height: 1;">Elevation</div>
          <div style="font-size: 16px; font-weight: bold; text-align: center; line-height: 1.2;">${elevationText}</div>
        </div>
        
        <!-- Distance to Sea (middle section) -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
          border-right: 1px solid #eee;
        ">
          <div style="font-size: 30px; margin-bottom: 6px;">🌊</div>
          <div style="font-size: 8px; color: #666; margin-bottom: 2px; line-height: 1;">To Sea</div>
          <div style="font-size: 16px; font-weight: bold; text-align: center; line-height: 1.2;">${distanceText}</div>
        </div>
        
        <!-- Position in Country (right section) -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: #333;
        ">
          <div style="font-size: 30px; margin-bottom: 6px;">${positionIcon}</div>
          <div style="font-size: 8px; color: #666; margin-bottom: 2px; line-height: 1;">Region</div>
          <div style="font-size: 16px; font-weight: bold; text-align: center; line-height: 1.2;">${positionText}</div>
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
