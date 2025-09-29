import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import { DirectionClue } from './DirectionClue';
import { AnagramClue } from './AnagramClue';
import { ImageClue } from './ImageClue';
import { TextClue } from './TextClue';

export class ClueGeneratorOrchestrator {
  private generators: ClueGenerator[];
  private rng: () => number;

  constructor(rng: () => number) {
    this.rng = rng;
    this.generators = [
      new DirectionClue(),
      new AnagramClue(),
      new ImageClue(),
      new TextClue()
    ];
  }

  generateCluesForLocation(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    allCities: { name: string; lat: number; lng: number; country: string }[]
  ): ClueResult[] {
    const difficulty = this.getDifficultyForStop(stopIndex);
    
    if (stopIndex === 0) {
      // Start location - 1 clue about the start city
      return [this.generateSingleClue({
        targetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false
      })];
    } else if (stopIndex === 4) {
      // Final destination - 1 clue about the final city
      return [this.generateSingleClue({
        targetCity: finalCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false
      })];
    } else {
      // Middle stops - 3 clues: current city, final destination, red herring
      const clues: ClueResult[] = [];
      
      // Clue 1: About current city
      clues.push(this.generateSingleClue({
        targetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false
      }));
      
      // Clue 2: About final destination
      clues.push(this.generateSingleClue({
        targetCity: finalCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false
      }));
      
      // Clue 3: Red herring (gets closer to final destination as stop index increases)
      const redHerringCity = this.selectRedHerringCity(finalCity, stopIndex, allCities);
      clues.push(this.generateSingleClue({
        targetCity: redHerringCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: true,
        redHerringCity
      }));
      
      return clues;
    }
  }

  private generateSingleClue(context: ClueContext): ClueResult {
    // Filter generators that can handle this context
    const availableGenerators = this.generators.filter(gen => gen.canGenerate(context));
    
    if (availableGenerators.length === 0) {
      // Fallback to text clue if no other generators can handle it
      const textGenerator = new TextClue();
      return textGenerator.generateClue(context);
    }
    
    // Randomly select a generator
    const selectedGenerator = availableGenerators[Math.floor(this.rng() * availableGenerators.length)];
    return selectedGenerator.generateClue(context);
  }

  private getDifficultyForStop(stopIndex: number): DifficultyLevel {
    switch (stopIndex) {
      case 0: // Start
        return 'EASY';
      case 1: // First stop
        return 'EASY';
      case 2: // Second stop
        return 'MEDIUM';
      case 3: // Third stop
        return 'HARD';
      case 4: // Final destination
        return 'MEDIUM';
      default:
        return 'MEDIUM';
    }
  }

  private selectRedHerringCity(
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    allCities: { name: string; lat: number; lng: number; country: string }[]
  ): { name: string; lat: number; lng: number; country: string } {
    // Filter out the final city itself
    const availableCities = allCities.filter(city => city.name !== finalCity.name);
    
    // Calculate distances from final city
    const citiesWithDistance = availableCities.map(city => ({
      ...city,
      distance: this.calculateDistance(finalCity.lat, finalCity.lng, city.lat, city.lng)
    }));
    
    // Sort by distance
    citiesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Select red herring based on stop index
    // Earlier stops: farther from final destination
    // Later stops: closer to final destination
    const maxIndex = Math.min(citiesWithDistance.length - 1, 20); // Top 20 closest cities
    const selectionRange = Math.max(1, Math.floor(maxIndex * (1 - stopIndex / 4))); // Gets smaller as stop index increases
    
    const selectedIndex = Math.floor(this.rng() * selectionRange);
    return citiesWithDistance[selectedIndex];
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
