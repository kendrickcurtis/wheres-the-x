#!/usr/bin/env node

/**
 * Run the city data scraper
 * 
 * This script runs the city data scraper and provides progress updates.
 */

import { CityDataScraper } from './scrape-city-data.js';

async function main() {
  console.log('🚀 Starting city data scraping process...');
  console.log('📝 This will generate enhanced city data for clue generation');
  console.log('⏱️  Estimated time: 2-3 minutes for 45 cities\n');
  
  const scraper = new CityDataScraper();
  
  try {
    await scraper.scrapeAllCities();
    console.log('\n🎉 Scraping completed successfully!');
    console.log('📁 Enhanced city data saved to: src/data/enhanced-cities.json');
    console.log('💡 You can now use this data in the clue generation system');
  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    process.exit(1);
  }
}

main();
