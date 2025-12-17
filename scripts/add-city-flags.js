#!/usr/bin/env node

/**
 * Script to add cityFlag and regionFlag to enhanced-cities.json from a CSV file
 * 
 * CSV format should be:
 * city,country,city_symbol_type,city_image_url,region,region_symbol_type,region_image_url
 * 
 * Example:
 * Lyon,France,city_flag,https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Lyon%2C_France.svg,Auvergne-Rhône-Alpes,regional_flag,https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_region_Auvergne-Rhône-Alpes.svg
 * 
 * Usage: node scripts/add-city-flags.js path/to/city-flags.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headerLine = lines[0];
  
  // Parse header to find column indices
  const headers = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().toLowerCase());
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().toLowerCase()); // Add last header
  
  // Find column indices
  const cityIndex = headers.indexOf('city');
  const countryIndex = headers.indexOf('country');
  const cityImageUrlIndex = headers.indexOf('city_image_url');
  const regionIndex = headers.indexOf('region');
  const regionImageUrlIndex = headers.indexOf('region_image_url');
  
  if (cityIndex === -1 || countryIndex === -1) {
    throw new Error('CSV must have columns: city, country');
  }
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with quoted values
    const values = [];
    current = '';
    inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value
    
    const cityName = values[cityIndex];
    const country = values[countryIndex];
    const cityFlag = cityImageUrlIndex !== -1 ? values[cityImageUrlIndex] : null;
    const region = regionIndex !== -1 ? values[regionIndex] : null;
    const regionFlag = regionImageUrlIndex !== -1 ? values[regionImageUrlIndex] : null;
    
    if (cityName && country) {
      data.push({
        cityName,
        country,
        cityFlag: cityFlag || null,
        region: region || null,
        regionFlag: regionFlag || null
      });
    }
  }
  
  return data;
}

function addCityFlags(csvPath) {
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const flagData = parseCSV(csvContent);
    
    console.log(`📊 Found ${flagData.length} city entries in CSV`);
    
    const citiesPath = path.join(__dirname, '../src/data/enhanced-cities.json');
    const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
    
    let updated = 0;
    let notFound = [];
    
    for (const flagEntry of flagData) {
      const city = cities.find(c => 
        c.name === flagEntry.cityName && 
        c.country === flagEntry.country
      );
      
      if (city) {
        if (flagEntry.cityFlag) {
          city.cityFlag = flagEntry.cityFlag;
        }
        if (flagEntry.regionFlag) {
          city.regionFlag = flagEntry.regionFlag;
        }
        if (flagEntry.region) {
          city.region = flagEntry.region; // Update region if provided
        }
        updated++;
        console.log(`✓ Added flags to ${flagEntry.cityName}, ${flagEntry.country}: ${flagEntry.cityFlag ? 'city' : ''} ${flagEntry.regionFlag ? 'region' : ''}`.trim());
      } else {
        notFound.push(`${flagEntry.cityName}, ${flagEntry.country}`);
      }
    }
    
    // Write updated cities back
    fs.writeFileSync(citiesPath, JSON.stringify(cities, null, 2));
    
    console.log(`\n✅ Updated ${updated} cities with flags`);
    
    if (notFound.length > 0) {
      console.log(`\n⚠️  Could not find ${notFound.length} cities:`);
      notFound.forEach(nf => console.log(`   - ${nf}`));
    }
    
    // Also update public version
    const publicCitiesPath = path.join(__dirname, '../public/data/enhanced-cities.json');
    if (fs.existsSync(publicCitiesPath)) {
      fs.writeFileSync(publicCitiesPath, JSON.stringify(cities, null, 2));
      console.log(`\n✅ Also updated public/data/enhanced-cities.json`);
    }
  } catch (error) {
    console.error('❌ Error processing CSV:', error.message);
    process.exit(1);
  }
}

// Main execution
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node scripts/add-city-flags.js <path-to-csv-file>');
  console.error('\nCSV format:');
  console.error('city,country,city_symbol_type,city_image_url,region,region_symbol_type,region_image_url');
  console.error('Example:');
  console.error('Lyon,France,city_flag,https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Lyon.svg,Auvergne-Rhône-Alpes,regional_flag,https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_region_Auvergne-Rhône-Alpes.svg');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Error: CSV file not found: ${csvPath}`);
  process.exit(1);
}

addCityFlags(csvPath);

