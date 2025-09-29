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

export class PuzzleEngine {
  private rng: seedrandom.PRNG;

  constructor(seed?: string) {
    // Use today's date as seed if none provided
    const dateSeed = seed || new Date().toISOString().split('T')[0];
    this.rng = seedrandom(dateSeed);
  }

  generateStartCity(): City {
    const randomIndex = Math.floor(this.rng() * CITIES.length);
    return CITIES[randomIndex];
  }

  getClueForCity(city: City): string {
    // Simple clue based on city characteristics
    const clues = [
      `This city is the capital of ${city.country}`,
      `Known for its rich history and culture`,
      `A major European capital city`,
      `Famous for its architecture and landmarks`
    ];
    const clueIndex = Math.floor(this.rng() * clues.length);
    return clues[clueIndex];
  }
}
