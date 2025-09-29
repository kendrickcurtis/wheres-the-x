import fs from 'fs';
import path from 'path';

// Read the enhanced cities data
const filePath = path.join(process.cwd(), 'src', 'data', 'enhanced-cities.json');
const citiesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Function to clean cultural events
function cleanCulturalEvents(cityName, events) {
  return events
    .map(event => {
      // Replace city name with "Local"
      let cleanedEvent = event.replace(new RegExp(cityName, 'gi'), 'Local');
      
      // Remove vague entries
      if (cleanedEvent.includes('Annual Local Fair') || 
          cleanedEvent.includes('Local Fair') ||
          cleanedEvent.includes('Annual Local') ||
          cleanedEvent === 'Local' ||
          cleanedEvent.trim() === '') {
        return null;
      }
      
      return cleanedEvent;
    })
    .filter(event => event !== null); // Remove null entries
}

// Process each city
const cleanedCities = citiesData.map(city => ({
  ...city,
  culturalEvents: cleanCulturalEvents(city.name, city.culturalEvents)
}));

// Write back to file
fs.writeFileSync(filePath, JSON.stringify(cleanedCities, null, 2));

console.log('✅ Cleaned cultural events in enhanced-cities.json');
console.log(`Processed ${cleanedCities.length} cities`);

// Show some examples of the changes
console.log('\n📋 Examples of cleaned events:');
cleanedCities.slice(0, 3).forEach(city => {
  console.log(`\n${city.name}:`);
  city.culturalEvents.forEach(event => {
    console.log(`  - ${event}`);
  });
});
