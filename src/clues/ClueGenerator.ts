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
  private finalDestinationClueTypes: string[] = [];
  private finalDestinationClueIndex: number = 0;

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

  // Reset and shuffle final destination clue types for a new puzzle
  resetFinalDestinationClueTypes(): void {
    // We need exactly 4 final destination clues: stops 1-3 and final destination (stop 4)
    // The start location (stop 0) is handled separately and doesn't count toward this limit
    const allClueTypes = ['direction', 'anagram', 'image', 'flag', 'climate', 'geography'];
    let shuffledTypes = [...allClueTypes].sort(() => this.rng() - 0.5);
    
    // Take exactly 4 clue types for the 4 guaranteed final destination clues
    this.finalDestinationClueTypes = shuffledTypes.slice(0, 4);
    
    // Find all direction clues and their positions
    const directionIndices: number[] = [];
    for (let i = 0; i < this.finalDestinationClueTypes.length; i++) {
      if (this.finalDestinationClueTypes[i] === 'direction') {
        directionIndices.push(i);
      }
    }
    
    // Remove all direction clues first
    for (let i = directionIndices.length - 1; i >= 0; i--) {
      this.finalDestinationClueTypes.splice(directionIndices[i], 1);
    }
    
    // Add direction clues back to the last position only (final destination)
    const numDirectionClues = directionIndices.length;
    if (numDirectionClues > 0) {
      // Add direction clues to the end (final destination position)
      for (let i = 0; i < numDirectionClues; i++) {
        this.finalDestinationClueTypes.push('direction');
      }
    }
    
    this.finalDestinationClueIndex = 0;
  }

  // Get the next unique final destination clue type
  private getNextFinalDestinationClueType(): string {
    if (this.finalDestinationClueIndex >= this.finalDestinationClueTypes.length) {
      throw new Error('Ran out of final destination clue types');
    }
    
    return this.finalDestinationClueTypes[this.finalDestinationClueIndex++];
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
        } else {
          // If the specific clue type failed, try generating any available clue type
          const fallbackClue = await this.generateFallbackClue(
            targetCity,
            previousCity,
            finalCity,
            stopIndex,
            difficulty,
            allCities,
            usedTypes,
            i
          );
          
          if (fallbackClue) {
            clues.push(fallbackClue);
            usedTypes.add(fallbackClue.type);
          } else {
            console.error(`Failed to generate clue ${i + 1} for stop ${stopIndex} even with fallback`);
          }
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
    
    // If this is a final destination clue, use predetermined unique type
    // BUT NOT for the start location (stop 0) - it gets a random final destination clue type
    let requiredClueType: string | undefined;
    if (actualTargetCity.name === finalCity.name && stopIndex !== 0) {
      requiredClueType = this.getNextFinalDestinationClueType();
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
        return clueType === requiredClueType;
      });
      
      // If no generators left, we've used all clue types for final destination
      // In this case, we should not generate another final destination clue
      if (availableGenerators.length === 0) {
        console.warn(`No generator available for required final destination clue type: ${requiredClueType}`);
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
    
    // No need to track used types anymore - we use predetermined types
    
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
    let requiredClueType: string | undefined;
    
    switch (clueIndex) {
      case 0:
        // First clue: Current location
        actualTargetCity = targetCity;
        isRedHerring = false;
        break;
      case 1:
        // Second clue: Final destination - use predetermined unique type
        actualTargetCity = finalCity;
        isRedHerring = false;
        requiredClueType = this.getNextFinalDestinationClueType();
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
    
    // Filter generators based on requirements
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
      
      // If we have a required clue type, only allow that type
      if (requiredClueType && clueType !== requiredClueType) {
        return false;
      }
      
      // For non-final destination clues, filter out already used types
      if (!requiredClueType) {
        return !usedTypes.has(clueType);
      }
      
      return true;
    });
    
    if (availableGenerators.length === 0) {
      console.error(`No available generators for clue type: ${requiredClueType || 'any'}, target: ${actualTargetCity.name}`);
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
    
    return clue;
  }

  private async generateFallbackClue(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    allCities: { name: string; lat: number; lng: number; country: string }[],
    usedTypes: Set<string>,
    clueIndex: number
  ): Promise<ClueResult | null> {
    // Determine the target for this clue based on the index
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
        return null;
    }
    
    // Try all available generators that haven't been used yet
    const availableGenerators = this.generators.filter(gen => {
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
      
      // Don't use already used types
      return !usedTypes.has(clueType);
    });
    
    // Try each available generator until one succeeds
    for (const generator of availableGenerators) {
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
      if (clue) {
        return clue;
      }
    }
    
    return null;
  }

}