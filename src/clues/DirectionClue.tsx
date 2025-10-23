import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import React from 'react';

export class DirectionClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return context.previousCity !== undefined;
  }

  generateClue(context: ClueContext): ClueResult {
    if (!context.previousCity) {
      throw new Error('DirectionClue requires a previous city');
    }

    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    const bearing = this.calculateBearing(
      context.previousCity.lat,
      context.previousCity.lng,
      targetCity.lat,
      targetCity.lng
    );

    const directionText = this.getDirectionText(bearing, context.difficulty);
    const directionSvg = this.generateDirectionSvg(bearing, context.difficulty);

    return {
      id: `direction-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: `${directionText} of the previous stop`,
      type: 'direction',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name,
      imageUrl: directionSvg
    };
  }

  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = this.deg2rad(lng2 - lng1);
    const lat1Rad = this.deg2rad(lat1);
    const lat2Rad = this.deg2rad(lat2);

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = this.rad2deg(Math.atan2(y, x));
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  private getDirectionText(bearing: number, difficulty: DifficultyLevel): string {
    switch (difficulty) {
      case 'EASY':
        return this.getPreciseDirection(bearing);
      case 'MEDIUM':
        return this.getOrdinalDirection(bearing);
      case 'HARD':
        return this.getCardinalDirection(bearing);
    }
  }

  private getCardinalDirection(bearing: number): string {
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  private getOrdinalDirection(bearing: number): string {
    const directions = [
      'North', 'North-Northeast', 'Northeast', 'East-Northeast',
      'East', 'East-Southeast', 'Southeast', 'South-Southeast',
      'South', 'South-Southwest', 'Southwest', 'West-Southwest',
      'West', 'West-Northwest', 'Northwest', 'North-Northwest'
    ];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }

  private getPreciseDirection(bearing: number): string {
    const rounded = Math.round(bearing);
    return `${rounded}°`;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private rad2deg(rad: number): number {
    return rad * (180 / Math.PI);
  }

  private generateDirectionSvg(bearing: number, difficulty: DifficultyLevel): string {
    const size = 60;
    const center = size / 2;
    const radius = 20;
    
    // Convert bearing to SVG rotation (SVG rotates clockwise, bearing is clockwise from North)
    const rotation = bearing;
    
    switch (difficulty) {
      case 'EASY':
        // Precise arrow pointing in exact direction
        return this.generatePreciseArrowSvg(size, center, radius, rotation);
      case 'MEDIUM':
        // Arc showing general direction range
        return this.generateArcSvg(size, center, radius, rotation, 22.5); // ±22.5 degrees
      case 'HARD':
        // Wider arc for cardinal directions
        return this.generateArcSvg(size, center, radius, rotation, 45); // ±45 degrees
    }
  }

  private generatePreciseArrowSvg(size: number, center: number, radius: number, rotation: number): string {
    const arrowLength = 15;
    const arrowWidth = 4;
    
    // Arrow pointing up (North) that will be rotated
    const arrowPath = `M ${center} ${center - radius} L ${center - arrowWidth} ${center - radius + arrowLength} L ${center + arrowWidth} ${center - radius + arrowLength} Z`;
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#007bff" stroke-width="2"/>
        <g transform="rotate(${rotation} ${center} ${center})">
          <path d="${arrowPath}" fill="#007bff"/>
        </g>
      </svg>
    `)}`;
  }

  private generateArcSvg(size: number, center: number, radius: number, rotation: number, spread: number): string {
    const startAngle = rotation - spread;
    const endAngle = rotation + spread;
    
    // Convert angles to SVG arc format
    const startX = center + radius * Math.sin(this.deg2rad(startAngle));
    const startY = center - radius * Math.cos(this.deg2rad(startAngle));
    const endX = center + radius * Math.sin(this.deg2rad(endAngle));
    const endY = center - radius * Math.cos(this.deg2rad(endAngle));
    
    const largeArcFlag = spread > 90 ? 1 : 0;
    const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#e0e0e0" stroke-width="2"/>
        <path d="${arcPath}" fill="none" stroke="#007bff" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `)}`;
  }

  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    if (!clue.imageUrl) return null;
    
    return (
      <div style={{ marginBottom: '2px', display: 'flex', justifyContent: 'center' }}>
        <img 
          src={clue.imageUrl} 
          alt="Direction indicator" 
          style={{ width: context.isMobile ? '40px' : (context.isInModal ? '24px' : '16px'), height: context.isMobile ? '40px' : (context.isInModal ? '24px' : '16px') }}
        />
      </div>
    );
  }
}
