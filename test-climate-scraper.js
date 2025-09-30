#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Test with just one city first
const testCity = {
  name: "Paris",
  country: "France"
};

console.log(`Testing climate data scraping for ${testCity.name}, ${testCity.country}...`);

async function testScrapeClimateData(cityName, country) {
  try {
    // Search for the city's Wikipedia page
    const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`;
    console.log(`Fetching: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Climate Data Scraper)'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`Failed to fetch ${cityName}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    console.log(`HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    
    // Debug: Look for any climate-related content
    console.log('\n=== DEBUGGING CLIMATE CONTENT ===');
    
    // Check if page has climate section
    const climateHeaders = $('h2, h3').filter(function() {
      return $(this).text().toLowerCase().includes('climate');
    });
    console.log(`Found ${climateHeaders.length} climate headers:`, climateHeaders.map(function() { return $(this).text(); }).get());
    
    // Check for infobox
    const infobox = $('table.infobox');
    console.log(`Found ${infobox.length} infobox tables`);
    
    if (infobox.length > 0) {
      console.log('\n=== INFOBOX CONTENT ===');
      const infoboxRows = infobox.find('tr');
      console.log(`Found ${infoboxRows.length} infobox rows`);
      
      // Look for any temperature or climate data
      infoboxRows.each(function(i) {
        const row = $(this);
        const text = row.text().toLowerCase();
        if (text.includes('temp') || text.includes('climate') || text.includes('precip') || text.includes('rain')) {
          console.log(`Row ${i}: ${row.text().trim()}`);
        }
      });
    }
    
    // Check for any tables with monthly data
    const allTables = $('table');
    console.log(`\nFound ${allTables.length} total tables`);
    
    allTables.each(function(i) {
      const table = $(this);
      const text = table.text().toLowerCase();
      
      // Look for tables that might contain monthly climate data
      if ((text.includes('jan') || text.includes('feb') || text.includes('mar')) &&
          (text.includes('jun') || text.includes('jul') || text.includes('aug')) &&
          (text.includes('dec') || text.includes('nov') || text.includes('oct'))) {
        console.log(`\n=== POTENTIAL MONTHLY TABLE ${i} ===`);
        console.log('Table text preview:', text.substring(0, 200));
        
        // Show first few rows
        const rows = table.find('tr');
        console.log(`Table has ${rows.length} rows`);
        rows.slice(0, 5).each(function(j) {
          console.log(`Row ${j}: ${$(this).text().trim()}`);
        });
      }
    });
    
    // Try to find climate section content
    if (climateHeaders.length > 0) {
      console.log('\n=== CLIMATE SECTION CONTENT ===');
      const climateSection = climateHeaders.first();
      const sectionContent = climateSection.nextUntil('h2, h3');
      console.log('Climate section text preview:', sectionContent.text().substring(0, 500));
    }
    
    return null; // Just debugging for now
    
  } catch (error) {
    console.error(`Error scraping ${cityName}:`, error.message);
    return null;
  }
}

// Run the test
testScrapeClimateData(testCity.name, testCity.country).catch(console.error);
