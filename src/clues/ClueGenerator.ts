import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import { DirectionClue } from './DirectionClue';
import { AnagramClue } from './AnagramClue';
import { LandmarkImageClue } from './LandmarkImageClue';
import { CountryEmojiClue } from './CountryEmojiClue';
import { ArtImageClue } from './ArtImageClue';
import { FlagClue } from './FlagClue';
import { GeographyClue } from './GeographyClue';
import { ClimateClue } from './ClimateClue';
import { WeirdFactsClue } from './WeirdFactsClue';
import { PopulationClue } from './PopulationClue';

export class ClueGeneratorOrchestrator {
  private generators: ClueGenerator[];
  private rng: () => number;

  constructor(rng: () => number) {
    this.rng = rng;
    this.generators = [
      new DirectionClue(),
      new AnagramClue(),
      new LandmarkImageClue(),
      new CountryEmojiClue(),
      new ArtImageClue(),
      new FlagClue(),
      new ClimateClue(),
      new GeographyClue(),
      new WeirdFactsClue(),
      new PopulationClue()
    ];
    
    // Initialize red herring distribution for this puzzle
    this.initializeRedHerringDistribution();
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
   * Returns an array of clue types: [clue1, clue2, clue3, hint]
   */
  private getClueDistributionForStop(stopIndex: number): ('current' | 'final' | 'red-herring' | 'hint')[] {
    if (stopIndex === 4) {
      // Final stop: only 1 final clue
      return ['final'];
    }
    
    const hasRedHerring = this.shouldStopHaveRedHerring(stopIndex);
    
    if (hasRedHerring) {
      // With red herring: [current, final, red-herring, hint]
      return ['current', 'final', 'red-herring', 'hint'];
    } else {
      // Without red herring: [current, current, final, hint]
      return ['current', 'current', 'final', 'hint'];
    }
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
  ): ('direction' | 'anagram' | 'flag' | 'climate' | 'geography' | 'landmark-image' | 'country-emoji' | 'art-image' | 'weirdfacts' | 'population')[] {
    const allClueTypes: ('direction' | 'anagram' | 'flag' | 'climate' | 'geography' | 'landmark-image' | 'country-emoji' | 'art-image' | 'weirdfacts' | 'population')[] = ['direction', 'anagram', 'landmark-image', 'country-emoji', 'art-image', 'flag', 'climate', 'geography', 'weirdfacts', 'population'];
    const availableTypes: ('direction' | 'anagram' | 'flag' | 'climate' | 'geography' | 'landmark-image' | 'country-emoji' | 'art-image' | 'weirdfacts' | 'population')[] = [];
    
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
        'CountryEmojiClue': 'country-emoji',
        'ArtImageClue': 'art-image',
        'FlagClue': 'flag',
        'ClimateClue': 'climate',
        'GeographyClue': 'geography',
        'WeirdFactsClue': 'weirdfacts',
        'PopulationClue': 'population'
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
      } else if (clueType === 'hint') {
        // Hint clue - always about current location, never a red herring
        for (let j = 0; j < shuffledTypes.length; j++) {
          const typeToTry = shuffledTypes[(typeIndex + j) % shuffledTypes.length];
          if (!usedTypesInThisStop.has(typeToTry)) {
            clue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 0, typeToTry // Always current location (index 0)
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
        
        // Fallback: try any available clue type that hasn't been used yet
        const fallbackTypes = availableTypes.filter(type => !usedTypesInThisStop.has(type));
        if (fallbackTypes.length > 0) {
          const fallbackType = fallbackTypes[Math.floor(this.rng() * fallbackTypes.length)];
          console.log(`Trying fallback clue type: ${fallbackType}`);
          
          let fallbackClue: ClueResult | null = null;
          if (clueType === 'current') {
            fallbackClue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 0, fallbackType
            );
          } else if (clueType === 'final') {
            fallbackClue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 1, fallbackType
            );
          } else if (clueType === 'red-herring') {
            fallbackClue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 2, fallbackType
            );
          } else if (clueType === 'hint') {
            fallbackClue = await this.generateSingleClueWithTypeConstraint(
              targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
              new Set(), 0, fallbackType // Always current location
            );
          }
          
          if (fallbackClue) {
            usedTypesInThisStop.add(fallbackType);
            if (clueType === 'final') {
              usedFinalDestinationTypes.add(fallbackType);
            }
            clues.push(fallbackClue);
            console.log(`Successfully generated fallback clue with type: ${fallbackType}`);
          } else {
            console.error(`Fallback also failed for type: ${fallbackType}`);
          }
        } else {
          console.error(`No fallback types available for stop ${stopIndex}`);
        }
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
  // Uses the table-based system to ensure no duplicate clue types
  async generateHintClue(
    targetCity: { name: string; lat: number; lng: number; country: string },
    previousCity: { name: string; lat: number; lng: number; country: string } | undefined,
    finalCity: { name: string; lat: number; lng: number; country: string },
    stopIndex: number,
    difficulty: DifficultyLevel,
    allCities: { name: string; lat: number; lng: number; country: string }[],
    existingClues: ClueResult[] = []
  ): Promise<ClueResult | null> {
    console.log('Generating hint clue for:', targetCity.name, targetCity.country);
    
    // Get existing clue types to avoid duplicates
    const existingClueTypes = new Set(existingClues.map(clue => clue.type));
    console.log('Existing clue types:', Array.from(existingClueTypes));
    
    // Get available clue types for this city using the table-based system
    const availableTypes = this.getAvailableClueTypesForCity(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities);
    console.log('Available clue types for city:', availableTypes);
    
    // Filter out clue types that already exist
    const unusedTypes = availableTypes.filter(type => !existingClueTypes.has(type));
    console.log('Unused clue types for hint:', unusedTypes);
    
    if (unusedTypes.length === 0) {
      console.warn('No unused clue types available for hint');
      return null;
    }
    
    // Randomly select an unused clue type
    const selectedType = unusedTypes[Math.floor(this.rng() * unusedTypes.length)];
    console.log('Selected clue type for hint:', selectedType);
    
    // Generate a current location clue (never a red herring) using the table-based system
    const clue = await this.generateSingleClueWithTypeConstraint(
      targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
      new Set(), 0, selectedType
    );
    
    if (clue) {
      console.log('Successfully generated hint with type:', selectedType);
      return clue;
    } else {
      console.warn('Failed to generate hint with selected type:', selectedType);
      return null;
    }
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
        'CountryEmojiClue': 'country-emoji',
        'ArtImageClue': 'art-image',
        'FlagClue': 'flag',
        'ClimateClue': 'climate',
        'GeographyClue': 'geography',
        'WeirdFactsClue': 'weirdfacts',
        'PopulationClue': 'population'
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