import seedrandom from 'seedrandom';

export interface City {
  name: string;
  lat: number;
  lng: number;
  country: string;
}

// Simple European cities dataset for hello world
const CITIES: City[] = [
  { name: "Paris", lat: 48.8566, lng: 2.3522, country: "France" },
  { name: "London", lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
  { name: "Berlin", lat: 52.5200, lng: 13.4050, country: "Germany" },
  { name: "Rome", lat: 41.9028, lng: 12.4964, country: "Italy" },
  { name: "Madrid", lat: 40.4168, lng: -3.7038, country: "Spain" },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041, country: "Netherlands" },
  { name: "Vienna", lat: 48.2082, lng: 16.3738, country: "Austria" },
  { name: "Prague", lat: 50.0755, lng: 14.4378, country: "Czech Republic" },
  { name: "Warsaw", lat: 52.2297, lng: 21.0122, country: "Poland" },
  { name: "Stockholm", lat: 59.3293, lng: 18.0686, country: "Sweden" }
];

export interface Clue {
  id: string;
  text: string;
  type: 'text' | 'image' | 'direction' | 'anagram';
  imageUrl?: string;
}

export interface Location {
  id: number;
  city: City;
  clues: Clue[];
  isGuessed: boolean;
  guessPosition?: { lat: number; lng: number };
}

export class PuzzleEngine {
  private rng: seedrandom.PRNG;

  constructor(seed?: string) {
    // Use today's date as seed if none provided
    const dateSeed = seed || new Date().toISOString().split('T')[0];
    this.rng = seedrandom(dateSeed);
  }

  generatePuzzle(): Location[] {
    // Generate 5 locations: start + 3 stops + final
    const selectedCities = this.selectRandomCities(5);
    
    return selectedCities.map((city, index) => ({
      id: index,
      city,
      clues: this.getCluesForCity(city, index),
      isGuessed: false
    }));
  }

  private selectRandomCities(count: number): City[] {
    const shuffled = [...CITIES].sort(() => this.rng() - 0.5);
    return shuffled.slice(0, count);
  }

  getCluesForCity(city: City, locationIndex: number): Clue[] {
    if (locationIndex === 0) {
      // Start location - 1 clue
      return [{
        id: 'start-1',
        text: `This city is the capital of ${city.country}`,
        type: 'text'
      }];
    } else if (locationIndex === 4) {
      // Final destination - 1 clue
      return [{
        id: 'final-1',
        text: `This is the final destination in ${city.country}`,
        type: 'text'
      }];
    } else {
      // Middle stops - 3 clues with variety for testing
      const clueVariations = [
        [
          { text: `This city is in ${city.country}`, type: 'text' as const },
          { text: `Known for its local cuisine and culture`, type: 'text' as const },
          { text: `A historic European city with beautiful architecture`, type: 'text' as const }
        ],
        [
          { text: `Direction: Northeast from previous stop`, type: 'direction' as const },
          { text: `Famous for its museums and art galleries`, type: 'text' as const },
          { text: `Population: ~500,000 people`, type: 'text' as const }
        ],
        [
          { text: `Anagram: ${this.createAnagram(city.name)}`, type: 'anagram' as const },
          { text: `Known for its vibrant nightlife`, type: 'text' as const },
          { text: `Climate: Temperate with mild winters`, type: 'text' as const }
        ]
      ];
      
      const selectedVariation = clueVariations[locationIndex - 1] || clueVariations[0];
      
      return selectedVariation.map((clue, index) => ({
        id: `stop${locationIndex}-${index + 1}`,
        text: clue.text,
        type: clue.type
      }));
    }
  }

  private createAnagram(cityName: string): string {
    // Simple anagram creation for testing
    const letters = cityName.toLowerCase().split('').filter(c => c !== ' ');
    const shuffled = letters.sort(() => this.rng() - 0.5);
    return shuffled.join('').toUpperCase();
  }

  // Legacy method for backward compatibility
  generateStartCity(): City {
    const puzzle = this.generatePuzzle();
    return puzzle[0].city;
  }
}
