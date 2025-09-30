#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Read the current enhanced cities data
const citiesData = JSON.parse(fs.readFileSync('src/data/enhanced-cities.json', 'utf8'));

// Function to scrape climate data from Wikipedia
async function scrapeClimateData(cityName, country) {
  try {
    console.log(`Scraping climate data for ${cityName}, ${country}...`);
    
    // Search for the city's Wikipedia page
    const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Climate Data Scraper)'
      }
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch ${cityName}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for climate data in infobox or climate section
    let climateData = null;
    
    // Try to find climate table
    const climateTable = $('table.infobox tr').filter(function() {
      return $(this).text().toLowerCase().includes('climate') || 
             $(this).text().toLowerCase().includes('temperature') ||
             $(this).text().toLowerCase().includes('precipitation');
    });
    
    if (climateTable.length > 0) {
      // Look for temperature and precipitation data
      const tempData = extractTemperatureData($, climateTable);
      const precipData = extractPrecipitationData($, climateTable);
      
      if (tempData && precipData) {
        climateData = {
          ...tempData,
          ...precipData
        };
      }
    }
    
    // If no data found in infobox, try climate section
    if (!climateData) {
      const climateSection = $('h2:contains("Climate"), h3:contains("Climate")').first();
      if (climateSection.length > 0) {
        const sectionContent = climateSection.nextUntil('h2, h3');
        const tempData = extractTemperatureFromText(sectionContent.text());
        const precipData = extractPrecipitationFromText(sectionContent.text());
        
        if (tempData && precipData) {
          climateData = {
            ...tempData,
            ...precipData
          };
        }
      }
    }
    
    // If still no data, try to find any table with monthly data
    if (!climateData) {
      const monthlyTable = $('table').filter(function() {
        const text = $(this).text().toLowerCase();
        return (text.includes('jan') || text.includes('feb') || text.includes('mar')) &&
               (text.includes('jun') || text.includes('jul') || text.includes('aug')) &&
               (text.includes('dec') || text.includes('nov') || text.includes('oct'));
      }).first();
      
      if (monthlyTable.length > 0) {
        climateData = extractFromMonthlyTable($, monthlyTable);
      }
    }
    
    if (climateData) {
      console.log(`Found climate data for ${cityName}:`, climateData);
    } else {
      console.log(`No climate data found for ${cityName}`);
    }
    
    return climateData;
    
  } catch (error) {
    console.error(`Error scraping ${cityName}:`, error.message);
    return null;
  }
}

// Extract temperature data from infobox
function extractTemperatureData($, climateTable) {
  const tempData = {};
  
  climateTable.each(function() {
    const row = $(this);
    const text = row.text().toLowerCase();
    
    // Look for average temperature data
    if (text.includes('average') && text.includes('temperature')) {
      const cells = row.find('td');
      if (cells.length >= 2) {
        const value = parseFloat(cells.eq(1).text().replace(/[^\d.-]/g, ''));
        if (!isNaN(value)) {
          if (text.includes('high') || text.includes('maximum')) {
            tempData.avgHighTemp = value;
          } else if (text.includes('low') || text.includes('minimum')) {
            tempData.avgLowTemp = value;
          } else {
            tempData.avgTemp = value;
          }
        }
      }
    }
  });
  
  return Object.keys(tempData).length > 0 ? tempData : null;
}

// Extract precipitation data from infobox
function extractPrecipitationData($, climateTable) {
  const precipData = {};
  
  climateTable.each(function() {
    const row = $(this);
    const text = row.text().toLowerCase();
    
    if (text.includes('precipitation') || text.includes('rainfall')) {
      const cells = row.find('td');
      if (cells.length >= 2) {
        const value = parseFloat(cells.eq(1).text().replace(/[^\d.-]/g, ''));
        if (!isNaN(value)) {
          precipData.annualRainfall = value;
        }
      }
    }
  });
  
  return Object.keys(precipData).length > 0 ? precipData : null;
}

// Extract data from monthly climate table
function extractFromMonthlyTable($, table) {
  const data = {};
  
  // Find header row to identify columns
  const headerRow = table.find('tr').first();
  const headers = headerRow.find('th, td').map(function() {
    return $(this).text().toLowerCase().trim();
  }).get();
  
  // Find temperature and precipitation columns
  const tempColIndex = headers.findIndex(h => h.includes('temp') || h.includes('°c'));
  const precipColIndex = headers.findIndex(h => h.includes('precip') || h.includes('rain') || h.includes('mm'));
  
  if (tempColIndex === -1 || precipColIndex === -1) {
    return null;
  }
  
  // Extract monthly data
  table.find('tr').slice(1).each(function() {
    const row = $(this);
    const cells = row.find('td');
    
    if (cells.length > Math.max(tempColIndex, precipColIndex)) {
      const month = cells.eq(0).text().toLowerCase().trim();
      const temp = parseFloat(cells.eq(tempColIndex).text().replace(/[^\d.-]/g, ''));
      const precip = parseFloat(cells.eq(precipColIndex).text().replace(/[^\d.-]/g, ''));
      
      if (month.includes('jun') && !isNaN(temp)) {
        data.juneTemp = temp;
      }
      if (month.includes('dec') && !isNaN(temp)) {
        data.decTemp = temp;
      }
      if (month.includes('jun') && !isNaN(precip)) {
        data.juneRainfall = precip;
      }
      if (month.includes('dec') && !isNaN(precip)) {
        data.decRainfall = precip;
      }
    }
  });
  
  return Object.keys(data).length > 0 ? data : null;
}

// Extract temperature from text content
function extractTemperatureFromText(text) {
  const tempData = {};
  
  // Look for patterns like "June average: 20°C" or "summer temperature: 25°C"
  const juneMatch = text.match(/june[^0-9]*(\d+(?:\.\d+)?)[^0-9]*°?c/gi);
  const decMatch = text.match(/december[^0-9]*(\d+(?:\.\d+)?)[^0-9]*°?c/gi);
  
  if (juneMatch) {
    tempData.juneTemp = parseFloat(juneMatch[0].replace(/[^\d.-]/g, ''));
  }
  if (decMatch) {
    tempData.decTemp = parseFloat(decMatch[0].replace(/[^\d.-]/g, ''));
  }
  
  return Object.keys(tempData).length > 0 ? tempData : null;
}

// Extract precipitation from text content
function extractPrecipitationFromText(text) {
  const precipData = {};
  
  // Look for patterns like "June rainfall: 45mm" or "summer precipitation: 50mm"
  const juneMatch = text.match(/june[^0-9]*(\d+(?:\.\d+)?)[^0-9]*mm/gi);
  const decMatch = text.match(/december[^0-9]*(\d+(?:\.\d+)?)[^0-9]*mm/gi);
  
  if (juneMatch) {
    precipData.juneRainfall = parseFloat(juneMatch[0].replace(/[^\d.-]/g, ''));
  }
  if (decMatch) {
    precipData.decRainfall = parseFloat(decMatch[0].replace(/[^\d.-]/g, ''));
  }
  
  return Object.keys(precipData).length > 0 ? precipData : null;
}

// Main function to update all cities
async function updateClimateData() {
  console.log(`Starting climate data update for ${citiesData.length} cities...`);
  
  let updatedCount = 0;
  
  for (let i = 0; i < citiesData.length; i++) {
    const city = citiesData[i];
    
    // Skip if we already have the new format
    if (city.climate && city.climate.juneTemp && city.climate.decTemp && 
        city.climate.juneRainfall && city.climate.decRainfall) {
      console.log(`Skipping ${city.name} - already has complete climate data`);
      continue;
    }
    
    const newClimateData = await scrapeClimateData(city.name, city.country);
    
    if (newClimateData) {
      // Update the climate section with new format
      city.climate = {
        type: city.climate?.type || 'Temperate',
        juneTemp: newClimateData.juneTemp || city.climate?.juneTemp || null,
        decTemp: newClimateData.decTemp || city.climate?.decTemp || null,
        juneRainfall: newClimateData.juneRainfall || null,
        decRainfall: newClimateData.decRainfall || null,
        // Keep old annual rainfall as fallback
        rainfall: city.climate?.rainfall || newClimateData.annualRainfall || null
      };
      
      updatedCount++;
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
