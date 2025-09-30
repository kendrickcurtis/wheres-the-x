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
    
    // Look at all rows to understand the structure
    const rows = climateTable.find('tr');
    console.log(`Table has ${rows.length} rows`);
    
    // Find the row with month headers
    let monthRowIndex = -1;
    let tempRowIndex = -1;
    let precipRowIndex = -1;
    
    rows.each(function(i) {
      const row = $(this);
      const text = row.text().toLowerCase();
      
      console.log(`Row ${i}: ${text.substring(0, 100)}...`);
      
      if (text.includes('month') && text.includes('jan') && text.includes('jun')) {
        monthRowIndex = i;
        console.log(`Found month header row at index ${i}`);
      }
      if (text.includes('mean') && text.includes('temp') && text.includes('°c')) {
        tempRowIndex = i;
        console.log(`Found temperature row at index ${i}`);
      }
      if (text.includes('precip') || (text.includes('rain') && text.includes('mm'))) {
        precipRowIndex = i;
        console.log(`Found precipitation row at index ${i}`);
      }
    });
    
    if (monthRowIndex === -1 || tempRowIndex === -1) {
      console.log('Could not find required rows');
      return null;
    }
    
    // Extract month names from the month header row
    const monthRow = rows.eq(monthRowIndex);
    const monthCells = monthRow.find('th, td');
    const months = monthCells.map(function() {
      return $(this).text().toLowerCase().trim();
    }).get();
    
    console.log('Months found:', months);
    
    // Find June and December indices
    const juneIndex = months.findIndex(m => m.includes('jun'));
    const decIndex = months.findIndex(m => m.includes('dec'));
    
    console.log(`June index: ${juneIndex}, December index: ${decIndex}`);
    
    if (juneIndex === -1 || decIndex === -1) {
      console.log('Could not find June or December columns');
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
        console.log(`June temperature: ${juneTemp}°C`);
      }
      if (!isNaN(decTemp)) {
        data.decTemp = decTemp;
        console.log(`December temperature: ${decTemp}°C`);
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
          console.log(`June rainfall: ${junePrecip}mm`);
        }
        if (!isNaN(decPrecip)) {
          data.decRainfall = decPrecip;
          console.log(`December rainfall: ${decPrecip}mm`);
        }
      }
    }
    
    console.log('\nFinal extracted data:', data);
    return data;
    
  } catch (error) {
    console.error(`Error scraping ${cityName}:`, error.message);
    return null;
  }
}

// Run the extraction
extractClimateData(testCity.name, testCity.country).catch(console.error);
