#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Read the current enhanced cities data
const citiesData = JSON.parse(fs.readFileSync('src/data/enhanced-cities.json', 'utf8'));

console.log(`Starting climate data update for ${citiesData.length} cities...`);

async function extractClimateData(cityName, country) {
  try {
    const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Climate Data Scraper)'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find the climate data table
    const climateTable = $('table').filter(function() {
      const text = $(this).text().toLowerCase();
      return text.includes('climate data') && 
             (text.includes('jan') || text.includes('feb') || text.includes('mar')) &&
             (text.includes('jun') || text.includes('jul') || text.includes('aug')) &&
             (text.includes('dec') || text.includes('nov') || text.includes('oct'));
    }).first();
    
    if (climateTable.length === 0) {
      return null;
    }
    
    // Extract data from the table
    const data = {};
    const rows = climateTable.find('tr');
    
    // Find the row with month headers
    let monthRowIndex = -1;
    let tempRowIndex = -1;
    let precipRowIndex = -1;
    
    rows.each(function(i) {
      const row = $(this);
      const text = row.text().toLowerCase();
      
      if (text.includes('month') && text.includes('jan') && text.includes('jun')) {
        monthRowIndex = i;
      }
      if (text.includes('daily mean') && text.includes('°c')) {
        tempRowIndex = i;
      }
      if (text.includes('average precipitation') && text.includes('mm')) {
        precipRowIndex = i;
      }
    });
    
    if (monthRowIndex === -1 || tempRowIndex === -1) {
      return null;
    }
    
    // Extract month names from the month header row
    const monthRow = rows.eq(monthRowIndex);
    const monthCells = monthRow.find('th, td');
    const months = monthCells.map(function() {
      return $(this).text().toLowerCase().trim();
    }).get();
    
    // Find June and December indices
    const juneIndex = months.findIndex(m => m.includes('jun'));
    const decIndex = months.findIndex(m => m.includes('dec'));
    
    if (juneIndex === -1 || decIndex === -1) {
      return null;
    }
    
    // Extract temperature data
    const tempRow = rows.eq(tempRowIndex);
    const tempCells = tempRow.find('th, td');
    
    if (tempCells.length > Math.max(juneIndex, decIndex)) {
      const juneTemp = parseFloat(tempCells.eq(juneIndex).text().replace(/[^\d.-]/g, ''));
      const decTemp = parseFloat(tempCells.eq(decIndex).text().replace(/[^\d.-]/g, ''));
      
      if (!isNaN(juneTemp)) {
        data.juneTemp = juneTemp;
      }
      if (!isNaN(decTemp)) {
        data.decTemp = decTemp;
      }
    }
    
    // Extract precipitation data if available
    if (precipRowIndex !== -1) {
      const precipRow = rows.eq(precipRowIndex);
      const precipCells = precipRow.find('th, td');
      
      if (precipCells.length > Math.max(juneIndex, decIndex)) {
        const junePrecip = parseFloat(precipCells.eq(juneIndex).text().replace(/[^\d.-]/g, ''));
        const decPrecip = parseFloat(precipCells.eq(decIndex).text().replace(/[^\d.-]/g, ''));
        
        if (!isNaN(junePrecip)) {
          data.juneRainfall = junePrecip;
        }
        if (!isNaN(decPrecip)) {
          data.decRainfall = decPrecip;
        }
      }
    }
    
    return data;
    
  } catch (error) {
    return null;
  }
}

// Main function to update all cities
async function updateClimateData() {
  let updatedCount = 0;
  
  for (let i = 0; i < citiesData.length; i++) {
    const city = citiesData[i];
    
    console.log(`Processing ${i + 1}/${citiesData.length}: ${city.name}, ${city.country}`);
    
    // Skip if we already have the new format
    if (city.climate && city.climate.juneTemp && city.climate.decTemp && 
        city.climate.juneRainfall && city.climate.decRainfall) {
      console.log(`  Skipping - already has complete climate data`);
      continue;
    }
    
    const newClimateData = await extractClimateData(city.name, city.country);
    
    if (newClimateData) {
      // Update the climate section with new format
      city.climate = {
        type: city.climate?.type || 'Temperate',
        juneTemp: newClimateData.juneTemp || city.climate?.juneTemp || null,
        decTemp: newClimateData.decTemp || city.climate?.decTemp || null,
        juneRainfall: newClimateData.juneRainfall || null,
        decRainfall: newClimateData.decRainfall || null,
        // Keep old annual rainfall as fallback
        rainfall: city.climate?.rainfall || null
      };
      
      console.log(`  Updated with: June ${newClimateData.juneTemp}°C, Dec ${newClimateData.decTemp}°C, June ${newClimateData.juneRainfall}mm, Dec ${newClimateData.decRainfall}mm`);
      updatedCount++;
    } else {
      console.log(`  No climate data found`);
    }
    
    // Add delay to be respectful to Wikipedia
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Write updated data back to file
  fs.writeFileSync('src/data/enhanced-cities.json', JSON.stringify(citiesData, null, 2));
  
  console.log(`\nClimate data update complete!`);
  console.log(`Updated ${updatedCount} cities with new climate data format.`);
  console.log(`New format includes: juneTemp, decTemp, juneRainfall, decRainfall`);
}

// Run the update
updateClimateData().catch(console.error);
