import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

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
    const fromCity = context.previousCity.name;

    return {
      id: `direction-${context.stopIndex}-${Date.now()}`,
      text: `${directionText} of ${fromCity}`,
      type: 'direction',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
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
}
