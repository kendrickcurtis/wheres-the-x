#!/usr/bin/env node

/**
 * Script to add cityEmojis to enhanced-cities.json from a CSV file
 * 
 * CSV format should be:
 * type,name,country,emoji1,emoji2,emoji3,emoji4
 * city,Paris,France,🗼,🎨,🥐,☕️
 * city,Munich,Germany,🚗,🍺,🏰,🎪
 * 
 * Usage: node scripts/add-city-emojis.js path/to/city-emojis.csv
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
  const typeIndex = headers.indexOf('type');
  const nameIndex = headers.indexOf('name');
  const countryIndex = headers.indexOf('country');
  const emojiStartIndex = Math.max(
    headers.indexOf('emoji1'),
    headers.indexOf('emoji 1'),
    headers.indexOf('emoji')
  );
  
  if (typeIndex === -1 || nameIndex === -1 || countryIndex === -1) {
    throw new Error('CSV must have columns: type, name, country');
  }
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with quoted values and emojis
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
    
    // Only process rows where type is "city"
    if (values[typeIndex] && values[typeIndex].toLowerCase() === 'city') {
      const cityName = values[nameIndex];
      const country = values[countryIndex];
      
      // Extract emojis (from emoji1 onwards, or from index 3 if no emoji1 header)
      let emojis = [];
      if (emojiStartIndex !== -1) {
        emojis = values.slice(emojiStartIndex).filter(e => e && e.trim());
      } else {
        // Fallback: assume emojis start at index 3 (after type, name, country)
        emojis = values.slice(3).filter(e => e && e.trim());
      }
      
      if (cityName && country && emojis.length >= 2) {
        data.push({
          cityName,
          country,
          emojis
        });
      }
    }
  }
  
  return data;
}

function addCityEmojis(csvPath) {
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const emojiData = parseCSV(csvContent);
    
    console.log(`📊 Found ${emojiData.length} city entries in CSV`);
    
    const citiesPath = path.join(__dirname, '../src/data/enhanced-cities.json');
    const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
    
    let updated = 0;
    let notFound = [];
    
    for (const emojiEntry of emojiData) {
      const city = cities.find(c => 
        c.name === emojiEntry.cityName && 
        c.country === emojiEntry.country
      );
      
      if (city) {
        city.cityEmojis = emojiEntry.emojis;
        updated++;
        console.log(`✓ Added emojis to ${emojiEntry.cityName}, ${emojiEntry.country}: ${emojiEntry.emojis.join(' ')}`);
      } else {
        notFound.push(`${emojiEntry.cityName}, ${emojiEntry.country}`);
      }
    }
    
    // Write updated cities back
    fs.writeFileSync(citiesPath, JSON.stringify(cities, null, 2));
    
    console.log(`\n✅ Updated ${updated} cities with cityEmojis`);
    
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
  console.error('Usage: node scripts/add-city-emojis.js <path-to-csv-file>');
  console.error('\nCSV format:');
  console.error('type,name,country,emoji1,emoji2,emoji3,emoji4');
  console.error('Example:');
  console.error('city,Paris,France,🗼,🎨,🥐,☕️');
  console.error('city,Munich,Germany,🚗,🍺,🏰,🎪');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Error: CSV file not found: ${csvPath}`);
  process.exit(1);
}

addCityEmojis(csvPath);

