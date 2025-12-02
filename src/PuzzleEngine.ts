import seedrandom from 'seedrandom';
import { initializeGlobalData, globalData } from './data/globalData';
import { ClueGeneratorOrchestrator } from './clues/ClueGenerator';
import type { ClueResult } from './clues/types';
import type { DifficultyLevel } from './components/DifficultySelector';
import { isFestivePuzzleDate, getFestivePuzzleConfig } from './utils/festivePuzzles';

export interface City {
  name: string;
  lat: number;
  lng: number;
  country: string;
  population?: number;
  founded?: string;
  region?: string;
  landmarks?: string[];
  cuisine?: string[];
  art?: string[];
  climate?: {
    type: string;
    juneTemp: number;
    decTemp: number;
    juneRainfall: number;
    decRainfall: number;
    rainfall: number;
  };
  geography?: {
    elevation: number;
    distanceToSea: number;
    nearestBodyOfWater: string;
    positionInCountry: string;
  };
  hiddenUntil?: string; // Date string (YYYY-MM-DD) - city is hidden until this date
}

// Cities will be loaded dynamically
let CITIES: City[] = [];
let ALL_CITIES: City[] = []; // Unfiltered list for route lookups

export interface Clue {
  id: string;
  text: string;
  type: 'landmark-image' | 'country-emoji' | 'art-image' | 'direction' | 'anagram' | 'flag' | 'geography' | 'weirdfacts' | 'population' | 'family' | 'family-image' | 'greeting' | 'festive-image' | 'festivefacts';
  imageUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isRedHerring: boolean;
  targetCityName: string;
}

export interface Location {
  id: number;
  city: City;
  clues: Clue[];
  isGuessed: boolean;
  guessPosition?: { lat: number; lng: number };
  isCorrect?: boolean;
  closestCity?: City | null; // The closest major city to the guess position (null if too far)
}

// Port connections for special long-distance travel
interface PortConnection {
  from: string; // City name
  to: string;   // City name
  maxDistance: number; // Maximum distance for this connection
}

export class PuzzleEngine {
  private rng: seedrandom.PRNG;
  private clueGenerator?: ClueGeneratorOrchestrator;
  private puzzleGenerated: boolean = false;
  private cachedPuzzle?: Location[];
  private puzzleGenerationPromise?: Promise<Location[]>;
  private difficulty: DifficultyLevel;
  private initialized: boolean = false;
  private seed: string; // Store the seed to check for festive puzzles
  
  // Special port connections that allow longer distances
  private static readonly PORT_CONNECTIONS: PortConnection[] = [
    { from: 'Dublin', to: 'Iceland', maxDistance: 1500 },
    { from: 'Faroe Islands', to: 'Iceland', maxDistance: 800 },
    { from: 'Copenhagen', to: 'Iceland', maxDistance: 1200 },
    { from: 'Copenhagen', to: 'Faroe Islands', maxDistance: 1000 },
    { from: 'Faroe Islands', to: 'Copenhagen', maxDistance: 1000 },
    { from: 'Edinburgh', to: 'Shetland Islands', maxDistance: 400 },
    { from: 'Shetland Islands', to: 'Edinburgh', maxDistance: 400 },
    { from: 'Liverpool', to: 'Iceland', maxDistance: 1400 },
    { from: 'Iceland', to: 'Liverpool', maxDistance: 1400 },
    { from: 'Athens', to: 'Nicosia', maxDistance: 800 },
    { from: 'Nicosia', to: 'Athens', maxDistance: 800 },
    { from: 'Heraklion', to: 'Nicosia', maxDistance: 600 },
    { from: 'Nicosia', to: 'Heraklion', maxDistance: 600 },
    { from: 'Stockholm', to: 'Oulu', maxDistance: 600 },
    { from: 'Oulu', to: 'Stockholm', maxDistance: 600 },
  ];

  constructor(seed?: string, difficulty: DifficultyLevel = 'MEDIUM') {
    // Use today's date as seed if none provided
    const dateSeed = seed || new Date().toISOString().split('T')[0];
    this.seed = dateSeed; // Store the date seed for festive puzzle detection
    
    console.log('🔍 [PuzzleEngine.constructor]', {
      seed,
      dateSeed,
      difficulty,
      isFestive: isFestivePuzzleDate(dateSeed)
    });
    
    // Add difficulty offset to create different puzzles for each difficulty
    // For festive puzzles, always use HARD difficulty scoring
    const isFestive = isFestivePuzzleDate(dateSeed);
    const effectiveDifficulty = isFestive ? 'HARD' : difficulty;
    const difficultyOffset = effectiveDifficulty === 'EASY' ? 1000 : effectiveDifficulty === 'HARD' ? 2000 : 0;
    const fullSeed = `${dateSeed}-${difficultyOffset}`;
    this.rng = seedrandom(fullSeed);
    this.difficulty = effectiveDifficulty; // Use HARD for festive puzzles
    // Don't create clueGenerator here - wait until data is initialized
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🔍 [PuzzleEngine.initialize] Already initialized, skipping');
      return;
    }
    
    try {
      // Initialize global data first
      await initializeGlobalData();
      ALL_CITIES = globalData.enhancedCities;
      
      // Filter out hidden cities based on puzzle date (seed)
      // For festive puzzles, use the puzzle date; otherwise use today
      const puzzleDate = this.seed || new Date().toISOString().split('T')[0];
      
      console.log('🔍 [PuzzleEngine.initialize] Filtering cities', {
        seed: this.seed,
        puzzleDate,
        allCitiesCount: ALL_CITIES.length,
        isFestive: isFestivePuzzleDate(puzzleDate)
      });
      
      CITIES = ALL_CITIES.filter(city => {
        if (city.hiddenUntil) {
          const isVisible = city.hiddenUntil <= puzzleDate;
          if (!isVisible) {
            console.log('[PuzzleEngine.initialize] Hiding city', city.name, 'until', city.hiddenUntil, 'puzzle date:', puzzleDate);
          }
          return isVisible;
        }
        return true;
      });
      
      console.log('[PuzzleEngine.initialize] Filtered cities count', CITIES.length);
      
      // Now create the clue generator after data is available
      this.clueGenerator = new ClueGeneratorOrchestrator(() => this.rng(), this.difficulty, this.seed);
      
      console.log('[PuzzleEngine.initialize] ClueGenerator created with date', this.seed);
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PuzzleEngine:', error);
      throw error;
    }
  }

      async generatePuzzle(): Promise<Location[]> {
        // Initialize if not already done
        await this.initialize();
        
        // Prevent multiple puzzle generations (React Strict Mode causes double invocation)
        if (this.puzzleGenerated) {
          return this.cachedPuzzle!;
        }
        
        // If puzzle generation is already in progress, wait for it
        if (this.puzzleGenerationPromise) {
          return this.puzzleGenerationPromise;
        }
        
        // Start puzzle generation and store the promise
        this.puzzleGenerationPromise = this.generatePuzzleInternal();
        const result = await this.puzzleGenerationPromise;
        return result;
      }
      
      private async generatePuzzleInternal(): Promise<Location[]> {
        // Create a fresh clue generator for each puzzle to avoid state conflicts
        this.clueGenerator = new ClueGeneratorOrchestrator(() => this.rng(), this.difficulty, this.seed);
        // Initialize the final destination clue types
        
        // Check if this is a festive puzzle
        let selectedCities: City[];
        if (isFestivePuzzleDate(this.seed)) {
          selectedCities = this.generateFestiveRoute(this.seed);
        } else {
        // Generate 5 locations: start + 3 stops + final
        const totalLocations = 5;
          selectedCities = this.selectRandomCities(totalLocations);
        }
        
        const locations: Location[] = [];
        const usedFinalDestinationTypes = new Set<string>();
        
        for (let index = 0; index < selectedCities.length; index++) {
          const city = selectedCities[index];
          const clues = await this.generateCluesForLocation(city, selectedCities, index, usedFinalDestinationTypes);
          
          locations.push({
            id: index,
            city,
            clues,
            isGuessed: index === 0, // Start location is automatically "guessed"
            isCorrect: index === 0 ? true : undefined // Start location is correct by default
          });
        }
        
        // Cache the puzzle and mark as generated
        this.cachedPuzzle = locations;
        this.puzzleGenerated = true;
        
        return locations;
      }

  private selectRandomCities(count: number): City[] {
    const maxDistanceKm = 500; // Maximum distance between consecutive stops
    const selectedCities: City[] = [];
    const usedCities = new Set<string>(); // Track used cities to prevent duplicates
    
    // Start with a random city
    const shuffled = [...CITIES].sort(() => this.rng() - 0.5);
    const startCity = shuffled[0];
    selectedCities.push(startCity);
    usedCities.add(`${startCity.name},${startCity.country}`);
    
    // Select remaining cities with distance constraints
    for (let i = 1; i < count; i++) {
      const previousCity = selectedCities[i - 1];
      const validCities = this.findCitiesWithinDistance(previousCity, maxDistanceKm, usedCities);
      
      if (validCities.length === 0) {
        // No valid cities within distance - this creates a "dead end"
        // For now, we'll select the closest available city regardless of distance
        // This maintains puzzle solvability while still preferring closer cities
        const availableCities = CITIES.filter(city => 
          !usedCities.has(`${city.name},${city.country}`)
        );
        
        if (availableCities.length === 0) {
          throw new Error('No more cities available for puzzle generation');
        }
        
        // Find the closest available city
        let closestCity = availableCities[0];
        let minDistance = this.calculateDistance(
          previousCity.lat, previousCity.lng,
          closestCity.lat, closestCity.lng
        );
        
        for (const city of availableCities) {
          const distance = this.calculateDistance(
            previousCity.lat, previousCity.lng,
            city.lat, city.lng
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCity = city;
          }
        }
        
        selectedCities.push(closestCity);
        usedCities.add(`${closestCity.name},${closestCity.country}`);
      } else {
        // Select a random city from the valid options
        const randomIndex = Math.floor(this.rng() * validCities.length);
        const selectedCity = validCities[randomIndex];
        selectedCities.push(selectedCity);
        usedCities.add(`${selectedCity.name},${selectedCity.country}`);
      }
    }
    
    return selectedCities;
  }

  /**
   * Generate a festive puzzle route starting and ending at specific cities
   */
  private generateFestiveRoute(date: string): City[] {
    const config = getFestivePuzzleConfig(date);
    if (!config) {
      // Fallback to normal route generation
      return this.selectRandomCities(5);
    }

    // If a full route is specified, use it directly
    // Look up in ALL_CITIES (unfiltered) since routes are explicitly specified
    if (config.route && config.route.length > 0) {
      const routeCities: City[] = [];
      for (const routeCity of config.route) {
        const city = ALL_CITIES.find(c => 
          c.name === routeCity.name && c.country === routeCity.country
        );
        if (!city) {
          throw new Error(`City in festive route not found: ${routeCity.name}, ${routeCity.country}`);
        }
        routeCities.push(city);
      }
      return routeCities;
    }

    // Otherwise, generate route automatically (legacy behavior)
    // Find the start city (Dully for all festive puzzles)
    const startCity = config.startCity ? CITIES.find(city => 
      city.name === config.startCity!.name && city.country === config.startCity!.country
    ) : null;

    // Find the final city
    const finalCity = CITIES.find(city => 
      city.name === config.finalCity.name && city.country === config.finalCity.country
    );

    if (!finalCity) {
      throw new Error(`Festive puzzle final city not found: ${config.finalCity.name}, ${config.finalCity.country}`);
    }

    if (!startCity) {
      throw new Error(`Festive puzzle start city not found: ${config.startCity?.name}, ${config.startCity?.country}`);
    }

    const maxDistanceKm = 500;
    const selectedCities: City[] = [];
    const usedCities = new Set<string>();
    
    // Set the start city (Dully)
    selectedCities[0] = startCity;
    usedCities.add(`${startCity.name},${startCity.country}`);
    
    // Set the final city
    selectedCities[4] = finalCity; // Final destination at index 4
    usedCities.add(`${finalCity.name},${finalCity.country}`);

    // Build the route forward from start to final
    // We need: start (index 0) + 3 stops (indices 1, 2, 3) + final (index 4)
    // For the last stop (index 3), we need to ensure it's within maxDistanceKm of the final city
    for (let i = 1; i <= 3; i++) {
      const previousCity = selectedCities[i - 1];
      
      // For the last stop (index 3), filter to cities that are within range of BOTH previous city AND final city
      let validCities: City[];
      if (i === 3) {
        // Last stop must be within range of both previous city and final city
        const citiesFromPrevious = this.findCitiesWithinDistance(previousCity, maxDistanceKm, usedCities);
        const citiesToFinal = this.findCitiesWithinDistance(finalCity, maxDistanceKm, usedCities);
        
        // Find intersection: cities that are within range of both
        const previousSet = new Set(citiesFromPrevious.map(c => `${c.name},${c.country}`));
        validCities = citiesToFinal.filter(c => previousSet.has(`${c.name},${c.country}`));
      } else {
        validCities = this.findCitiesWithinDistance(previousCity, maxDistanceKm, usedCities);
      }
      
      if (validCities.length === 0) {
        // Fallback: find closest available city
        const availableCities = CITIES.filter(city => 
          !usedCities.has(`${city.name},${city.country}`)
        );
        
        if (availableCities.length === 0) {
          throw new Error('No more cities available for festive puzzle generation');
        }
        
        let closestCity = availableCities[0];
        let minDistance = this.calculateDistance(
          previousCity.lat, previousCity.lng,
          closestCity.lat, closestCity.lng
        );
        
        // For last stop, also consider distance to final city
        if (i === 3) {
          const distanceToFinal = this.calculateDistance(
            finalCity.lat, finalCity.lng,
            closestCity.lat, closestCity.lng
          );
          minDistance = Math.max(minDistance, distanceToFinal);
        }
        
        for (const city of availableCities) {
          const distance = this.calculateDistance(
            previousCity.lat, previousCity.lng,
            city.lat, city.lng
          );
          
          // For last stop, also check distance to final
          let totalDistance = distance;
          if (i === 3) {
            const distanceToFinal = this.calculateDistance(
              finalCity.lat, finalCity.lng,
              city.lat, city.lng
            );
            totalDistance = Math.max(distance, distanceToFinal);
          }
          
          if (totalDistance < minDistance) {
            minDistance = totalDistance;
            closestCity = city;
          }
        }
        
        selectedCities[i] = closestCity;
        usedCities.add(`${closestCity.name},${closestCity.country}`);
      } else {
        // Select a random city from valid options
        const randomIndex = Math.floor(this.rng() * validCities.length);
        selectedCities[i] = validCities[randomIndex];
        usedCities.add(`${validCities[randomIndex].name},${validCities[randomIndex].country}`);
      }
    }
    
    return selectedCities;
  }
  
  private findCitiesWithinDistance(
    fromCity: City, 
    maxDistanceKm: number, 
    usedCities: Set<string>
  ): City[] {
    const standardCities = CITIES.filter(city => {
      // Skip if already used
      if (usedCities.has(`${city.name},${city.country}`)) {
        return false;
      }
      
      // Check standard distance constraint
      const distance = this.calculateDistance(
        fromCity.lat, fromCity.lng,
        city.lat, city.lng
      );
      
      return distance <= maxDistanceKm;
    });

    // Add port connection destinations if they exist
    const portDestinations = this.getPortConnectionDestinations(fromCity, usedCities);
    
    // Combine and deduplicate
    const allValidCities = [...standardCities];
    portDestinations.forEach(portCity => {
      if (!allValidCities.some(city => city.name === portCity.name && city.country === portCity.country)) {
        allValidCities.push(portCity);
      }
    });
    
    return allValidCities;
  }

  private getPortConnectionDestinations(fromCity: City, usedCities: Set<string>): City[] {
    const portDestinations: City[] = [];
    
    // Find all port connections from this city
    const connections = PuzzleEngine.PORT_CONNECTIONS.filter(conn => conn.from === fromCity.name);
    
    connections.forEach(connection => {
      // Find the destination city
      const destinationCity = CITIES.find(city => city.name === connection.to);
      if (!destinationCity) {
        return;
      }
      
      // Skip if already used
      if (usedCities.has(`${connection.to},${destinationCity.country}`)) {
        return;
      }
      
      // Check if it's within the port connection distance
      const distance = this.calculateDistance(
        fromCity.lat, fromCity.lng,
        destinationCity.lat, destinationCity.lng
      );
      
      if (distance <= connection.maxDistance) {
        portDestinations.push(destinationCity);
      }
    });
    
    return portDestinations;
  }

  private   async generateCluesForLocation(
    targetCity: City, 
    allCities: City[], 
    locationIndex: number,
    usedFinalDestinationTypes: Set<string> = new Set()
  ): Promise<Clue[]> {
    const previousCity = locationIndex > 0 ? allCities[locationIndex - 1] : undefined;
    const finalCity = allCities[allCities.length - 1]; // Final destination is always the last city
    
    console.log('🔍 [PuzzleEngine.generateCluesForLocation] CALLED', {
      timestamp: new Date().toISOString(),
      targetCity: targetCity.name,
      locationIndex,
      puzzleDate: this.seed
    });
    
    const clueResults = await this.clueGenerator!.generateCluesForLocation(
      targetCity,
      previousCity,
      finalCity,
      locationIndex,
      CITIES,
      usedFinalDestinationTypes
    );
    
    console.log('🔍 [PuzzleEngine.generateCluesForLocation] RETURNED', {
      targetCity: targetCity.name,
      locationIndex,
      cluesCount: clueResults.length,
      clueTypes: clueResults.map(c => c.type),
      puzzleDate: this.seed
    });
    
    // Convert ClueResult to Clue format
    return clueResults.map(result => ({
      id: result.id,
      text: result.text,
      type: result.type,
      imageUrl: result.imageUrl,
      difficulty: result.difficulty,
      isRedHerring: result.isRedHerring,
      targetCityName: result.targetCityName
    }));
  }

      // Legacy method for backward compatibility
      async generateStartCity(): Promise<City> {
        const puzzle = await this.generatePuzzle();
        return puzzle[0].city;
      }

      // Calculate score based on difficulty and correct guesses
      calculateScore(locations: Location[]): number {
        let score = 0;
        
        // Score based on difficulty and stop position
        for (let i = 0; i < locations.length; i++) {
          if (locations[i].isCorrect) {
            if (i === 0) {
              // Start location: 0 points for all difficulties
              score += 0;
            } else if (i === locations.length - 1) {
              // Final location: different points based on difficulty
              switch (this.difficulty) {
                case 'EASY':
                  score += 5; // Final stop = 5 points
                  break;
                case 'MEDIUM':
                  score += 8; // Final stop = 8 points
                  break;
                case 'HARD':
                  score += 10; // Final stop = 10 points (double easy)
                  break;
              }
            } else {
              // Middle stops: different points based on difficulty
              const stopNumber = i; // Stop 1, 2, 3
              switch (this.difficulty) {
                case 'EASY':
                  score += stopNumber; // Stop 1 = 1, Stop 2 = 2, Stop 3 = 3
                  break;
                case 'MEDIUM':
                  score += stopNumber + 1; // Stop 1 = 2, Stop 2 = 3, Stop 3 = 4
                  break;
                case 'HARD':
                  score += stopNumber * 2; // Stop 1 = 2, Stop 2 = 4, Stop 3 = 6 (double easy)
                  break;
              }
            }
          }
        }
        
        // TODO: Subtract 1 point for each hint used (this needs to be tracked)
        // For now, just return the base score
        
        return score;
      }

      getDifficulty(): DifficultyLevel {
        return this.difficulty;
      }

  // Get port connections for UI display
  static getPortConnections(): PortConnection[] {
    return [...PuzzleEngine.PORT_CONNECTIONS];
  }

  // Debug method to force a specific route for testing
  async generateTestRoute(startCityName: string, routeCityNames: string[]): Promise<Location[]> {
    console.log(`🔍 DEBUG: Generating test route starting from ${startCityName}`);
    
    const startCity = CITIES.find(city => city.name === startCityName);
    if (!startCity) {
      throw new Error(`Start city "${startCityName}" not found`);
    }

    const routeCities: City[] = [startCity];
    
    for (const cityName of routeCityNames) {
      const city = CITIES.find(c => c.name === cityName);
      if (!city) {
        throw new Error(`City "${cityName}" not found`);
      }
      routeCities.push(city);
    }

    console.log(`🔍 DEBUG: Test route cities:`, routeCities.map(c => c.name));

    // Generate clues for each location
    const locations: Location[] = [];
    for (let i = 0; i < routeCities.length; i++) {
      const city = routeCities[i];
      const clues = await this.generateCluesForLocation(city, routeCities, i);
      
      locations.push({
        id: i,
        city: city,
        clues: clues,
        isGuessed: false
      });
    }

    return locations;
  }

      // Check if a guess is correct (within 50 miles AND closer to correct city than any other)
      checkGuess(location: Location, guessLat: number, guessLng: number): boolean {
        const distanceToCorrect = this.calculateDistance(
          location.city.lat, location.city.lng,
          guessLat, guessLng
        );
        
        // Must be within 50 miles (80.5 km)
        if (distanceToCorrect > 80.5) {
          return false;
        }
        
        // Must be closer to the correct city than any other city in the database
        for (const city of CITIES) {
          if (city.name === location.city.name && city.country === location.city.country) {
            continue; // Skip the correct city itself
          }
          
          const distanceToOther = this.calculateDistance(
            city.lat, city.lng,
            guessLat, guessLng
          );
          
          // If closer to another city, it's wrong
          if (distanceToOther < distanceToCorrect) {
            return false;
          }
        }
        
        return true;
      }

      // Calculate distance between two points in kilometers
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

      // Generate a random position away from the actual city
      generateRandomPinPosition(actualLat: number, actualLng: number): { lat: number; lng: number } {
        // Generate a position 100-500km away in a random direction
        const distance = 100 + (this.rng() * 400); // 100-500km
        const bearing = this.rng() * 360; // Random direction
        
        const lat1 = this.deg2rad(actualLat);
        const lng1 = this.deg2rad(actualLng);
        const d = distance / 6371; // Convert to radians
        
        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(d) +
          Math.cos(lat1) * Math.sin(d) * Math.cos(this.deg2rad(bearing))
        );
        
        const lng2 = lng1 + Math.atan2(
          Math.sin(this.deg2rad(bearing)) * Math.sin(d) * Math.cos(lat1),
          Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
        );
        
        return {
          lat: this.rad2deg(lat2),
          lng: this.rad2deg(lng2)
        };
      }

      private rad2deg(rad: number): number {
        return rad * (180/Math.PI);
      }

      // Find the closest major city to a given coordinate
      findClosestCity(lat: number, lng: number): City | null {
        // Guard: return null if CITIES is not initialized or empty
        if (!CITIES || CITIES.length === 0) {
          return null;
        }

        let closestCity = CITIES[0];
        let minDistance = this.calculateDistance(lat, lng, closestCity.lat, closestCity.lng);

        for (const city of CITIES) {
          const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
          if (distance < minDistance) {
            minDistance = distance;
            closestCity = city;
          }
        }

      // If closest city is more than 50 miles (80.5 km) away, return null
      const maxDistanceKm = 80.5; // 50 miles in kilometers
      return minDistance <= maxDistanceKm ? closestCity : null;
    }

    // Generate a hint clue for the current location (always a true clue, never a red herring)
    async generateHintClue(currentLocationIndex: number, allLocations: Location[]): Promise<Clue | null> {
      if (currentLocationIndex < 1 || currentLocationIndex > 3) {
        return null; // Only allow hints for stops 1-3
      }

      const currentLocation = allLocations[currentLocationIndex];
      const previousLocation = currentLocationIndex > 0 ? allLocations[currentLocationIndex - 1] : undefined;
      const finalLocation = allLocations[4]; // Final destination is always index 4
      
      // Generate a true clue (never a red herring) for the current location
      const difficulty = this.getDifficultyForStop(currentLocationIndex);
      
      // Convert existing clues to ClueResult format for duplicate checking
      const existingClueResults: ClueResult[] = currentLocation.clues.map(clue => ({
        id: clue.id,
        text: clue.text,
        type: clue.type,
        difficulty: difficulty,
        isRedHerring: false, // We don't track this in Clue format, but hints are never red herrings
        targetCityName: clue.targetCityName || currentLocation.city.name
      }));
      
      const clueResult = await this.clueGenerator!.generateHintClue(
        currentLocation.city,
        previousLocation?.city,
        finalLocation.city,
        currentLocationIndex,
        difficulty,
        CITIES,
        existingClueResults
      );

      if (!clueResult) {
        return null;
      }

      // Convert ClueResult to Clue format
      return {
        id: clueResult.id,
        text: clueResult.text,
        type: clueResult.type as any,
        imageUrl: clueResult.imageUrl,
        difficulty: clueResult.difficulty,
        isRedHerring: false, // Hint clues are always true
        targetCityName: clueResult.targetCityName
      };
    }

    private getDifficultyForStop(stopIndex: number): 'EASY' | 'MEDIUM' | 'HARD' {
      switch (stopIndex) {
        case 0:
        case 1:
          return 'EASY';
        case 2:
          return 'MEDIUM';
        case 3:
        case 4:
          return 'HARD';
        default:
          return 'MEDIUM';
      }
    }
  }
