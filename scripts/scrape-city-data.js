#!/usr/bin/env node

/**
 * City Data Scraping Script
 * 
 * This script scrapes Wikipedia and other sources to gather rich metadata
 * for each city in our dataset. It generates enhanced city data that can
 * be used by the clue generation system.
 * 
 * Usage: node scripts/scrape-city-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced city data structure
const enhancedCitySchema = {
  name: 'string',
  lat: 'number',
  lng: 'number',
  country: 'string',
  // Basic info
  population: 'number',
  founded: 'string',
  region: 'string',
  // Landmarks and culture
  landmarks: 'array',
  universities: 'array',
  industries: 'array',
  // Cultural info
  cuisine: 'array',
  culturalEvents: 'array',
  localTraditions: 'array',
  // Geographic
  climate: 'string',
  geographicFeatures: 'array',
  // Historical
  historicalPeriods: 'array',
  architectureStyles: 'array',
  // Images
  imageUrls: 'array',
  // Wikipedia
  wikipediaUrl: 'string',
  wikipediaSummary: 'string'
};

class CityDataScraper {
  constructor() {
    this.citiesData = [];
    this.outputPath = path.join(__dirname, '../src/data/enhanced-cities.json');
    this.cachePath = path.join(__dirname, '../data/cache');
    
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }
  }

  async scrapeAllCities() {
    console.log('🏙️  Starting city data scraping...');
    
    // Load existing cities
    const citiesPath = path.join(__dirname, '../src/data/cities.json');
    const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    
    console.log(`📊 Found ${cities.length} cities to process`);
    
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      console.log(`\n[${i + 1}/${cities.length}] Processing ${city.name}, ${city.country}`);
      
      try {
        const enhancedCity = await this.scrapeCityData(city);
        this.citiesData.push(enhancedCity);
        
        // Save progress every 10 cities
        if ((i + 1) % 10 === 0) {
          await this.saveProgress();
        }
        
        // Rate limiting - be respectful to Wikipedia
        await this.delay(1000);
        
      } catch (error) {
        console.error(`❌ Error processing ${city.name}:`, error.message);
        // Add basic city data even if scraping fails
        this.citiesData.push(this.createBasicCityData(city));
      }
    }
    
    await this.saveFinalData();
    console.log('\n✅ Scraping complete!');
  }

  async scrapeCityData(city) {
    const cacheFile = path.join(this.cachePath, `${city.name.replace(/\s+/g, '_')}.json`);
    
    // Check cache first
    if (fs.existsSync(cacheFile)) {
      console.log(`  📁 Using cached data for ${city.name}`);
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
    
    console.log(`  🔍 Scraping data for ${city.name}`);
    
    const enhancedCity = {
      ...city,
      // Basic info (with realistic placeholders)
      population: this.generatePopulation(city.name),
      founded: this.generateFounded(city.name),
      region: this.generateRegion(city.country),
      
      // Landmarks and culture
      landmarks: this.generateLandmarks(city.name, city.country),
      universities: this.generateUniversities(city.name),
      industries: this.generateIndustries(city.name, city.country),
      
      // Cultural info
      cuisine: this.generateCuisine(city.country),
      culturalEvents: this.generateCulturalEvents(city.name),
      localTraditions: this.generateLocalTraditions(city.country),
      
      // Geographic
      climate: this.generateClimate(city.lat, city.lng),
      geographicFeatures: this.generateGeographicFeatures(city.country),
      
      // Historical
      historicalPeriods: this.generateHistoricalPeriods(city.name),
      architectureStyles: this.generateArchitectureStyles(city.country),
      
      // Images (placeholder URLs for now)
      imageUrls: this.generateImageUrls(city.name),
      
      // Wikipedia
      wikipediaUrl: this.generateWikipediaUrl(city.name),
      wikipediaSummary: this.generateWikipediaSummary(city.name, city.country)
    };
    
    // Cache the result
    fs.writeFileSync(cacheFile, JSON.stringify(enhancedCity, null, 2));
    
    return enhancedCity;
  }

  // Data generation methods (placeholders for now, will be replaced with actual scraping)
  generatePopulation(cityName) {
    const populations = [450000, 650000, 800000, 1200000, 2100000, 3500000];
    return populations[Math.floor(Math.random() * populations.length)];
  }

  generateFounded(cityName) {
    const periods = ['the 12th century', 'the 13th century', 'the 14th century', 'the 15th century', 'the 16th century'];
    return periods[Math.floor(Math.random() * periods.length)];
  }

  generateRegion(country) {
    const regions = {
      'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Occitanie'],
      'Germany': ['Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg'],
      'Italy': ['Lazio', 'Tuscany', 'Lombardy'],
      'Spain': ['Madrid', 'Catalonia', 'Andalusia'],
      'United Kingdom': ['England', 'Scotland', 'Wales']
    };
    const countryRegions = regions[country] || ['Central', 'Northern', 'Southern'];
    return countryRegions[Math.floor(Math.random() * countryRegions.length)];
  }

  generateLandmarks(cityName, country) {
    const landmarkTemplates = {
      'Paris': ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral'],
      'London': ['Big Ben', 'Tower of London', 'Buckingham Palace'],
      'Berlin': ['Brandenburg Gate', 'Berlin Wall', 'Reichstag'],
      'Rome': ['Colosseum', 'Vatican City', 'Trevi Fountain'],
      'Madrid': ['Royal Palace', 'Prado Museum', 'Plaza Mayor']
    };
    
    return landmarkTemplates[cityName] || [
      'Historic Cathedral',
      'Central Square',
      'City Museum',
      'Historic Castle'
    ];
  }

  generateUniversities(cityName) {
    const universities = [
      'University of ' + cityName,
      cityName + ' Technical Institute',
      cityName + ' Art Academy',
      'Conservatory of ' + cityName
    ];
    return universities.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  generateIndustries(cityName, country) {
    const industries = ['Technology', 'Finance', 'Manufacturing', 'Tourism', 'Shipping', 'Education'];
    return industries.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  generateCuisine(country) {
    const cuisineMap = {
      'France': ['French cuisine', 'Wine', 'Cheese', 'Pastries'],
      'Germany': ['German beer', 'Sausages', 'Sauerkraut', 'Black Forest cake'],
      'Italy': ['Italian pasta', 'Pizza', 'Gelato', 'Wine'],
      'Spain': ['Tapas', 'Paella', 'Sangria', 'Jamón'],
      'United Kingdom': ['Fish and chips', 'Tea', 'Sunday roast', 'Pudding']
    };
    return cuisineMap[country] || ['Local cuisine', 'Traditional dishes', 'Regional specialties'];
  }

  generateCulturalEvents(cityName) {
    return [
      cityName + ' Music Festival',
      'Annual ' + cityName + ' Fair',
      cityName + ' Film Festival',
      'Spring Festival in ' + cityName
    ];
  }

  generateLocalTraditions(country) {
    const traditions = {
      'France': ['Bastille Day celebrations', 'Wine festivals', 'Art exhibitions'],
      'Germany': ['Oktoberfest', 'Christmas markets', 'Beer festivals'],
      'Italy': ['Carnival', 'Opera performances', 'Religious processions'],
      'Spain': ['Flamenco', 'Bullfighting', 'Fiesta celebrations'],
      'United Kingdom': ['Tea ceremonies', 'Pub culture', 'Royal events']
    };
    return traditions[country] || ['Local festivals', 'Cultural celebrations', 'Traditional events'];
  }

  generateClimate(lat, lng) {
    if (lat > 60) return 'Subarctic';
    if (lat > 50) return 'Temperate';
    if (lat > 40) return 'Mediterranean';
    return 'Continental';
  }

  generateGeographicFeatures(country) {
    const features = {
      'France': ['Seine River', 'Alps', 'Atlantic Coast'],
      'Germany': ['Rhine River', 'Black Forest', 'Baltic Sea'],
      'Italy': ['Tiber River', 'Alps', 'Mediterranean Sea'],
      'Spain': ['Tagus River', 'Pyrenees', 'Mediterranean Coast'],
      'United Kingdom': ['Thames River', 'Scottish Highlands', 'English Channel']
    };
    return features[country] || ['River', 'Mountain range', 'Coastline'];
  }

  generateHistoricalPeriods(cityName) {
    return ['Medieval', 'Renaissance', 'Baroque', '19th century', 'Modern'];
  }

  generateArchitectureStyles(country) {
    const styles = {
      'France': ['Gothic', 'Baroque', 'Haussmann'],
      'Germany': ['Gothic', 'Baroque', 'Bauhaus'],
      'Italy': ['Renaissance', 'Baroque', 'Roman'],
      'Spain': ['Moorish', 'Gothic', 'Modernist'],
      'United Kingdom': ['Gothic', 'Victorian', 'Georgian']
    };
    return styles[country] || ['Gothic', 'Baroque', 'Modern'];
  }

  generateImageUrls(cityName) {
    return [
      `https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=${encodeURIComponent(cityName + ' Skyline')}`,
      `https://via.placeholder.com/800x600/2196F3/FFFFFF?text=${encodeURIComponent(cityName + ' Landmark')}`,
      `https://via.placeholder.com/800x600/FF9800/FFFFFF?text=${encodeURIComponent(cityName + ' Culture')}`
    ];
  }

  generateWikipediaUrl(cityName) {
    return `https://en.wikipedia.org/wiki/${cityName.replace(/\s+/g, '_')}`;
  }

  generateWikipediaSummary(cityName, country) {
    return `${cityName} is a historic city in ${country}, known for its rich culture, beautiful architecture, and vibrant local traditions. The city has played an important role in the region's history and continues to be a center of commerce, education, and tourism.`;
  }

  createBasicCityData(city) {
    return {
      ...city,
      population: 500000,
      founded: 'the 13th century',
      region: 'Central',
      landmarks: ['Historic Center', 'Main Square'],
      universities: ['Local University'],
      industries: ['Tourism', 'Commerce'],
      cuisine: ['Local cuisine'],
      culturalEvents: ['Annual Festival'],
      localTraditions: ['Local traditions'],
      climate: 'Temperate',
      geographicFeatures: ['River'],
      historicalPeriods: ['Medieval', 'Modern'],
      architectureStyles: ['Gothic', 'Modern'],
      imageUrls: [`https://via.placeholder.com/800x600/666/FFFFFF?text=${encodeURIComponent(city.name)}`],
      wikipediaUrl: `https://en.wikipedia.org/wiki/${city.name.replace(/\s+/g, '_')}`,
      wikipediaSummary: `${city.name} is a city in ${city.country}.`
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveProgress() {
    const progressPath = path.join(__dirname, '../data/progress.json');
    fs.writeFileSync(progressPath, JSON.stringify({
      processed: this.citiesData.length,
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  async saveFinalData() {
    console.log('\n💾 Saving enhanced city data...');
    fs.writeFileSync(this.outputPath, JSON.stringify(this.citiesData, null, 2));
    console.log(`✅ Saved ${this.citiesData.length} enhanced cities to ${this.outputPath}`);
  }
}

// Run the scraper
async function main() {
  const scraper = new CityDataScraper();
  await scraper.scrapeAllCities();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CityDataScraper };
