#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Test with just one city first
const testCity = {
  name: "Paris",
  country: "France"
};

console.log(`Extracting climate data for ${testCity.name}, ${testCity.country}...`);

async function extractClimateData(cityName, country) {
  try {
    const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`;
    console.log(`Fetching: ${searchUrl}`);
    
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
    
    // Find the climate data table
    const climateTable = $('table').filter(function() {
      const text = $(this).text().toLowerCase();
      return text.includes('climate data') && 
             (text.includes('jan') || text.includes('feb') || text.includes('mar')) &&
             (text.includes('jun') || text.includes('jul') || text.includes('aug')) &&
             (text.includes('dec') || text.includes('nov') || text.includes('oct'));
    }).first();
    
    if (climateTable.length === 0) {
      console.log('No climate data table found');
      return null;
    }
    
    console.log('Found climate data table!');
    
    // Extract data from the table
    const data = {};
    
    // Find header row to identify columns
    const headerRow = climateTable.find('tr').first();
    const headers = headerRow.find('th, td').map(function() {
      return $(this).text().toLowerCase().trim();
    }).get();
    
    console.log('Headers:', headers);
    
    // Find temperature and precipitation columns
    const tempColIndex = headers.findIndex(h => 
      h.includes('mean') && (h.includes('temp') || h.includes('°c'))
    );
    const precipColIndex = headers.findIndex(h => 
      h.includes('precip') || h.includes('rain') || h.includes('mm')
    );
    
    console.log(`Temperature column index: ${tempColIndex}`);
    console.log(`Precipitation column index: ${precipColIndex}`);
    
    if (tempColIndex === -1) {
      console.log('No temperature column found');
      return null;
    }
    
    // Extract monthly data
    climateTable.find('tr').slice(1).each(function() {
      const row = $(this);
      const cells = row.find('td');
      
      if (cells.length > Math.max(tempColIndex, precipColIndex || 0)) {
        const month = cells.eq(0).text().toLowerCase().trim();
        const temp = parseFloat(cells.eq(tempColIndex).text().replace(/[^\d.-]/g, ''));
        
        console.log(`Month: ${month}, Temp: ${temp}`);
        
        if (month.includes('jun') && !isNaN(temp)) {
          data.juneTemp = temp;
          console.log(`Found June temperature: ${temp}°C`);
        }
        if (month.includes('dec') && !isNaN(temp)) {
          data.decTemp = temp;
          console.log(`Found December temperature: ${temp}°C`);
        }
        
        // Try to get precipitation data if column exists
        if (precipColIndex !== -1) {
          const precip = parseFloat(cells.eq(precipColIndex).text().replace(/[^\d.-]/g, ''));
          console.log(`Month: ${month}, Precip: ${precip}`);
          
          if (month.includes('jun') && !isNaN(precip)) {
            data.juneRainfall = precip;
            console.log(`Found June rainfall: ${precip}mm`);
          }
          if (month.includes('dec') && !isNaN(precip)) {
            data.decRainfall = precip;
            console.log(`Found December rainfall: ${precip}mm`);
          }
        }
      }
    });
    
    console.log('\nExtracted data:', data);
    return data;
    
  } catch (error) {
    console.error(`Error scraping ${cityName}:`, error.message);
    return null;
  }
}

// Run the extraction
extractClimateData(testCity.name, testCity.country).catch(console.error);
