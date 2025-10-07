import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';

export class ClimateClue implements ClueGenerator {
  canGenerate(_context: ClueContext): boolean {
    return true; // Can always generate climate clues
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    const climateData = enhancedCity?.climate;
    
    // Generate the climate visual
    const climateVisual = this.generateClimateVisual(climateData, context.difficulty, context.rng);
    
    return {
      id: `climate-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: '', // Empty text for climate clues
      type: 'climate',
      imageUrl: climateVisual,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  /*
  private _getClimateText(_climateData: any, _difficulty: DifficultyLevel): string {
    // Return empty string for climate clues since we only want the visual
    return '';
  }
  */

  private generateClimateVisual(climateData: any, _difficulty: DifficultyLevel, rng: () => number): string {
    // Use actual data if available, otherwise generate placeholder data
    const juneTemp = Math.round((climateData?.juneTemp || this.getRandomTemp('june', rng)) * 10) / 10;
    const decTemp = Math.round((climateData?.decTemp || this.getRandomTemp('dec', rng)) * 10) / 10;
    const juneRainfall = climateData?.juneRainfall || this.getRandomRainfall(rng);
    const decRainfall = climateData?.decRainfall || this.getRandomRainfall(rng);
    
    // Generate CSS-based climate visual
    return this.generateClimateCSS(juneTemp, decTemp, juneRainfall, decRainfall);
  }

  private generateClimateCSS(juneTemp: number, decTemp: number, juneRainfall: number, decRainfall: number): string {
    // Generate temperature-sensitive colors
    const juneColor = this.getTempColor(juneTemp);
    const decColor = this.getTempColor(decTemp);
    const juneRainColor = this.getRainColor(juneRainfall);
    const decRainColor = this.getRainColor(decRainfall);
    
    // Generate temperature emojis
    const juneEmoji = this.getTempEmoji(juneTemp);
    const decEmoji = this.getTempEmoji(decTemp);
    
    return `
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        width: 100px;
        height: 105px;
        border: 2px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        font-family: Arial, sans-serif;
        position: relative;
      ">
        <!-- Horizontal line through middle -->
        <div style="
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: #666;
          z-index: 1;
        "></div>
        
        <!-- June Temperature (top-left) -->
        <div style="
          background: ${juneColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: white;
        ">
          <div style="font-size: 9px; font-weight: bold; position: absolute; top: 2px; left: 2px; color: rgba(255,255,255,0.9);">Jun</div>
          <div style="font-size: 16px; margin-bottom: 2px; margin-top: 5px;">${juneEmoji}</div>
          <div style="font-size: 12px; font-weight: bold; margin-top: -5px;">${juneTemp}°C</div>
        </div>
        
        <!-- June Rainfall (top-right) -->
        <div style="
          background: ${juneRainColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 8px;
            color: rgba(255,255,255,0.9);
            line-height: 1;
          ">${this.getRainfallScale(juneRainfall)}</div>
          <div style="font-size: 16px; margin-bottom: 2px; margin-top: 10px;">${this.getRainfallIcon(juneRainfall)}</div>
          <div style="font-size: 12px; font-weight: bold;margin-top:-5px;">${Math.round(juneRainfall)}mm</div>
        </div>
        
        <!-- December Temperature (bottom-left) -->
        <div style="
          background: ${decColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          color: white;
        ">
          <div style="font-size: 9px; font-weight: bold; position: absolute; top: 2px; left: 2px; color: rgba(255,255,255,0.9);">Dec</div>
          <div style="font-size: 16px; margin-bottom: 2px; margin-top: 10px;">${decEmoji}</div>
          <div style="font-size: 12px; font-weight: bold;margin-top:-5px">${decTemp}°C</div>
        </div>
        
        <!-- December Rainfall (bottom-right) -->
        <div style="
          background: ${decRainColor};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 8px;
            color: rgba(255,255,255,0.9);
            line-height: 1;
          ">${this.getRainfallScale(decRainfall)}</div>
          <div style="font-size: 16px; margin-bottom: 2px; margin-top: 10px;">${this.getRainfallIcon(decRainfall)}</div>
          <div style="font-size: 12px; font-weight: bold;margin-top:-5px">${Math.round(decRainfall)}mm</div>
        </div>
      </div>
    `;
  }

  private getTempColor(temp: number): string {
    if (temp >= 25) return '#ff4444'; // Hot red
    if (temp >= 20) return '#ff8844'; // Warm orange
    if (temp >= 15) return '#44aa44'; // Mild green
    if (temp >= 10) return '#4488ff'; // Cool blue
    if (temp >= 5) return '#8844ff';  // Cold purple
    return '#4444ff'; // Very cold dark blue
  }

  private getRainColor(rainfall: number): string {
    // Scale based on maximum values: June max ~800mm, Dec max ~600mm
    const maxRainfall = 800; // Use the higher maximum for consistent scaling
    const intensity = rainfall / maxRainfall;
    
    if (intensity >= 0.8) return '#003366'; // Very heavy rain - dark blue
    if (intensity >= 0.6) return '#0066cc'; // Heavy rain - medium dark blue
    if (intensity >= 0.4) return '#0088ff'; // Moderate rain - medium blue
    if (intensity >= 0.2) return '#44aaff'; // Light rain - light blue
    return '#88ccff'; // Very light rain - very light blue
  }

  private getTempEmoji(temp: number): string {
    if (temp >= 25) return '🔥';
    if (temp >= 20) return '☀️';
    if (temp >= 15) return '🌤️';
    if (temp >= 10) return '🌥️';
    if (temp >= 5) return '🌨️';
    return '❄️';
  }

  private getRandomTemp(month: 'june' | 'dec', rng: () => number): number {
    if (month === 'june') {
      return Math.floor(rng() * 10) + 15; // 15-24°C
    } else {
      return Math.floor(rng() * 15) - 5; // -5 to 9°C
    }
  }

  private getRandomRainfall(rng: () => number): number {
    return Math.floor(rng() * 600) + 300; // 300-900mm
  }

  private getRainfallScale(rainfall: number): string {
    const maxRainfall = 800; // Use the higher maximum for consistent scaling
    const intensity = rainfall / maxRainfall;
    
    if (intensity >= 0.8) return '●●●●●'; // Very High - 5 dots
    if (intensity >= 0.6) return '●●●●○'; // High - 4 dots
    if (intensity >= 0.4) return '●●●○○'; // Medium - 3 dots
    if (intensity >= 0.2) return '●●○○○'; // Low - 2 dots
    return '●○○○○'; // Very Low - 1 dot
  }

  private getRainfallIcon(rainfall: number): string {
    const maxRainfall = 800; // Use the higher maximum for consistent scaling
    const intensity = rainfall / maxRainfall;
    
    if (intensity >= 0.8) return '⛈️'; // Very High - Thunderstorm (heavy rain)
    if (intensity >= 0.6) return '🌧️'; // High - Rain cloud
    if (intensity >= 0.4) return '🌦️'; // Medium - Sun and rain
    if (intensity >= 0.2) return '🌤️'; // Low - Sun behind cloud
    return '☀️'; // Very Low - Sunny (dry)
  }
}
