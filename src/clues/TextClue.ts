import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';
import enhancedCitiesData from '../data/enhanced-cities.json';

export class TextClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return true; // Can always generate text clues
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    const clueText = this.generateClueText(targetCity, context.difficulty, context.rng);
    
    return {
      id: `text-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: clueText,
      type: 'text',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private generateClueText(city: { name: string; country: string }, difficulty: DifficultyLevel, rng: () => number): string {
    const clueTemplates = this.getClueTemplates(city, difficulty);
    const randomTemplate = clueTemplates[Math.floor(rng() * clueTemplates.length)];
    
    return this.fillTemplate(randomTemplate, city, rng);
  }

  private getClueTemplates(city: { name: string; country: string }, difficulty: DifficultyLevel): string[] {
    switch (difficulty) {
      case 'EASY':
        return [
          `This city is the capital of ${city.country}`,
          `A major city in ${city.country}`,
          `The largest city in ${city.country}`,
          `Famous for being the capital of ${city.country}`
        ];
      case 'MEDIUM':
        return [
          `This city has a population of approximately {population}`,
          `Known for its {landmark} and historic architecture`,
          `Famous for {culture} and {cuisine}`,
          `This city is located in the {region} region of ${city.country}`,
          `Home to {university} and many cultural institutions`,
          `Known for its {industry} industry and {climate} climate`
        ];
      case 'HARD':
        return [
          `This city was founded in {founded} and is known for {history}`,
          `Famous for {local_specialty} and {cultural_event}`,
          `The city's {architecture_style} architecture reflects its {historical_period} heritage`,
          `Known locally for {local_tradition} and {regional_dialect}`,
          `This city's {geographic_feature} has influenced its {economic_activity}`,
          `Famous for {artistic_movement} and {scientific_contribution}`
        ];
    }
  }

  private fillTemplate(template: string, city: { name: string; country: string }, rng: () => number): string {
    // Get enhanced city data
    const enhancedCity = this.getEnhancedCityData(city.name);
    
    const placeholders: Record<string, string> = {
      '{population}': enhancedCity?.population?.toLocaleString() || this.getPopulationPlaceholder(city.name, rng),
      '{landmark}': enhancedCity?.landmarks?.[0] || this.getLandmarkPlaceholder(city.name, rng),
      '{culture}': enhancedCity?.culturalEvents?.[0] || this.getCulturePlaceholder(city.name, rng),
      '{cuisine}': enhancedCity?.cuisine?.[0] || this.getCuisinePlaceholder(city.name, rng),
      '{region}': enhancedCity?.region || this.getRegionPlaceholder(city.country, rng),
      '{university}': enhancedCity?.universities?.[0] || this.getUniversityPlaceholder(city.name, rng),
      '{industry}': enhancedCity?.industries?.[0] || this.getIndustryPlaceholder(city.name, rng),
      '{climate}': enhancedCity?.climate?.type || this.getClimatePlaceholder(city.name, rng),
      '{founded}': enhancedCity?.founded || this.getFoundedPlaceholder(city.name, rng),
      '{history}': enhancedCity?.historicalPeriods?.[0] || this.getHistoryPlaceholder(city.name, rng),
      '{local_specialty}': enhancedCity?.localTraditions?.[0] || this.getLocalSpecialtyPlaceholder(city.name, rng),
      '{cultural_event}': enhancedCity?.culturalEvents?.[0] || this.getCulturalEventPlaceholder(city.name, rng),
      '{architecture_style}': enhancedCity?.architectureStyles?.[0] || this.getArchitectureStylePlaceholder(city.name, rng),
      '{historical_period}': enhancedCity?.historicalPeriods?.[0] || this.getHistoricalPeriodPlaceholder(city.name, rng),
      '{local_tradition}': enhancedCity?.localTraditions?.[0] || this.getLocalTraditionPlaceholder(city.name, rng),
      '{regional_dialect}': this.getRegionalDialectPlaceholder(city.name, rng), // Keep placeholder for now
      '{geographic_feature}': enhancedCity?.geographicFeatures?.[0] || this.getGeographicFeaturePlaceholder(city.name, rng),
      '{economic_activity}': enhancedCity?.industries?.[0] || this.getEconomicActivityPlaceholder(city.name, rng),
      '{artistic_movement}': this.getArtisticMovementPlaceholder(city.name, rng), // Keep placeholder for now
      '{scientific_contribution}': this.getScientificContributionPlaceholder(city.name, rng) // Keep placeholder for now
    };

    let result = template;
    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.replace(placeholder, value);
    }
    
    return result;
  }

  private getEnhancedCityData(cityName: string): any {
    return enhancedCitiesData.find((city: any) => city.name === cityName);
  }

  // Placeholder methods - will be replaced with actual data from scraping
  private getPopulationPlaceholder(cityName: string, rng: () => number): string {
    const populations = ['500,000', '1.2 million', '800,000', '2.1 million', '650,000'];
    return populations[Math.floor(rng() * populations.length)];
  }

  private getLandmarkPlaceholder(cityName: string, rng: () => number): string {
    const landmarks = ['cathedral', 'castle', 'palace', 'monument', 'bridge', 'tower'];
    return landmarks[Math.floor(rng() * landmarks.length)];
  }

  private getCulturePlaceholder(cityName: string, rng: () => number): string {
    const cultures = ['art museums', 'music festivals', 'theater', 'literature', 'film industry'];
    return cultures[Math.floor(rng() * cultures.length)];
  }

  private getCuisinePlaceholder(cityName: string, rng: () => number): string {
    const cuisines = ['local cuisine', 'traditional dishes', 'street food', 'fine dining', 'regional specialties'];
    return cuisines[Math.floor(rng() * cuisines.length)];
  }

  private getRegionPlaceholder(country: string, rng: () => number): string {
    const regions = ['northern', 'southern', 'eastern', 'western', 'central'];
    return regions[Math.floor(rng() * regions.length)];
  }

  private getUniversityPlaceholder(cityName: string, rng: () => number): string {
    const universities = ['university', 'technical institute', 'art academy', 'conservatory', 'research center'];
    return universities[Math.floor(rng() * universities.length)];
  }

  private getIndustryPlaceholder(cityName: string, rng: () => number): string {
    const industries = ['technology', 'finance', 'manufacturing', 'tourism', 'shipping'];
    return industries[Math.floor(rng() * industries.length)];
  }

  private getClimatePlaceholder(cityName: string, rng: () => number): string {
    const climates = ['temperate', 'continental', 'maritime', 'Mediterranean', 'oceanic'];
    return climates[Math.floor(rng() * climates.length)];
  }


  private getFoundedPlaceholder(cityName: string, rng: () => number): string {
    const years = ['the 12th century', 'the 13th century', 'the 14th century', 'the 15th century', 'the 16th century'];
    return years[Math.floor(rng() * years.length)];
  }

  private getHistoryPlaceholder(cityName: string, rng: () => number): string {
    const histories = ['medieval heritage', 'Renaissance influence', 'baroque architecture', 'industrial history', 'cultural significance'];
    return histories[Math.floor(rng() * histories.length)];
  }

  private getLocalSpecialtyPlaceholder(cityName: string, rng: () => number): string {
    const specialties = ['local crafts', 'traditional festivals', 'regional products', 'artisan goods', 'cultural traditions'];
    return specialties[Math.floor(rng() * specialties.length)];
  }

  private getCulturalEventPlaceholder(cityName: string, rng: () => number): string {
    const events = ['annual festivals', 'cultural celebrations', 'art exhibitions', 'music events', 'theater performances'];
    return events[Math.floor(rng() * events.length)];
  }

  private getArchitectureStylePlaceholder(cityName: string, rng: () => number): string {
    const styles = ['Gothic', 'Baroque', 'Renaissance', 'Art Nouveau', 'Modernist'];
    return styles[Math.floor(rng() * styles.length)];
  }

  private getHistoricalPeriodPlaceholder(cityName: string, rng: () => number): string {
    const periods = ['medieval', 'Renaissance', 'Baroque', '19th-century', '20th-century'];
    return periods[Math.floor(rng() * periods.length)];
  }

  private getLocalTraditionPlaceholder(cityName: string, rng: () => number): string {
    const traditions = ['local customs', 'regional traditions', 'cultural practices', 'folk traditions', 'historical customs'];
    return traditions[Math.floor(rng() * traditions.length)];
  }

  private getRegionalDialectPlaceholder(cityName: string, rng: () => number): string {
    const dialects = ['local dialect', 'regional accent', 'traditional language', 'local speech', 'regional variation'];
    return dialects[Math.floor(rng() * dialects.length)];
  }

  private getGeographicFeaturePlaceholder(cityName: string, rng: () => number): string {
    const features = ['river', 'mountain', 'coastline', 'valley', 'plateau'];
    return features[Math.floor(rng() * features.length)];
  }

  private getEconomicActivityPlaceholder(cityName: string, rng: () => number): string {
    const activities = ['trade', 'commerce', 'industry', 'tourism', 'agriculture'];
    return activities[Math.floor(rng() * activities.length)];
  }

  private getArtisticMovementPlaceholder(cityName: string, rng: () => number): string {
    const movements = ['Renaissance art', 'Baroque music', 'Gothic architecture', 'Romantic literature', 'Modern art'];
    return movements[Math.floor(rng() * movements.length)];
  }

  private getScientificContributionPlaceholder(cityName: string, rng: () => number): string {
    const contributions = ['scientific research', 'medical advances', 'technological innovation', 'academic excellence', 'scholarly tradition'];
    return contributions[Math.floor(rng() * contributions.length)];
  }
}
