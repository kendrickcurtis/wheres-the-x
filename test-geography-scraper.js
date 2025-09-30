import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

// Test with multiple cities
const testCities = [
  {
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522
  },
  {
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278
  },
  {
    name: 'Rome',
    country: 'Italy',
    lat: 41.9028,
    lng: 12.4964
  },
  {
    name: 'Istanbul',
    country: 'Turkey',
    lat: 41.0082,
    lng: 28.9784
  }
];

async function getElevationData(lat, lng) {
  try {
    // OpenTopography API for elevation data
    const elevationUrl = `https://cloud.sdfi.dk/api/v1/dhm?lon=${lng}&lat=${lat}`;
    
    console.log(`Fetching elevation for ${lat}, ${lng}...`);
    const response = await fetch(elevationUrl);
    
    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Elevation response:', data);
    
    // Extract elevation value
    if (data && data.elevation !== undefined) {
      return Math.round(data.elevation);
    }
    
    throw new Error('No elevation data found');
  } catch (error) {
    console.error('Elevation fetch error:', error.message);
    
    // Fallback: try a different elevation service
    try {
      const fallbackUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
      console.log('Trying fallback elevation service...');
      
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('Fallback elevation response:', fallbackData);
        
        if (fallbackData.results && fallbackData.results[0] && fallbackData.results[0].elevation !== undefined) {
          return Math.round(fallbackData.results[0].elevation);
        }
      }
    } catch (fallbackError) {
      console.error('Fallback elevation error:', fallbackError.message);
    }
    
    return null;
  }
}

async function getDistanceToSea(lat, lng) {
  try {
    console.log(`Calculating distance to sea for ${lat}, ${lng}...`);
    
    // Coastline points for Europe and surrounding waters
    const coastlines = [
      // English Channel
      { name: 'English Channel', lat: 50.0, lng: 1.0 },
      { name: 'English Channel', lat: 50.0, lng: 2.0 },
      { name: 'English Channel', lat: 50.0, lng: 3.0 },
      
      // Atlantic (France/Spain/Portugal)
      { name: 'Atlantic', lat: 47.0, lng: -2.0 },
      { name: 'Atlantic', lat: 46.0, lng: -1.0 },
      { name: 'Atlantic', lat: 45.0, lng: -1.0 },
      { name: 'Atlantic', lat: 44.0, lng: -1.0 },
      { name: 'Atlantic', lat: 43.0, lng: -1.0 },
      { name: 'Atlantic', lat: 42.0, lng: -1.0 },
      { name: 'Atlantic', lat: 41.0, lng: -1.0 },
      { name: 'Atlantic', lat: 40.0, lng: -1.0 },
      { name: 'Atlantic', lat: 39.0, lng: -1.0 },
      { name: 'Atlantic', lat: 38.0, lng: -1.0 },
      { name: 'Atlantic', lat: 37.0, lng: -1.0 },
      
      // Mediterranean (Western)
      { name: 'Mediterranean', lat: 43.0, lng: 3.0 },
      { name: 'Mediterranean', lat: 43.0, lng: 4.0 },
      { name: 'Mediterranean', lat: 43.0, lng: 5.0 },
      { name: 'Mediterranean', lat: 42.0, lng: 3.0 },
      { name: 'Mediterranean', lat: 42.0, lng: 4.0 },
      { name: 'Mediterranean', lat: 42.0, lng: 5.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 3.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 4.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 5.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 6.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 7.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 8.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 9.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 10.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 11.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 12.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 13.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 14.0 },
      { name: 'Mediterranean', lat: 41.0, lng: 15.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 8.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 9.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 10.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 11.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 12.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 13.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 14.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 15.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 16.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 17.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 18.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 19.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 20.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 21.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 22.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 23.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 24.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 25.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 26.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 27.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 28.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 29.0 },
      { name: 'Mediterranean', lat: 40.0, lng: 30.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 20.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 21.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 22.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 23.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 24.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 25.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 26.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 27.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 28.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 29.0 },
      { name: 'Mediterranean', lat: 39.0, lng: 30.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 20.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 21.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 22.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 23.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 24.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 25.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 26.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 27.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 28.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 29.0 },
      { name: 'Mediterranean', lat: 38.0, lng: 30.0 },
      
      // North Sea (UK/Netherlands/Germany/Denmark)
      { name: 'North Sea', lat: 52.0, lng: 1.0 },
      { name: 'North Sea', lat: 52.0, lng: 2.0 },
      { name: 'North Sea', lat: 52.0, lng: 3.0 },
      { name: 'North Sea', lat: 52.0, lng: 4.0 },
      { name: 'North Sea', lat: 52.0, lng: 5.0 },
      { name: 'North Sea', lat: 52.0, lng: 6.0 },
      { name: 'North Sea', lat: 52.0, lng: 7.0 },
      { name: 'North Sea', lat: 52.0, lng: 8.0 },
      { name: 'North Sea', lat: 53.0, lng: 1.0 },
      { name: 'North Sea', lat: 53.0, lng: 2.0 },
      { name: 'North Sea', lat: 53.0, lng: 3.0 },
      { name: 'North Sea', lat: 53.0, lng: 4.0 },
      { name: 'North Sea', lat: 53.0, lng: 5.0 },
      { name: 'North Sea', lat: 53.0, lng: 6.0 },
      { name: 'North Sea', lat: 53.0, lng: 7.0 },
      { name: 'North Sea', lat: 53.0, lng: 8.0 },
      { name: 'North Sea', lat: 54.0, lng: 1.0 },
      { name: 'North Sea', lat: 54.0, lng: 2.0 },
      { name: 'North Sea', lat: 54.0, lng: 3.0 },
      { name: 'North Sea', lat: 54.0, lng: 4.0 },
      { name: 'North Sea', lat: 54.0, lng: 5.0 },
      { name: 'North Sea', lat: 54.0, lng: 6.0 },
      { name: 'North Sea', lat: 54.0, lng: 7.0 },
      { name: 'North Sea', lat: 54.0, lng: 8.0 },
      
      // Irish Sea (UK/Ireland)
      { name: 'Irish Sea', lat: 51.0, lng: -3.0 },
      { name: 'Irish Sea', lat: 51.0, lng: -4.0 },
      { name: 'Irish Sea', lat: 51.0, lng: -5.0 },
      { name: 'Irish Sea', lat: 52.0, lng: -3.0 },
      { name: 'Irish Sea', lat: 52.0, lng: -4.0 },
      { name: 'Irish Sea', lat: 52.0, lng: -5.0 },
      { name: 'Irish Sea', lat: 53.0, lng: -3.0 },
      { name: 'Irish Sea', lat: 53.0, lng: -4.0 },
      { name: 'Irish Sea', lat: 53.0, lng: -5.0 },
      
      // Baltic Sea (Germany/Poland/Baltic States)
      { name: 'Baltic Sea', lat: 54.0, lng: 9.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 10.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 11.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 12.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 13.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 14.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 15.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 16.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 17.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 18.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 19.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 20.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 21.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 22.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 23.0 },
      { name: 'Baltic Sea', lat: 54.0, lng: 24.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 9.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 10.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 11.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 12.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 13.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 14.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 15.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 16.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 17.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 18.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 19.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 20.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 21.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 22.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 23.0 },
      { name: 'Baltic Sea', lat: 55.0, lng: 24.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 9.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 10.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 11.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 12.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 13.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 14.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 15.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 16.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 17.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 18.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 19.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 20.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 21.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 22.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 23.0 },
      { name: 'Baltic Sea', lat: 56.0, lng: 24.0 },
      
      // Black Sea (Romania/Bulgaria/Turkey)
      { name: 'Black Sea', lat: 44.0, lng: 28.0 },
      { name: 'Black Sea', lat: 44.0, lng: 29.0 },
      { name: 'Black Sea', lat: 44.0, lng: 30.0 },
      { name: 'Black Sea', lat: 44.0, lng: 31.0 },
      { name: 'Black Sea', lat: 44.0, lng: 32.0 },
      { name: 'Black Sea', lat: 44.0, lng: 33.0 },
      { name: 'Black Sea', lat: 44.0, lng: 34.0 },
      { name: 'Black Sea', lat: 44.0, lng: 35.0 },
      { name: 'Black Sea', lat: 44.0, lng: 36.0 },
      { name: 'Black Sea', lat: 44.0, lng: 37.0 },
      { name: 'Black Sea', lat: 44.0, lng: 38.0 },
      { name: 'Black Sea', lat: 44.0, lng: 39.0 },
      { name: 'Black Sea', lat: 44.0, lng: 40.0 },
      { name: 'Black Sea', lat: 44.0, lng: 41.0 },
      { name: 'Black Sea', lat: 44.0, lng: 42.0 },
      { name: 'Black Sea', lat: 44.0, lng: 43.0 },
      { name: 'Black Sea', lat: 44.0, lng: 44.0 },
      { name: 'Black Sea', lat: 44.0, lng: 45.0 },
      { name: 'Black Sea', lat: 44.0, lng: 46.0 },
      { name: 'Black Sea', lat: 44.0, lng: 47.0 },
      { name: 'Black Sea', lat: 44.0, lng: 48.0 },
      { name: 'Black Sea', lat: 44.0, lng: 49.0 },
      { name: 'Black Sea', lat: 44.0, lng: 50.0 },
      { name: 'Black Sea', lat: 43.0, lng: 28.0 },
      { name: 'Black Sea', lat: 43.0, lng: 29.0 },
      { name: 'Black Sea', lat: 43.0, lng: 30.0 },
      { name: 'Black Sea', lat: 43.0, lng: 31.0 },
      { name: 'Black Sea', lat: 43.0, lng: 32.0 },
      { name: 'Black Sea', lat: 43.0, lng: 33.0 },
      { name: 'Black Sea', lat: 43.0, lng: 34.0 },
      { name: 'Black Sea', lat: 43.0, lng: 35.0 },
      { name: 'Black Sea', lat: 43.0, lng: 36.0 },
      { name: 'Black Sea', lat: 43.0, lng: 37.0 },
      { name: 'Black Sea', lat: 43.0, lng: 38.0 },
      { name: 'Black Sea', lat: 43.0, lng: 39.0 },
      { name: 'Black Sea', lat: 43.0, lng: 40.0 },
      { name: 'Black Sea', lat: 43.0, lng: 41.0 },
      { name: 'Black Sea', lat: 43.0, lng: 42.0 },
      { name: 'Black Sea', lat: 43.0, lng: 43.0 },
      { name: 'Black Sea', lat: 43.0, lng: 44.0 },
      { name: 'Black Sea', lat: 43.0, lng: 45.0 },
      { name: 'Black Sea', lat: 43.0, lng: 46.0 },
      { name: 'Black Sea', lat: 43.0, lng: 47.0 },
      { name: 'Black Sea', lat: 43.0, lng: 48.0 },
      { name: 'Black Sea', lat: 43.0, lng: 49.0 },
      { name: 'Black Sea', lat: 43.0, lng: 50.0 },
      
      // Caspian Sea (for eastern cities)
      { name: 'Caspian Sea', lat: 42.0, lng: 50.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 51.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 52.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 53.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 54.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 55.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 56.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 57.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 58.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 59.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 60.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 61.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 62.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 63.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 64.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 65.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 66.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 67.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 68.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 69.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 70.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 71.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 72.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 73.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 74.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 75.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 76.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 77.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 78.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 79.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 80.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 81.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 82.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 83.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 84.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 85.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 86.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 87.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 88.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 89.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 90.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 91.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 92.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 93.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 94.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 95.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 96.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 97.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 98.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 99.0 },
      { name: 'Caspian Sea', lat: 42.0, lng: 100.0 },
    ];
    
    let minDistance = Infinity;
    let nearestCoast = null;
    
    for (const coast of coastlines) {
      const distance = calculateDistance(lat, lng, coast.lat, coast.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCoast = coast;
      }
    }
    
    console.log(`Nearest coast: ${nearestCoast.name}, distance: ${Math.round(minDistance)} km`);
    return Math.round(minDistance);
    
  } catch (error) {
    console.error('Distance to sea error:', error.message);
    return null;
  }
}

function getPositionInCountry(lat, lng, country) {
  try {
    console.log(`Calculating position in ${country} for ${lat}, ${lng}...`);
    
    // Country center points (approximate)
    const countryCenters = {
      'France': { lat: 46.2276, lng: 2.2137 },
      'Germany': { lat: 51.1657, lng: 10.4515 },
      'Italy': { lat: 41.8719, lng: 12.5674 },
      'Spain': { lat: 40.4637, lng: -3.7492 },
      'United Kingdom': { lat: 55.3781, lng: -3.4360 },
      'Netherlands': { lat: 52.1326, lng: 5.2913 },
      'Austria': { lat: 47.5162, lng: 14.5501 },
      'Czech Republic': { lat: 49.8175, lng: 15.4730 },
      'Poland': { lat: 51.9194, lng: 19.1451 },
      'Sweden': { lat: 60.1282, lng: 18.6435 },
      'Norway': { lat: 60.4720, lng: 8.4689 },
      'Denmark': { lat: 56.2639, lng: 9.5018 },
      'Finland': { lat: 61.9241, lng: 25.7482 },
      'Belgium': { lat: 50.5039, lng: 4.4699 },
      'Switzerland': { lat: 46.8182, lng: 8.2275 },
      'Hungary': { lat: 47.1625, lng: 19.5033 },
      'Romania': { lat: 45.9432, lng: 24.9668 },
      'Bulgaria': { lat: 42.7339, lng: 25.4858 },
      'Croatia': { lat: 45.1000, lng: 15.2000 },
      'Slovenia': { lat: 46.1512, lng: 14.9955 },
      'Slovakia': { lat: 48.6690, lng: 19.6990 },
      'Lithuania': { lat: 55.1694, lng: 23.8813 },
      'Latvia': { lat: 56.8796, lng: 24.6032 },
      'Estonia': { lat: 58.5953, lng: 25.0136 },
      'Ireland': { lat: 53.4129, lng: -8.2439 },
      'Portugal': { lat: 39.3999, lng: -8.2245 },
      'Greece': { lat: 39.0742, lng: 21.8243 },
      'Cyprus': { lat: 35.1264, lng: 33.4299 },
      'Malta': { lat: 35.9375, lng: 14.3754 },
      'Luxembourg': { lat: 49.8153, lng: 6.1296 },
      'Monaco': { lat: 43.7384, lng: 7.4246 },
      'San Marino': { lat: 43.9424, lng: 12.4578 },
      'Vatican City': { lat: 41.9029, lng: 12.4534 },
      'Andorra': { lat: 42.5462, lng: 1.6016 },
      'Liechtenstein': { lat: 47.1660, lng: 9.5554 },
      'Iceland': { lat: 64.9631, lng: -19.0208 },
      'Russia': { lat: 61.5240, lng: 105.3188 },
      'Ukraine': { lat: 48.3794, lng: 31.1656 },
      'Belarus': { lat: 53.7098, lng: 27.9534 },
      'Moldova': { lat: 47.4116, lng: 28.3699 },
      'Georgia': { lat: 42.3154, lng: 43.3569 },
      'Armenia': { lat: 40.0691, lng: 45.0382 },
      'Azerbaijan': { lat: 40.1431, lng: 47.5769 },
      'Turkey': { lat: 38.9637, lng: 35.2433 }
    };
    
    const center = countryCenters[country];
    if (!center) {
      console.log(`No center data for ${country}`);
      return null;
    }
    
    // Calculate bearing from center to city
    const bearing = calculateBearing(center.lat, center.lng, lat, lng);
    
    // Convert bearing to cardinal direction
    const direction = bearingToCardinal(bearing);
    
    console.log(`Position: ${direction} (bearing: ${Math.round(bearing)}°)`);
    return direction;
    
  } catch (error) {
    console.error('Position calculation error:', error.message);
    return null;
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = deg2rad(lng2 - lng1);
  const lat1Rad = deg2rad(lat1);
  const lat2Rad = deg2rad(lat2);
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  let bearing = Math.atan2(y, x);
  bearing = rad2deg(bearing);
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

function bearingToCardinal(bearing) {
  const directions = [
    { name: 'North', min: 337.5, max: 22.5 },
    { name: 'Northeast', min: 22.5, max: 67.5 },
    { name: 'East', min: 67.5, max: 112.5 },
    { name: 'Southeast', min: 112.5, max: 157.5 },
    { name: 'South', min: 157.5, max: 202.5 },
    { name: 'Southwest', min: 202.5, max: 247.5 },
    { name: 'West', min: 247.5, max: 292.5 },
    { name: 'Northwest', min: 292.5, max: 337.5 }
  ];
  
  for (const dir of directions) {
    if (bearing >= dir.min || bearing < dir.max) {
      return dir.name;
    }
  }
  
  return 'North'; // fallback
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function rad2deg(rad) {
  return rad * (180/Math.PI);
}

async function testGeographyData() {
  for (const city of testCities) {
    console.log(`\nTesting geography data for ${city.name}, ${city.country}`);
    console.log(`Coordinates: ${city.lat}, ${city.lng}`);
    console.log('---');
    
    // Get elevation
    const elevation = await getElevationData(city.lat, city.lng);
    console.log(`Elevation: ${elevation ? elevation + 'm' : 'Failed'}`);
    
    // Get distance to sea
    const distanceToSea = await getDistanceToSea(city.lat, city.lng);
    console.log(`Distance to sea: ${distanceToSea ? distanceToSea + 'km' : 'Failed'}`);
    
    // Get position in country
    const position = getPositionInCountry(city.lat, city.lng, city.country);
    console.log(`Position in country: ${position || 'Failed'}`);
    
    console.log('---');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nGeography data test complete!');
}

testGeographyData().catch(console.error);
