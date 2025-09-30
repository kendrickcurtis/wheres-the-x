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
    // Create a shuffled list of all clue types for final destination clues
    // We need 5 final destination clues: start (stop 0), stops 1-3, and final destination (stop 4)
    const allClueTypes = ['direction', 'anagram', 'image', 'flag', 'climate', 'geography'];
    let shuffledTypes = [...allClueTypes].sort(() => this.rng() - 0.5);
    
    // Take only the first 5 clue types
    this.finalDestinationClueTypes = shuffledTypes.slice(0, 5);
    
    // If any direction clues are in positions 1-3, move them to position 0 or 4
    for (let i = 1; i <= 3; i++) {
      if (this.finalDestinationClueTypes[i] === 'direction') {
        // Remove the direction clue from position i
        this.finalDestinationClueTypes.splice(i, 1);
        
        // Add it to either position 0 or 4
        const targetPosition = this.rng() < 0.5 ? 0 : 4;
        this.finalDestinationClueTypes.splice(targetPosition, 0, 'direction');
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
    
    // TEMPORARY: Force all clues to be images for testing
    if (stopIndex === 0 || stopIndex === 4) {
      // Start location or final destination - 1 image clue
      const clue = await this.generateImageClueWithFallback(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities);
      return clue ? [clue] : [];
    } else {
      // Middle stops - 3 image clues
      const clues: ClueResult[] = [];
      
      for (let i = 0; i < 3; i++) {
        const clue = await this.generateImageClueWithFallback(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities);
        
        if (clue) {
          clues.push(clue);
        } else {
          console.error(`Failed to generate image clue ${i + 1} for stop ${stopIndex}`);
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

  private async generateImageClueWithFallback(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    allCities: { name: string; lat: number; lng: number; country: string }[]
  ): Promise<ClueResult | null> {
    // Determine the target for this clue
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
    } else if (stopIndex === 4) {
      // Final destination
      actualTargetCity = finalCity;
      isRedHerring = false;
    } else {
      // Middle stops: random between current location, final destination, or red herring
      const clueType = this.rng();
      if (clueType < 0.33) {
        actualTargetCity = targetCity;
        isRedHerring = false;
      } else if (clueType < 0.66) {
        actualTargetCity = finalCity;
        isRedHerring = false;
      } else {
        redHerringCity = this.selectRedHerringCity(finalCity, stopIndex, allCities);
        actualTargetCity = redHerringCity;
        isRedHerring = true;
      }
    }

    // Try to generate an image clue with multiple landmark attempts
    const imageGenerator = this.generators.find(gen => gen.constructor.name === 'ImageClue');
    if (!imageGenerator) {
      return null;
    }

    // Get the enhanced city data to access landmarks
    const enhancedCity = allCities.find(city => 
      city.name === actualTargetCity.name && city.country === actualTargetCity.country
    );

    if (enhancedCity && (enhancedCity as any).landmarks) {
      const landmarks = (enhancedCity as any).landmarks;
      
      // Try up to 3 different landmarks
      const maxAttempts = Math.min(3, landmarks.length);
      const shuffledLandmarks = [...landmarks].sort(() => this.rng() - 0.5);
      
      for (let i = 0; i < maxAttempts; i++) {
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

        // Temporarily override the landmark for this attempt
        (context as any).forcedLandmark = shuffledLandmarks[i];
        
        const clue = await imageGenerator.generateClue(context);
        if (clue) {
          return clue;
        }
      }
    }

    // If all image attempts failed, fall back to a different clue type
    const availableGenerators = this.generators.filter(gen => gen.constructor.name !== 'ImageClue');
    if (availableGenerators.length > 0) {
      const fallbackGenerator = availableGenerators[Math.floor(this.rng() * availableGenerators.length)];
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
      
      return await fallbackGenerator.generateClue(context);
    }

    return null;
  }
}