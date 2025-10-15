// Global data accessor for clue generators
// This will be populated by DataService during initialization

export const globalData = {
  enhancedCities: null as any,
  countryEmojis: null as any,
  countryPopulations: null as any,
  countryHello: null as any,
  weirdFacts: null as any,
  cityArt: null as any,
  cityLandmarks: null as any,
  countrySports: null as any,
};

export async function initializeGlobalData() {
  const DataService = (await import('../services/DataService')).default;
  await DataService.initialize();
  
  globalData.enhancedCities = await DataService.getEnhancedCities();
  globalData.countryEmojis = await DataService.getCountryEmojis();
  globalData.countryPopulations = await DataService.getCountryPopulations();
  globalData.countryHello = await DataService.getCountryHello();
  globalData.weirdFacts = await DataService.getWeirdFacts();
  globalData.cityArt = await DataService.getCityArt();
  globalData.cityLandmarks = await DataService.getCityLandmarks();
  globalData.countrySports = await DataService.getCountrySports();
  
  console.log('Global data initialized');
}
