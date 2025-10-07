import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import { DirectionClue } from './DirectionClue';
import { AnagramClue } from './AnagramClue';
import { LandmarkImageClue } from './LandmarkImageClue';
import { CuisineImageClue } from './CuisineImageClue';
import { ArtImageClue } from './ArtImageClue';
import { FlagClue } from './FlagClue';
import { GeographyClue } from './GeographyClue';
import { ClimateClue } from './ClimateClue';
import { WeirdFactsClue } from './WeirdFactsClue';

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
      new LandmarkImageClue(),
      new CuisineImageClue(),
      new ArtImageClue(),
      new FlagClue(),
      new ClimateClue(),
      new GeographyClue(),
      new WeirdFactsClue()
    ];
    
    // Red herring distribution will be initialized in resetFinalDestinationClueTypes
  }

  private redHerringStops: Set<number> = new Set();

  private initializeRedHerringDistribution(): void {
    // Randomly select 2 out of 4 stops (0-3) to have red herrings
    const allStops = [0, 1, 2, 3];
    const shuffled = [...allStops].sort(() => this.rng() - 0.5);
    this.redHerringStops = new Set(shuffled.slice(0, 2));
    console.log('Red herring stops for this puzzle:', Array.from(this.redHerringStops));
  }

  private shouldStopHaveRedHerring(stopIndex: number): boolean {
    return this.redHerringStops.has(stopIndex);
  }

  /**
   * Get the clue distribution for a specific stop based on the table
   * Returns an array of clue types: [clue1, clue2, clue3]
   */
  private getClueDistributionForStop(stopIndex: number): ('current' | 'final' | 'red-herring')[] {
    if (stopIndex === 4) {
      // Final stop: only 1 final clue
      return ['final'];
    }
    
    const hasRedHerring = this.shouldStopHaveRedHerring(stopIndex);
    
    if (hasRedHerring) {
      // With red herring: [current, final, red-herring]
      return ['current', 'final', 'red-herring'];
    } else {
      // Without red herring: [current, current, final]
      return ['current', 'current', 'final'];
    }
  }

  // Reset and shuffle final destination clue types for a new puzzle
  resetFinalDestinationClueTypes(): void {
    // Reinitialize red herring distribution for new puzzle
    this.initializeRedHerringDistribution();
    
    // We need exactly 5 final destination clues: stops 0-3 (each can have 1 final destination clue) and final destination (stop 4)
    const allClueTypes = ['direction', 'anagram', 'landmark-image', 'cuisine-image', 'art-image', 'flag', 'climate', 'geography', 'weirdfacts'];
    let shuffledTypes = [...allClueTypes].sort(() => this.rng() - 0.5);
    
    // Take exactly 5 clue types for the 5 potential final destination clues
    this.finalDestinationClueTypes = shuffledTypes.slice(0, 5);
    
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
    
    // Ensure we have at least 5 clue types by adding more if needed
    while (this.finalDestinationClueTypes.length < 5) {
      const remainingTypes = allClueTypes.filter(type => 
        !this.finalDestinationClueTypes.includes(type)
      );
      if (remainingTypes.length > 0) {
        const randomType = remainingTypes[Math.floor(this.rng() * remainingTypes.length)];
        this.finalDestinationClueTypes.push(randomType);
      } else {
        // If we've used all types, duplicate some
        const randomType = allClueTypes[Math.floor(this.rng() * allClueTypes.length)];
        this.finalDestinationClueTypes.push(randomType);
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
    allCities: { name: string; lat: number; lng: number; country: string }[],
    usedFinalDestinationTypes: Set<string> = new Set()
  ): Promise<ClueResult[]> {
    const difficulty = this.getDifficultyForStop(stopIndex);
    
    // All stops (0-4) use table-based generation
    return await this.generateCluesForStopFromTable(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, usedFinalDestinationTypes);
  }

  /**
   * Generate clues for a stop based on the table distribution
   */
  private getAvailableClueTypesForCity(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    _allCities: { name: string; lat: number; lng: number; country: string }[]
  ): string[] {
    const allClueTypes = ['anagram', 'landmark-image', 'cuisine-image', 'art-image', 'flag', 'climate', 'geography', 'weirdfacts'];
    const availableTypes: string[] = [];
    
    for (const clueType of allClueTypes) {
      // Check if any generator can generate this clue type for this city
      const context: ClueContext = {
        targetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false,
        redHerringCity: undefined,
        rng: this.rng
      };
      
      const clueTypeMap: Record<string, string> = {
        'DirectionClue': 'direction',
        'AnagramClue': 'anagram', 
        'LandmarkImageClue': 'landmark-image',
        'CuisineImageClue': 'cuisine-image',
        'ArtImageClue': 'art-image',
        'FlagClue': 'flag',
        'ClimateClue': 'climate',
        'GeographyClue': 'geography',
        'WeirdFactsClue': 'weirdfacts'
      };
      
      const canGenerate = this.generators.some(gen => {
        const genClueType = clueTypeMap[gen.constructor.name] || gen.constructor.name.toLowerCase();
        return genClueType === clueType && gen.canGenerate(context);
      });
      
      if (canGenerate) {
        availableTypes.push(clueType);
      }
    }
    
    return availableTypes;
  }

  private async generateCluesForStopFromTable(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    allCities: { name: string; lat: number; lng: number; country: string }[],
    usedFinalDestinationTypes: Set<string> = new Set()
  ): Promise<ClueResult[]> {
    const clues: ClueResult[] = [];
    const distribution = this.getClueDistributionForStop(stopIndex);
    
    console.log(`Stop ${stopIndex} distribution:`, distribution);
    
    // Get available clue types for this city
    const availableTypes = this.getAvailableClueTypesForCity(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities);
    const shuffledTypes = [...availableTypes].sort(() => this.rng() - 0.5);
    let typeIndex = 0;
    
    // Track used clue types within this stop to ensure uniqueness
    const usedTypesInThisStop = new Set<string>();
    
    // Generate each clue according to the distribution
    for (let i = 0; i < distribution.length; i++) {
      const clueType = distribution[i];
      let clue: ClueResult | null = null;
      
      if (clueType === 'current') {
        // Current location clue - try available types in order, avoiding already used types
        for (let j = 0; j < shuffledTypes.length; j++) {
          const typeToTry = shuffledTypes[(typeIndex + j) % shuffledTypes.length];
          if (!usedTypesInThisStop.has(typeToTry)) {
            clue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 0, typeToTry
            );
            if (clue) {
              usedTypesInThisStop.add(typeToTry);
              break;
            }
          }
        }
        typeIndex++;
      } else if (clueType === 'final') {
        // Final destination clue - try available types in order, avoiding already used types
        for (let j = 0; j < shuffledTypes.length; j++) {
          const typeToTry = shuffledTypes[(typeIndex + j) % shuffledTypes.length];
          if (!usedTypesInThisStop.has(typeToTry) && !usedFinalDestinationTypes.has(typeToTry)) {
            clue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 1, typeToTry
            );
            if (clue) {
              usedTypesInThisStop.add(typeToTry);
              usedFinalDestinationTypes.add(typeToTry);
              break;
            }
          }
        }
        typeIndex++;
      } else if (clueType === 'red-herring') {
        // Red herring clue - try available types in order, avoiding already used types
        for (let j = 0; j < shuffledTypes.length; j++) {
          const typeToTry = shuffledTypes[(typeIndex + j) % shuffledTypes.length];
          if (!usedTypesInThisStop.has(typeToTry)) {
            clue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 2, typeToTry
            );
            if (clue) {
              usedTypesInThisStop.add(typeToTry);
              break;
            }
          }
        }
        typeIndex++;
      }
      
      if (clue) {
        clues.push(clue);
      } else {
        console.error(`Failed to generate any clue for stop ${stopIndex}, clue type: ${clueType}`);
      }
    }
    
    // Shuffle the clues so the order is random
    const shuffledClues = [...clues].sort(() => this.rng() - 0.5);
    
    return shuffledClues;
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

  // Generate a hint clue - always true, never a red herring
  async generateHintClue(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    _allCities: { name: string; lat: number; lng: number; country: string }[]
  ): Promise<ClueResult | null> {
    console.log('Generating hint clue for:', targetCity.name, targetCity.country);
    
    // For hints, always use the actual target city (never a red herring)
    const actualTargetCity = targetCity;
    const isRedHerring = false;
    
    // Filter available generators
    let availableGenerators = this.generators.filter(gen => {
      const context: ClueContext = {
        targetCity: actualTargetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring,
        redHerringCity: undefined,
        rng: this.rng
      };
      
      const canGen = gen.canGenerate(context);
      console.log(`Generator ${gen.constructor.name} can generate:`, canGen);
      return canGen;
    });
    
    console.log('Available generators for hint:', availableGenerators.length);
    
    if (availableGenerators.length === 0) {
      console.warn('No available generators for hint clue');
      return null;
    }
    
    // Randomize the order of available generators for hints to ensure variety
    const shuffledGenerators = [...availableGenerators].sort(() => this.rng() - 0.5);
    
    // Try each generator until one succeeds
    for (const generator of shuffledGenerators) {
      console.log('Trying generator for hint:', generator.constructor.name);
      
      const context: ClueContext = {
        targetCity: actualTargetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring,
        redHerringCity: undefined,
        rng: this.rng
      };
      
      const clue = await generator.generateClue(context);
      console.log('Generated hint clue result:', clue);
      
      if (clue) {
        console.log('Successfully generated hint with:', generator.constructor.name);
        return clue;
      } else {
        console.log('Generator failed, trying next one:', generator.constructor.name);
      }
    }
    
    console.warn('All generators failed to generate hint clue');
    return null;
  }

  async generateSingleClue(
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
    
    // Red herring logic - but NEVER for the final destination (stop 4)
    if (stopIndex === 4) {
      // Final destination - always true, never a red herring
      isRedHerring = false;
      actualTargetCity = targetCity;
    } else {
      // All other locations (0-3): normal red herring logic
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
      // Only get the next clue type if we haven't exceeded our limit
      if (this.finalDestinationClueIndex < this.finalDestinationClueTypes.length) {
        requiredClueType = this.getNextFinalDestinationClueType();
        availableGenerators = availableGenerators.filter(gen => {
          // Map constructor names to clue types
          const clueTypeMap: Record<string, string> = {
            'DirectionClue': 'direction',
            'AnagramClue': 'anagram', 
            'LandmarkImageClue': 'landmark-image',
            'CuisineImageClue': 'cuisine-image',
            'ArtImageClue': 'art-image',
            'FlagClue': 'flag',
            'ClimateClue': 'climate',
            'GeographyClue': 'geography',
            'WeirdFactsClue': 'weirdfacts'
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
      } else {
        // We've run out of final destination clue types, generate a random one
        console.warn('Ran out of predetermined final destination clue types, using random type');
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
    usedTypes: Set<string>,
    clueIndex: number,
    requiredClueType?: string
  ): Promise<ClueResult | null> {
    // For stops 0-3, we need exactly one clue of each type:
    // 1. Current location clue
    // 2. Final destination clue  
    // 3. Red herring clue
    
    // Determine the target city and red herring status based on clue index
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
        'LandmarkImageClue': 'landmark-image',
        'CuisineImageClue': 'cuisine-image',
        'ArtImageClue': 'art-image',
        'FlagClue': 'flag',
        'ClimateClue': 'climate',
        'GeographyClue': 'geography',
        'WeirdFactsClue': 'weirdfacts'
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


}