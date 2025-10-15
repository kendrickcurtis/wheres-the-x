// Data service to load JSON files from public folder
class DataService {
  private static cache = new Map<string, any>();
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadAllData();
    await this.initPromise;
    this.initialized = true;
  }

  private static async loadAllData(): Promise<void> {
    const dataFiles = [
      'enhanced-cities.json',
      'country-emojis.json', 
      'country-populations.json',
      'country-hello.json',
      'weirdfacts.json',
      'city-art.json',
      'city-landmarks.json',
      'country-sports.json'
    ];

    const promises = dataFiles.map(async (filename) => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${filename}: ${response.statusText}`);
        }
        const data = await response.json();
        this.cache.set(filename, data);
        console.log(`Loaded ${filename}`);
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
  }

  static async loadData<T>(filename: string): Promise<T> {
    await this.initialize();
    return this.cache.get(filename);
  }

  // Convenience methods for specific data files
  static async getEnhancedCities() {
    return this.loadData('enhanced-cities.json');
  }

  static async getCountryEmojis() {
    return this.loadData('country-emojis.json');
  }

  static async getCountryPopulations() {
    return this.loadData('country-populations.json');
  }

  static async getCountryHello() {
    return this.loadData('country-hello.json');
  }

  static async getWeirdFacts() {
    return this.loadData('weirdfacts.json');
  }

  static async getCityArt() {
    return this.loadData('city-art.json');
  }

  static async getCityLandmarks() {
    return this.loadData('city-landmarks.json');
  }

  static async getCountrySports() {
    return this.loadData('country-sports.json');
  }
}

export default DataService;
