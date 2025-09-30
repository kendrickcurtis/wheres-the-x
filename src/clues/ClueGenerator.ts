import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import { DirectionClue } from './DirectionClue';
import { AnagramClue } from './AnagramClue';
import { ImageClue } from './ImageClue';
import { FlagClue } from './FlagClue';
import { GeographyClue } from './GeographyClue';
import { ClimateClue } from './ClimateClue';

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
      new FlagClue(),
      new ClimateClue(),
      new GeographyClue()
    ];
  }

  // Reset the used final destination clue types for a new puzzle
  resetFinalDestinationClueTypes(): void {
    this.usedFinalDestinationClueTypes.clear();
  }

  async generateCluesForLocation(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    allCities: { name: string; lat: number; lng: number; country: string }[]
  ): Promise<ClueResult[]> {
    const difficulty = this.getDifficultyForStop(stopIndex);
    
    if (stopIndex === 0 || stopIndex === 4) {
      // Start location or final destination - 1 clue
      const clue = await this.generateSingleClue(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities);
      return clue ? [clue] : [];
    } else {
      // Middle stops - 3 different clue types
      const clues: ClueResult[] = [];
      const usedTypes = new Set<string>();
      
      for (let i = 0; i < 3; i++) {
        const clue = await this.generateSingleClueWithTypeConstraint(
          targetCity, 
          previousCity, 
          finalCity, 
          stopIndex, 
          difficulty, 
          allCities, 
          usedTypes
        );
        if (clue) {
          clues.push(clue);
          usedTypes.add(clue.type);
        }
      }
      
      return clues;
    }
  }

  private getDifficultyForStop(stopIndex: number): DifficultyLevel {
    switch (stopIndex) {
      case 0: // Start location
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

  private async generateSingleClue(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    allCities: { name: string; lat: number; lng: number; country: string }[]
  ): Promise<ClueResult | null> {
    let actualTargetCity: { name: string; lat: number; lng: number; country: string };
    let isRedHerring: boolean;
    let redHerringCity: { name: string; lat: number; lng: number; country: string } | undefined;
    
    if (stopIndex === 0) {
      // Start location: 70% chance about final destination, 30% chance red herring
      if (this.rng() < 0.7) {
        actualTargetCity = finalCity;
        isRedHerring = false;
      } else {
        redHerringCity = this.selectRedHerringCity(finalCity, stopIndex, allCities);
        actualTargetCity = redHerringCity;
        isRedHerring = true;
      }
    } else {
      // Other locations: normal red herring logic
      isRedHerring = this.rng() > 0.5;
      
      if (isRedHerring) {
        redHerringCity = this.selectRedHerringCity(finalCity, stopIndex, allCities);
        actualTargetCity = redHerringCity;
      } else {
        actualTargetCity = targetCity;
      }
    }
    
    // Filter available generators for final destination clues
    // Only apply this restriction to actual final destination clues (stopIndex === 4)
    let availableGenerators = this.generators.filter(gen => {
      // Check if generator can generate a clue for this context
      const context: ClueContext = {
        targetCity: actualTargetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring,
        redHerringCity,
        rng: this.rng
      };
      
      return gen.canGenerate(context);
    });
    if (actualTargetCity.name === finalCity.name && stopIndex === 4) {
      availableGenerators = availableGenerators.filter(gen => {
        // Map constructor names to clue types
        const clueTypeMap: Record<string, string> = {
          'DirectionClue': 'direction',
          'AnagramClue': 'anagram', 
          'ImageClue': 'image',
          'FlagClue': 'flag',
          'ClimateClue': 'climate',
          'GeographyClue': 'geography'
        };
        const clueType = clueTypeMap[gen.constructor.name] || gen.constructor.name.toLowerCase();
        return !this.usedFinalDestinationClueTypes.has(clueType);
      });
      
      // If no generators left, we've used all clue types for final destination
      // In this case, we should not generate another final destination clue
      if (availableGenerators.length === 0) {
        console.warn('All final destination clue types have been used. Cannot generate another final destination clue.');
        return null;
      }
    }
    
    // Select a random generator
    const generator = availableGenerators[Math.floor(this.rng() * availableGenerators.length)];
    
    const context: ClueContext = {
      targetCity: actualTargetCity,
      previousCity,
      finalCity,
      stopIndex,
      difficulty,
      isRedHerring,
      redHerringCity,
      rng: this.rng
    };
    
    const clue = await generator.generateClue(context);
    
    // Track used final destination clue types
    if (actualTargetCity.name === finalCity.name && clue) {
      this.usedFinalDestinationClueTypes.add(generator.constructor.name);
    }
    
    return clue;
  }

  private async generateSingleClueWithTypeConstraint(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    allCities: { name: string; lat: number; lng: number; country: string }[],
    usedTypes: Set<string>
  ): Promise<ClueResult | null> {
    // For middle stops (1-3), we need exactly one clue of each type:
    // 1. Current location clue
    // 2. Final destination clue  
    // 3. Red herring clue
    
    // Determine which type of clue this should be based on how many we've generated
    const clueIndex = usedTypes.size;
    let actualTargetCity: { name: string; lat: number; lng: number; country: string };
    let isRedHerring: boolean;
    let redHerringCity: { name: string; lat: number; lng: number; country: string } | undefined;
    
    switch (clueIndex) {
      case 0:
        // First clue: Current location
        actualTargetCity = targetCity;
        isRedHerring = false;
        break;
      case 1:
        // Second clue: Final destination
        actualTargetCity = finalCity;
        isRedHerring = false;
        break;
      case 2:
        // Third clue: Red herring
        redHerringCity = this.selectRedHerringCity(finalCity, stopIndex, allCities);
        actualTargetCity = redHerringCity;
        isRedHerring = true;
        break;
      default:
        return null; // Should not happen
    }
    
    // Filter out already used clue types and generators that can't generate clues
    let availableGenerators = this.generators.filter(gen => {
      // Check if generator can generate a clue for this context
      const context: ClueContext = {
        targetCity: actualTargetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring,
        redHerringCity,
        rng: this.rng
      };
      
      if (!gen.canGenerate(context)) {
        return false;
      }
      
      // Map constructor names to clue types
      const clueTypeMap: Record<string, string> = {
        'DirectionClue': 'direction',
        'AnagramClue': 'anagram', 
        'ImageClue': 'image',
        'FlagClue': 'flag',
        'ClimateClue': 'climate',
        'GeographyClue': 'geography'
      };
      const clueType = clueTypeMap[gen.constructor.name] || gen.constructor.name.toLowerCase();
      return !usedTypes.has(clueType);
    });
    
    // If this is a final destination clue, also filter out used final destination clue types
    // Only apply this restriction to actual final destination clues (stopIndex === 4)
    if (actualTargetCity.name === finalCity.name && stopIndex === 4) {
      availableGenerators = availableGenerators.filter(gen => {
        // Map constructor names to clue types
        const clueTypeMap: Record<string, string> = {
          'DirectionClue': 'direction',
          'AnagramClue': 'anagram', 
          'ImageClue': 'image',
          'FlagClue': 'flag',
          'ClimateClue': 'climate',
          'GeographyClue': 'geography'
        };
        const clueType = clueTypeMap[gen.constructor.name] || gen.constructor.name.toLowerCase();
        return !this.usedFinalDestinationClueTypes.has(clueType);
      });
    }
    
    if (availableGenerators.length === 0) {
      return null; // No more unique clue types available
    }
    
    // Select a random generator from available ones
    const generator = availableGenerators[Math.floor(this.rng() * availableGenerators.length)];
    
    const context: ClueContext = {
      targetCity: actualTargetCity,
      previousCity,
      finalCity,
      stopIndex,
      difficulty,
      isRedHerring,
      redHerringCity,
      rng: this.rng
    };
    
    const clue = await generator.generateClue(context);
    
    // Track used final destination clue types (only for actual final destination clues)
    if (actualTargetCity.name === finalCity.name && stopIndex === 4) {
      this.usedFinalDestinationClueTypes.add(clue.type);
    }
    
    return clue;
  }
}