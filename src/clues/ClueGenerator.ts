import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import { DirectionClue } from './DirectionClue';
import { AnagramClue } from './AnagramClue';
import { ImageClue } from './ImageClue';
import { TextClue } from './TextClue';
import { FlagClue } from './FlagClue';

export class ClueGeneratorOrchestrator {
  private generators: ClueGenerator[];
  private rng: () => number;
  private usedFinalDestinationClueTypes: Set<string> = new Set();

  constructor(rng: () => number) {
    this.rng = rng;
    this.generators = [
      new DirectionClue(),
      new AnagramClue(),
      new ImageClue(),
      new TextClue(),
      new FlagClue()
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
      // Start location - 1 clue about final destination (70%) or red herring (30%)
      const isRedHerring = this.rng() < 0.3; // 30% chance of red herring
      
      if (isRedHerring) {
        // Generate a red herring city that's far from the final destination
        const redHerringCity = this.selectRedHerringCity(finalCity, 0, allCities);
        return [this.generateSingleClue({
          targetCity: redHerringCity,
          previousCity,
          finalCity,
          stopIndex,
          difficulty,
          isRedHerring: true,
          redHerringCity,
          rng: this.rng
        })];
      } else {
        // 70% chance - clue about the final destination
        return [this.generateSingleClue({
          targetCity: finalCity,
          previousCity,
          finalCity,
          stopIndex,
          difficulty,
          isRedHerring: false,
          rng: this.rng
        })];
      }
    } else if (stopIndex === 4) {
      // Final destination - 1 clue about the final city
      return [this.generateSingleClue({
        targetCity: finalCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false,
        rng: this.rng
      })];
    } else {
      // Middle stops - 3 clues with different types: current city, final destination, red herring
      const clues: ClueResult[] = [];
      const usedClueTypes = new Set<string>();
      
      // Clue 1: About current city
      const clue1 = this.generateSingleClueWithTypeConstraint({
        targetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false,
        usedClueTypes,
        rng: this.rng
      });
      clues.push(clue1);
      usedClueTypes.add(clue1.type);
      
      // Clue 2: About final destination
      const clue2 = this.generateSingleClueWithTypeConstraint({
        targetCity: finalCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false,
        usedClueTypes,
        rng: this.rng
      });
      clues.push(clue2);
      usedClueTypes.add(clue2.type);
      
      // Clue 3: Red herring (gets closer to final destination as stop index increases)
      const redHerringCity = this.selectRedHerringCity(finalCity, stopIndex, allCities);
      const clue3 = this.generateSingleClueWithTypeConstraint({
        targetCity: redHerringCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: true,
        redHerringCity,
        usedClueTypes,
        rng: this.rng
      });
      clues.push(clue3);
      
      return clues;
    }
  }

  private generateSingleClue(context: ClueContext): ClueResult {
    // Filter generators that can handle this context
    let availableGenerators = this.generators.filter(gen => gen.canGenerate(context));
    
    // If this is a clue about the final destination, avoid repeating clue types
    if (context.targetCity.name === context.finalCity.name && context.targetCity.name !== context.previousCity?.name) {
      // Filter out generators for clue types we've already used for final destination
      availableGenerators = availableGenerators.filter(gen => {
        const testResult = gen.generateClue(context);
        return !this.usedFinalDestinationClueTypes.has(testResult.type);
      });
      
      // If no generators left, reset the used types and use all generators
      if (availableGenerators.length === 0) {
        this.usedFinalDestinationClueTypes.clear();
        availableGenerators = this.generators.filter(gen => gen.canGenerate(context));
      }
    }
    
    if (availableGenerators.length === 0) {
      // Fallback to text clue if no other generators can handle it
      const textGenerator = new TextClue();
      return textGenerator.generateClue(context);
    }
    
    // Randomly select a generator
    const selectedGenerator = availableGenerators[Math.floor(this.rng() * availableGenerators.length)];
    const result = selectedGenerator.generateClue(context);
    
    // Track final destination clue types
    if (context.targetCity.name === context.finalCity.name && context.targetCity.name !== context.previousCity?.name) {
      this.usedFinalDestinationClueTypes.add(result.type);
    }
    
    return result;
  }

  private generateSingleClueWithTypeConstraint(
    context: ClueContext & { usedClueTypes: Set<string> }
  ): ClueResult {
    // Filter generators that can handle this context
    let availableGenerators = this.generators.filter(gen => gen.canGenerate(context));
    
    // Filter out generators for clue types we've already used in this stop
    availableGenerators = availableGenerators.filter(gen => {
      const testResult = gen.generateClue(context);
      return !context.usedClueTypes.has(testResult.type);
    });
    
    // If this is a clue about the final destination, also avoid repeating final destination clue types
    if (context.targetCity.name === context.finalCity.name && context.targetCity.name !== context.previousCity?.name) {
      availableGenerators = availableGenerators.filter(gen => {
        const testResult = gen.generateClue(context);
        return !this.usedFinalDestinationClueTypes.has(testResult.type);
      });
    }
    
    // If no generators left, use all available generators (fallback)
    if (availableGenerators.length === 0) {
      availableGenerators = this.generators.filter(gen => gen.canGenerate(context));
    }
    
    if (availableGenerators.length === 0) {
      // Fallback to text clue if no other generators can handle it
      const textGenerator = new TextClue();
      return textGenerator.generateClue(context);
    }
    
    // Randomly select a generator
    const selectedGenerator = availableGenerators[Math.floor(this.rng() * availableGenerators.length)];
    const result = selectedGenerator.generateClue(context);
    
    // Track final destination clue types
    if (context.targetCity.name === context.finalCity.name && context.targetCity.name !== context.previousCity?.name) {
      this.usedFinalDestinationClueTypes.add(result.type);
    }
    
    return result;
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
    
    // Sort by distance (closest first)
    citiesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Select red herring based on stop index
    if (stopIndex === 0) {
      // Start location: select from cities that are FAR from final destination
      // Take the last 20 cities (farthest away)
      const farCities = citiesWithDistance.slice(-20);
      const selectedIndex = Math.floor(this.rng() * farCities.length);
      return farCities[selectedIndex];
    } else {
      // Middle stops: closer to final destination as stop index increases
      const maxIndex = Math.min(citiesWithDistance.length - 1, 20); // Top 20 closest cities
      const selectionRange = Math.max(1, Math.floor(maxIndex * (1 - stopIndex / 4))); // Gets smaller as stop index increases
      
      const selectedIndex = Math.floor(this.rng() * selectionRange);
      return citiesWithDistance[selectedIndex];
    }
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
