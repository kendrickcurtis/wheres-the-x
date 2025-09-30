import seedrandom from 'seedrandom';
import citiesData from './data/enhanced-cities.json';
import { ClueGeneratorOrchestrator } from './clues/ClueGenerator';

export interface City {
  name: string;
  lat: number;
  lng: number;
  country: string;
  population?: number;
  founded?: string;
  region?: string;
  landmarks?: string[];
  universities?: string[];
  industries?: string[];
  cuisine?: string[];
  culturalEvents?: string[];
  localTraditions?: string[];
  climate?: {
    type: string;
    juneTemp: number;
    decTemp: number;
    juneRainfall: number;
    decRainfall: number;
    rainfall: number;
  };
  geographicFeatures?: string[];
  geography?: {
    elevation: number;
    distanceToSea: number;
    nearestBodyOfWater: string;
    positionInCountry: string;
  };
}

// Import cities from external data file
const CITIES: City[] = citiesData as City[];

export interface Clue {
  id: string;
  text: string;
  type: 'text' | 'image' | 'direction' | 'anagram' | 'flag' | 'climate' | 'geography';
  imageUrl?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  isRedHerring?: boolean;
  targetCityName?: string;
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

export class PuzzleEngine {
  private rng: seedrandom.PRNG;
  private clueGenerator: ClueGeneratorOrchestrator;

  constructor(seed?: string) {
    // Use today's date as seed if none provided
    const dateSeed = seed || new Date().toISOString().split('T')[0];
    this.rng = seedrandom(dateSeed);
    this.clueGenerator = new ClueGeneratorOrchestrator(() => this.rng());
  }

      async generatePuzzle(): Promise<Location[]> {
        // Reset final destination clue types for new puzzle
        this.clueGenerator.resetFinalDestinationClueTypes();
        
        // Generate 5 locations: start + 3 stops + final
        const selectedCities = this.selectRandomCities(5);
        
        const locations: Location[] = [];
        
        for (let index = 0; index < selectedCities.length; index++) {
          const city = selectedCities[index];
          const clues = await this.generateCluesForLocation(city, selectedCities, index);
          
          locations.push({
            id: index,
            city,
            clues,
            isGuessed: index === 0, // Start location is automatically "guessed"
            isCorrect: index === 0 ? true : undefined // Start location is correct by default
          });
        }
        
        return locations;
      }

  private selectRandomCities(count: number): City[] {
    const shuffled = [...CITIES].sort(() => this.rng() - 0.5);
    return shuffled.slice(0, count);
  }

  private async generateCluesForLocation(
    targetCity: City, 
    allCities: City[], 
    locationIndex: number
  ): Promise<Clue[]> {
    const previousCity = locationIndex > 0 ? allCities[locationIndex - 1] : undefined;
    const finalCity = allCities[4]; // Final destination is always index 4
    
    const clueResults = await this.clueGenerator.generateCluesForLocation(
      targetCity,
      previousCity,
      finalCity,
      locationIndex,
      CITIES
    );
    
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
      generateStartCity(): City {
        const puzzle = this.generatePuzzle();
        return puzzle[0].city;
      }

      // Check if a guess is correct (within reasonable distance)
      checkGuess(location: Location, guessLat: number, guessLng: number): boolean {
        const distance = this.calculateDistance(
          location.city.lat, location.city.lng,
          guessLat, guessLng
        );
        // Consider correct if within 50km
        return distance <= 50;
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
    }
