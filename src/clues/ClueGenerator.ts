import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import { DirectionClue } from './DirectionClue.tsx';
import { AnagramClue } from './AnagramClue.tsx';
import { LandmarkImageClue } from './LandmarkImageClue';
import { CountryEmojiClue } from './CountryEmojiClue.tsx';
import { ArtImageClue } from './ArtImageClue';
import { FlagClue } from './FlagClue.tsx';
import { GeographyClue } from './GeographyClue.tsx';
// import { ClimateClue } from './ClimateClue';
import { WeirdFactsClue } from './WeirdFactsClue.tsx';
import { PopulationClue } from './PopulationClue.tsx';
import { FamilyClue } from './FamilyClue.tsx';
import { FamilyImageClue } from './FamilyImageClue.tsx';
import { GreetingClue } from './GreetingClue.tsx';
import { FestiveFactsClue } from './FestiveFactsClue.tsx';
import { FestiveImageClue } from './FestiveImageClue.ts';
import { isFestivePuzzleDate } from '../utils/festivePuzzles';
// import { globalData } from '../data/globalData';

export class ClueGeneratorOrchestrator {
  private generators: ClueGenerator[];
  private rng: () => number;
  private difficulty: DifficultyLevel;
  private date?: string;

  constructor(rng: () => number, difficulty: DifficultyLevel = 'MEDIUM', date?: string) {
    this.rng = rng;
    this.difficulty = difficulty;
    // Extract clean date if seed includes offset (e.g., "2025-12-03-3000" -> "2025-12-03")
    this.date = date ? date.split('-').slice(0, 3).join('-') : undefined;
    
    console.log('🔍 [ClueGeneratorOrchestrator.constructor]', {
      difficulty,
      date,
      isFestive: date ? isFestivePuzzleDate(date) : false
    });
    
    // Filter generators based on difficulty
    this.generators = this.getGeneratorsForDifficulty(difficulty);
    
    // Initialize red herring distribution for this puzzle
    this.initializeRedHerringDistribution();
  }

  private getGeneratorsForDifficulty(difficulty: DifficultyLevel): ClueGenerator[] {
    console.log('🔍 [ClueGenerator.getGeneratorsForDifficulty] Called with difficulty:', difficulty);
    
    const allGenerators = [
      // Phase 1 - Festive clues (highest priority when available)
      new FestiveFactsClue(),
      new FestiveImageClue(),
      // Phase 2 - Simple clues
      new AnagramClue(),
      new CountryEmojiClue(),
      new FlagClue(),
      new PopulationClue(),
      // Phase 3 - Visual clues
      new GeographyClue(),
      new GreetingClue(),
      // Phase 4 - Interactive clues
      new WeirdFactsClue(),
      new LandmarkImageClue(),
      new ArtImageClue(),
      // Phase 5 - Remaining clues
      new DirectionClue(),
      new FamilyClue(),
      new FamilyImageClue(),
      // new ClimateClue(), // Commented out - too difficult for players
    ];
    
    console.log('🔍 [ClueGenerator.getGeneratorsForDifficulty] Created allGenerators, FamilyImageClue included:', 
      allGenerators.some(g => g.constructor.name === 'FamilyImageClue'));
    
    let filteredGenerators: ClueGenerator[];
    
    switch (difficulty) {
      case 'EASY':
        // Easy clues: direction, country emoji, flag, anagram, family, family-image, geography, greeting
        filteredGenerators = allGenerators.filter(gen =>
          gen.constructor.name === 'DirectionClue' ||
          gen.constructor.name === 'CountryEmojiClue' ||
          gen.constructor.name === 'FlagClue' ||
          gen.constructor.name === 'AnagramClue' ||
          gen.constructor.name === 'FamilyClue' ||
          gen.constructor.name === 'FamilyImageClue' ||
          gen.constructor.name === 'GeographyClue' ||
          gen.constructor.name === 'GreetingClue'
        );
        break;
      case 'MEDIUM':
        // Medium clues: direction, country emoji, flag, anagram, landmark image, family, family-image, geography, greeting
        filteredGenerators = allGenerators.filter(gen =>
          gen.constructor.name === 'DirectionClue' ||
          gen.constructor.name === 'CountryEmojiClue' ||
          gen.constructor.name === 'FlagClue' ||
          gen.constructor.name === 'AnagramClue' ||
          gen.constructor.name === 'LandmarkImageClue' ||
          gen.constructor.name === 'FamilyClue' ||
          gen.constructor.name === 'FamilyImageClue' ||
          gen.constructor.name === 'GeographyClue' ||
          gen.constructor.name === 'GreetingClue'
        );
        break;
      case 'HARD':
      case 'FESTIVE': // FESTIVE uses HARD difficulty for clue generation
        // Hard clues: all available clues except easy ones like flag
        filteredGenerators = allGenerators.filter(gen =>
          gen.constructor.name !== 'FlagClue'
        );
        break;
      default:
        filteredGenerators = allGenerators;
    }
    
    console.log('🔍 [ClueGenerator.getGeneratorsForDifficulty] Filtered generators for', difficulty, ':', 
      filteredGenerators.map(g => g.constructor.name),
      'FamilyImageClue included:', filteredGenerators.some(g => g.constructor.name === 'FamilyImageClue'));
    
    return filteredGenerators;
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
    console.log('🔍 [ClueGenerator.generateCluesForLocation] CALLED', {
      timestamp: new Date().toISOString(),
      targetCity: targetCity.name,
      previousCity: previousCity?.name,
      finalCity: finalCity.name,
      stopIndex,
      date: this.date
    });
    
    const difficulty = this.getDifficultyForStop(stopIndex);
    
    console.log('🔍 [ClueGenerator.generateCluesForLocation] Difficulty determined', {
      difficulty,
      stopIndex
    });
    
    // All stops (0-4) use table-based generation
    const clues = await this.generateCluesForStopFromTable(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, usedFinalDestinationTypes);
    
    console.log('🔍 [ClueGenerator.generateCluesForLocation] RETURNING', {
      targetCity: targetCity.name,
      stopIndex,
      cluesCount: clues.length,
      clueTypes: clues.map(c => c.type),
      date: this.date
    });
    
    return clues;
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
  ): ('direction' | 'anagram' | 'flag' | 'geography' | 'landmark-image' | 'country-emoji' | 'art-image' | 'weirdfacts' | 'population' | 'family' | 'family-image' | 'greeting')[] {
    console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] START', {
      city: targetCity.name,
      stopIndex,
      difficulty,
      date: this.date,
      generatorsCount: this.generators.length,
      generatorNames: this.generators.map(g => g.constructor.name)
    });
    
    const allClueTypes: ('direction' | 'anagram' | 'flag' | 'geography' | 'landmark-image' | 'country-emoji' | 'art-image' | 'weirdfacts' | 'population' | 'family' | 'family-image' | 'greeting')[] = ['direction', 'anagram', 'landmark-image', 'country-emoji', 'art-image', 'flag', 'geography', 'weirdfacts', 'population', 'family', 'family-image', 'greeting'];
    const availableTypes: ('direction' | 'anagram' | 'flag' | 'geography' | 'landmark-image' | 'country-emoji' | 'art-image' | 'weirdfacts' | 'population' | 'family' | 'family-image' | 'greeting')[] = [];
    
    for (const clueType of allClueTypes) {
      console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] Checking clue type', clueType, 'for', targetCity.name);
      // Check if any generator can generate this clue type for this city
      const context: ClueContext = {
        targetCity,
        previousCity,
        finalCity,
        stopIndex,
        difficulty,
        isRedHerring: false,
        redHerringCity: undefined,
        rng: this.rng,
        date: this.date
      };
      
      if (clueType === 'family-image') {
        console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] Checking family-image for', targetCity.name, {
          date: this.date,
          stopIndex,
          contextDate: context.date
        });
      }
      
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
        'PopulationClue': 'population',
        'FamilyClue': 'family',
        'FamilyImageClue': 'family-image',
        'GreetingClue': 'greeting'
      };
      
      const canGenerate = this.generators.some(gen => {
        const genClueType = clueTypeMap[gen.constructor.name] || gen.constructor.name.toLowerCase();
        const matchesType = genClueType === clueType;
        
        if (matchesType) {
          console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] Checking generator', {
            clueType,
            generatorName: gen.constructor.name,
            genClueType,
            city: targetCity.name,
            stopIndex,
            date: context.date
          });
          
          if (clueType === 'family-image') {
            console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] About to call FamilyImageClue.canGenerate');
          }
          
          const canGen = gen.canGenerate(context);
          
          if (clueType === 'family-image') {
            console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] FamilyImageClue.canGenerate returned', {
              canGen,
              city: targetCity.name,
              date: context.date,
              stopIndex
            });
          }
          
          return canGen;
        }
        
        return false;
      });
      
      if (canGenerate) {
        availableTypes.push(clueType);
        if (clueType === 'family-image') {
          console.log('🔍 [ClueGenerator.getAvailableClueTypesForCity] family-image ADDED to available types for', targetCity.name);
        }
      } else if (clueType === 'family-image') {
        console.warn('🔍 [ClueGenerator.getAvailableClueTypesForCity] family-image NOT added - canGenerate returned false for', targetCity.name);
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
    console.log('🔍 [ClueGenerator.generateCluesForStopFromTable] CALLED', {
      timestamp: new Date().toISOString(),
      targetCity: targetCity.name,
      stopIndex,
      difficulty,
      date: this.date
    });
    
    const clues: ClueResult[] = [];
    const distribution = this.getClueDistributionForStop(stopIndex);
    
    console.log('🔍 [ClueGenerator.generateCluesForStopFromTable] Distribution', {
      distribution,
      stopIndex
    });
    
    // Get available clue types for this city
    const availableTypes = this.getAvailableClueTypesForCity(targetCity, previousCity, finalCity, stopIndex, difficulty, allCities);
    
    console.log('🔍 [ClueGenerator.generateCluesForStopFromTable] Got available types', {
      availableTypes,
      targetCity: targetCity.name
    });
    
    console.log('🔍 [ClueGenerator.generateCluesForStopFromTable] Available types', {
      city: targetCity.name,
      stopIndex,
      availableTypes,
      hasFamilyImage: availableTypes.includes('family-image'),
      date: this.date
    });
    
    // TEMPORARY: Force family-image clues to always appear if available
    let forcedTypes = [...availableTypes];
    if (availableTypes.includes('family-image')) {
      // Put family-image at the front to force it to be selected first
      forcedTypes = ['family-image', ...availableTypes.filter(type => type !== 'family-image')];
      console.log('[ClueGenerator] Forced family-image to front', forcedTypes);
    }
    
    const shuffledTypes = [...forcedTypes].sort(() => this.rng() - 0.5);
    let typeIndex = 0;
    
    // Track used clue types within this stop to ensure uniqueness
    const usedTypesInThisStop = new Set<string>();
    
    // Generate each clue according to the distribution
    for (let i = 0; i < distribution.length; i++) {
      const clueType = distribution[i];
      let clue: ClueResult | null = null;
      
      if (clueType === 'current') {
        // Current location clue - try available types in order, avoiding already used types
        // TEMPORARY: Always try family-image first if available
        if (availableTypes.includes('family-image') && !usedTypesInThisStop.has('family-image')) {
          console.log('🔍 [ClueGenerator] Attempting to generate family-image clue (current type) for', targetCity.name, 'at stop', stopIndex);
          clue = await this.generateSingleClueWithTypeConstraint(
            targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
            new Set(), 0, 'family-image'
          );
          if (clue) {
            usedTypesInThisStop.add('family-image');
            console.log('🔍 [ClueGenerator] family-image clue generated successfully (current type):', clue.id);
          } else {
            console.warn('🔍 [ClueGenerator] family-image clue generation FAILED (current type) for', targetCity.name);
          }
        }
        
        // If family-image didn't work or wasn't available, try other types
        if (!clue) {
          console.log('🔍 [ClueGenerator] family-image not available or failed, trying other types:', shuffledTypes);
          for (let j = 0; j < shuffledTypes.length; j++) {
            const typeToTry = shuffledTypes[(typeIndex + j) % shuffledTypes.length];
            if (!usedTypesInThisStop.has(typeToTry)) {
              if (typeToTry === 'family-image') {
                console.log('🔍 [ClueGenerator] Trying family-image as fallback for', targetCity.name);
              }
              clue = await this.generateSingleClueWithTypeConstraint(
                targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
                new Set(), 0, typeToTry
              );
              if (clue) {
                usedTypesInThisStop.add(typeToTry);
                if (typeToTry === 'family-image') {
                  console.log('🔍 [ClueGenerator] family-image clue generated as fallback:', clue.id);
                }
                break;
              } else if (typeToTry === 'family-image') {
                console.warn('🔍 [ClueGenerator] family-image clue generation FAILED as fallback for', targetCity.name);
              }
            }
          }
        }
        typeIndex++;
      } else if (clueType === 'final') {
        // Final destination clue - try available types in order, avoiding already used types
        // TEMPORARY: Always try family-image first if available
        if (availableTypes.includes('family-image') && !usedTypesInThisStop.has('family-image') && !usedFinalDestinationTypes.has('family-image')) {
          clue = await this.generateSingleClueWithTypeConstraint(
            targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
            new Set(), 1, 'family-image'
          );
          if (clue) {
            usedTypesInThisStop.add('family-image');
            usedFinalDestinationTypes.add('family-image');
          }
        }
        
        // If family-image didn't work or wasn't available, try other types
        if (!clue) {
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
        }
        typeIndex++;
      } else if (clueType === 'red-herring') {
        // Red herring clue - try available types in order, avoiding already used types
        // TEMPORARY: Always try family-image first if available
        if (availableTypes.includes('family-image') && !usedTypesInThisStop.has('family-image')) {
          clue = await this.generateSingleClueWithTypeConstraint(
            targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
            new Set(), 2, 'family-image'
          );
          if (clue) {
            usedTypesInThisStop.add('family-image');
          }
        }
        
        // If family-image didn't work or wasn't available, try other types
        if (!clue) {
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
        }
        typeIndex++;
      } else if (clueType === 'hint') {
        // Hint clue - always about current location, never a red herring
        // TEMPORARY: Always try family-image first if available
        if (availableTypes.includes('family-image') && !usedTypesInThisStop.has('family-image')) {
          clue = await this.generateSingleClueWithTypeConstraint(
            targetCity, previousCity, finalCity, stopIndex, difficulty, allCities, 
            new Set(), 0, 'family-image' // Always current location (index 0)
          );
          if (clue) {
            usedTypesInThisStop.add('family-image');
          }
        }
        
        // If family-image didn't work or wasn't available, try other types
        if (!clue) {
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
        }
        typeIndex++;
      }
      
      if (clue) {
        clues.push(clue);
        console.log('🔍 [ClueGenerator.generateCluesForStopFromTable] ✅✅✅ CLUE GENERATED AND ADDED', {
          timestamp: new Date().toISOString(),
          clueType: clue.type,
          clueId: clue.id,
          city: targetCity.name,
          stopIndex,
          totalClues: clues.length,
          date: this.date
        });
      } else {
        console.error('🔍 [ClueGenerator.generateCluesForStopFromTable] ❌❌❌ FAILED to generate any clue', {
          stopIndex,
          clueType,
          city: targetCity.name,
          date: this.date
        });
        
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
    
    // Shuffle only the first 3 clues, keep the hint clue (4th) at the end
    if (clues.length === 4) {
      const firstThreeClues = clues.slice(0, 3);
      const hintClue = clues[3];
      const shuffledFirstThree = [...firstThreeClues].sort(() => this.rng() - 0.5);
      return [...shuffledFirstThree, hintClue];
    } else {
      // For other cases (like final stop with 1 clue), shuffle normally
      const shuffledClues = [...clues].sort(() => this.rng() - 0.5);
      return shuffledClues;
    }
  }

  private getDifficultyForStop(_stopIndex: number): DifficultyLevel {
    // Normalize FESTIVE to HARD for clue generation - all clue types treat FESTIVE as HARD
    return this.difficulty === 'FESTIVE' ? 'HARD' : this.difficulty;
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
        rng: this.rng,
        date: this.date
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
        // 'ClimateClue': 'climate', // Commented out - too difficult for players
        'GeographyClue': 'geography',
        'WeirdFactsClue': 'weirdfacts',
        'PopulationClue': 'population',
        'FamilyClue': 'family',
        'FamilyImageClue': 'family-image',
        'GreetingClue': 'greeting',
        'FestiveFactsClue': 'festivefacts',
        'FestiveImageClue': 'festive-image'
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
    
    // Prioritize clues for festive puzzles
    // 1. Family-image clues (especially for Dully in festive puzzles)
    // 2. Festive clues (FestiveFactsClue, FestiveImageClue)
    // 3. Other available clues
    const isFestive = this.date && isFestivePuzzleDate(this.date);
    const isDully = actualTargetCity.name.toLowerCase() === 'dully';
    
    console.log('🔍 [ClueGenerator.generateSingleClueWithTypeConstraint] Prioritization', {
      city: actualTargetCity.name,
      isDully,
      isFestive,
      date: this.date,
      stopIndex,
      availableGeneratorsCount: availableGenerators.length,
      availableGeneratorNames: availableGenerators.map(g => g.constructor.name)
    });
    
    let generatorsToUse = availableGenerators;
    if (isFestive) {
      // For festive puzzles, prioritize family-image (especially for Dully)
      const familyImageGenerators = availableGenerators.filter(gen => 
        gen.constructor.name === 'FamilyImageClue'
      );
      const festiveGenerators = availableGenerators.filter(gen => 
        gen.constructor.name === 'FestiveFactsClue' || gen.constructor.name === 'FestiveImageClue'
      );
      
      console.log('[ClueGenerator] Festive puzzle generator selection', {
        familyImageCount: familyImageGenerators.length,
        festiveCount: festiveGenerators.length,
        isDully
      });
      
      if (isDully && familyImageGenerators.length > 0) {
        // For Dully in festive puzzles, always use family-image if available
        generatorsToUse = familyImageGenerators;
        console.log('[ClueGenerator] Using family-image for Dully');
      } else if (familyImageGenerators.length > 0) {
        // For other cities, prioritize family-image over festive clues
        generatorsToUse = [...familyImageGenerators, ...festiveGenerators.filter(gen => 
          !familyImageGenerators.includes(gen)
        )];
        console.log('[ClueGenerator] Prioritizing family-image for other cities');
      } else if (festiveGenerators.length > 0) {
        generatorsToUse = festiveGenerators;
        console.log('[ClueGenerator] Using festive generators');
      }
    } else {
      // For non-festive puzzles, prioritize festive clues if available (shouldn't happen, but safe)
      const festiveGenerators = availableGenerators.filter(gen => 
        gen.constructor.name === 'FestiveFactsClue' || gen.constructor.name === 'FestiveImageClue'
      );
      if (festiveGenerators.length > 0) {
        generatorsToUse = festiveGenerators;
      }
    }
    
    console.log('[ClueGenerator] Final generator selection', {
      generatorsToUseCount: generatorsToUse.length,
      generatorNames: generatorsToUse.map(g => g.constructor.name)
    });
    
    // Select a random generator from available ones
    const generator = generatorsToUse[Math.floor(this.rng() * generatorsToUse.length)];
    console.log('[ClueGenerator] Selected generator', generator.constructor.name);
    
    const context: ClueContext = {
      targetCity: actualTargetCity,
      previousCity,
      finalCity,
      stopIndex,
      difficulty,
      isRedHerring,
      redHerringCity,
      rng: this.rng,
      date: this.date
    };
    
    console.log('🔍 [ClueGenerator.generateSingleClueWithTypeConstraint] About to call generateClue', {
      generatorName: generator.constructor.name,
      city: actualTargetCity.name,
      stopIndex,
      date: context.date,
      requiredType: requiredClueType
    });
    
    const clue = await generator.generateClue(context);
    
    console.log('🔍 [ClueGenerator.generateSingleClueWithTypeConstraint] Generator returned', {
      generatorName: generator.constructor.name,
      hasClue: !!clue,
      clueType: clue?.type,
      clueId: clue?.id,
      imageUrl: clue?.imageUrl,
      city: actualTargetCity.name
    });
    
    return clue;
  }
}

// Registry of clue generators for rendering
export const clueGenerators: Record<string, ClueGenerator> = {
  'flag': new FlagClue(),
  'anagram': new AnagramClue(),
  'country-emoji': new CountryEmojiClue(),
  'population': new PopulationClue(),
  'geography': new GeographyClue(),
  'greeting': new GreetingClue(),
  'weirdfacts': new WeirdFactsClue(),
  'landmark-image': new LandmarkImageClue(),
  'art-image': new ArtImageClue(),
  'direction': new DirectionClue(),
  'family': new FamilyClue(),
  'family-image': new FamilyImageClue(),
  'festive-image': new FestiveImageClue(),
  'festivefacts': new FestiveFactsClue()
};