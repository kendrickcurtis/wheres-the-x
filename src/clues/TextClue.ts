import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel } from './types';

export class TextClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    return true; // Can always generate text clues
  }

  generateClue(context: ClueContext): ClueResult {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    const clueText = this.generateClueText(targetCity, context.difficulty);
    
    return {
      id: `text-${context.stopIndex}-${Date.now()}`,
      text: clueText,
      type: 'text',
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private generateClueText(city: { name: string; country: string }, difficulty: DifficultyLevel): string {
    const clueTemplates = this.getClueTemplates(city, difficulty);
    const randomTemplate = clueTemplates[Math.floor(Math.random() * clueTemplates.length)];
    
    return this.fillTemplate(randomTemplate, city);
  }

  private getClueTemplates(city: { name: string; country: string }, difficulty: DifficultyLevel): string[] {
    switch (difficulty) {
      case 'EASY':
        return [
          `This city is the capital of ${city.country}`,
          `Located in ${city.country}`,
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

  private fillTemplate(template: string, city: { name: string; country: string }): string {
    // Placeholder implementation - will be replaced with actual data from scraping
    const placeholders: Record<string, string> = {
      '{population}': this.getPopulationPlaceholder(city.name),
      '{landmark}': this.getLandmarkPlaceholder(city.name),
      '{culture}': this.getCulturePlaceholder(city.name),
      '{cuisine}': this.getCuisinePlaceholder(city.name),
      '{region}': this.getRegionPlaceholder(city.country),
      '{university}': this.getUniversityPlaceholder(city.name),
      '{industry}': this.getIndustryPlaceholder(city.name),
      '{climate}': this.getClimatePlaceholder(city.name),
      '{founded}': this.getFoundedPlaceholder(city.name),
      '{history}': this.getHistoryPlaceholder(city.name),
      '{local_specialty}': this.getLocalSpecialtyPlaceholder(city.name),
      '{cultural_event}': this.getCulturalEventPlaceholder(city.name),
      '{architecture_style}': this.getArchitectureStylePlaceholder(city.name),
      '{historical_period}': this.getHistoricalPeriodPlaceholder(city.name),
      '{local_tradition}': this.getLocalTraditionPlaceholder(city.name),
      '{regional_dialect}': this.getRegionalDialectPlaceholder(city.name),
      '{geographic_feature}': this.getGeographicFeaturePlaceholder(city.name),
      '{economic_activity}': this.getEconomicActivityPlaceholder(city.name),
      '{artistic_movement}': this.getArtisticMovementPlaceholder(city.name),
      '{scientific_contribution}': this.getScientificContributionPlaceholder(city.name)
    };

    let result = template;
    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.replace(placeholder, value);
    }
    
    return result;
  }

  // Placeholder methods - will be replaced with actual data from scraping
  private getPopulationPlaceholder(cityName: string): string {
    const populations = ['500,000', '1.2 million', '800,000', '2.1 million', '650,000'];
    return populations[Math.floor(Math.random() * populations.length)];
  }

  private getLandmarkPlaceholder(cityName: string): string {
    const landmarks = ['cathedral', 'castle', 'palace', 'monument', 'bridge', 'tower'];
    return landmarks[Math.floor(Math.random() * landmarks.length)];
  }

  private getCulturePlaceholder(cityName: string): string {
    const cultures = ['art museums', 'music festivals', 'theater', 'literature', 'film industry'];
    return cultures[Math.floor(Math.random() * cultures.length)];
  }

  private getCuisinePlaceholder(cityName: string): string {
    const cuisines = ['local cuisine', 'traditional dishes', 'street food', 'fine dining', 'regional specialties'];
    return cuisines[Math.floor(Math.random() * cuisines.length)];
  }

  private getRegionPlaceholder(country: string): string {
    const regions = ['northern', 'southern', 'eastern', 'western', 'central'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private getUniversityPlaceholder(cityName: string): string {
    const universities = ['university', 'technical institute', 'art academy', 'conservatory', 'research center'];
    return universities[Math.floor(Math.random() * universities.length)];
  }

  private getIndustryPlaceholder(cityName: string): string {
    const industries = ['technology', 'finance', 'manufacturing', 'tourism', 'shipping'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private getClimatePlaceholder(cityName: string): string {
    const climates = ['temperate', 'continental', 'maritime', 'Mediterranean', 'oceanic'];
    return climates[Math.floor(Math.random() * climates.length)];
  }

  private getFoundedPlaceholder(cityName: string): string {
    const years = ['the 12th century', 'the 13th century', 'the 14th century', 'the 15th century', 'the 16th century'];
    return years[Math.floor(Math.random() * years.length)];
  }

  private getHistoryPlaceholder(cityName: string): string {
    const histories = ['medieval heritage', 'Renaissance influence', 'baroque architecture', 'industrial history', 'cultural significance'];
    return histories[Math.floor(Math.random() * histories.length)];
  }

  private getLocalSpecialtyPlaceholder(cityName: string): string {
    const specialties = ['local crafts', 'traditional festivals', 'regional products', 'artisan goods', 'cultural traditions'];
    return specialties[Math.floor(Math.random() * specialties.length)];
  }

  private getCulturalEventPlaceholder(cityName: string): string {
    const events = ['annual festivals', 'cultural celebrations', 'art exhibitions', 'music events', 'theater performances'];
    return events[Math.floor(Math.random() * events.length)];
  }

  private getArchitectureStylePlaceholder(cityName: string): string {
    const styles = ['Gothic', 'Baroque', 'Renaissance', 'Art Nouveau', 'Modernist'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private getHistoricalPeriodPlaceholder(cityName: string): string {
    const periods = ['medieval', 'Renaissance', 'Baroque', '19th-century', '20th-century'];
    return periods[Math.floor(Math.random() * periods.length)];
  }

  private getLocalTraditionPlaceholder(cityName: string): string {
    const traditions = ['local customs', 'regional traditions', 'cultural practices', 'folk traditions', 'historical customs'];
    return traditions[Math.floor(Math.random() * traditions.length)];
  }

  private getRegionalDialectPlaceholder(cityName: string): string {
    const dialects = ['local dialect', 'regional accent', 'traditional language', 'local speech', 'regional variation'];
    return dialects[Math.floor(Math.random() * dialects.length)];
  }

  private getGeographicFeaturePlaceholder(cityName: string): string {
    const features = ['river', 'mountain', 'coastline', 'valley', 'plateau'];
    return features[Math.floor(Math.random() * features.length)];
  }

  private getEconomicActivityPlaceholder(cityName: string): string {
    const activities = ['trade', 'commerce', 'industry', 'tourism', 'agriculture'];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  private getArtisticMovementPlaceholder(cityName: string): string {
    const movements = ['Renaissance art', 'Baroque music', 'Gothic architecture', 'Romantic literature', 'Modern art'];
    return movements[Math.floor(Math.random() * movements.length)];
  }

  private getScientificContributionPlaceholder(cityName: string): string {
    const contributions = ['scientific research', 'medical advances', 'technological innovation', 'academic excellence', 'scholarly tradition'];
    return contributions[Math.floor(Math.random() * contributions.length)];
  }
}
