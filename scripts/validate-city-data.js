import fs from 'fs';
import path from 'path';

// Read the enhanced cities data
const filePath = path.join(process.cwd(), 'src', 'data', 'enhanced-cities.json');
const citiesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Geographic validation data
const countryGeographicFeatures = {
  'Netherlands': ['River', 'Coastline', 'Canals', 'Polders'],
  'Denmark': ['River', 'Coastline', 'Islands'],
  'Belgium': ['River', 'Coastline', 'Plains'],
  'Luxembourg': ['River', 'Hills', 'Forests'],
  'Switzerland': ['River', 'Mountain range', 'Alps', 'Lakes'],
  'Austria': ['River', 'Mountain range', 'Alps', 'Forests'],
  'Germany': ['River', 'Mountain range', 'Forests', 'Coastline'],
  'France': ['River', 'Mountain range', 'Coastline', 'Plains'],
  'Italy': ['River', 'Mountain range', 'Coastline', 'Alps'],
  'Spain': ['River', 'Mountain range', 'Coastline', 'Plains'],
  'Portugal': ['River', 'Coastline', 'Hills'],
  'United Kingdom': ['River', 'Coastline', 'Hills', 'Plains'],
  'Ireland': ['River', 'Coastline', 'Hills', 'Plains'],
  'Norway': ['River', 'Mountain range', 'Coastline', 'Fjords'],
  'Sweden': ['River', 'Mountain range', 'Coastline', 'Lakes', 'Forests'],
  'Finland': ['River', 'Coastline', 'Lakes', 'Forests'],
  'Iceland': ['River', 'Mountain range', 'Coastline', 'Volcanoes', 'Geysers'],
  'Poland': ['River', 'Coastline', 'Plains', 'Hills'],
  'Czech Republic': ['River', 'Mountain range', 'Hills', 'Forests'],
  'Slovakia': ['River', 'Mountain range', 'Hills', 'Forests'],
  'Hungary': ['River', 'Plains', 'Hills'],
  'Slovenia': ['River', 'Mountain range', 'Coastline', 'Hills'],
  'Croatia': ['River', 'Coastline', 'Hills', 'Islands'],
  'Romania': ['River', 'Mountain range', 'Plains', 'Hills'],
  'Bulgaria': ['River', 'Mountain range', 'Coastline', 'Hills'],
  'Greece': ['River', 'Mountain range', 'Coastline', 'Islands'],
  'Cyprus': ['River', 'Coastline', 'Hills'],
  'Malta': ['Coastline', 'Hills'],
  'Monaco': ['Coastline', 'Hills'],
  'San Marino': ['Hills', 'Mountain range'],
  'Vatican City': ['Hills'],
  'Andorra': ['Mountain range', 'Hills', 'Rivers'],
  'Liechtenstein': ['River', 'Mountain range', 'Hills'],
  'Russia': ['River', 'Mountain range', 'Coastline', 'Plains', 'Forests'],
  'Ukraine': ['River', 'Coastline', 'Plains', 'Hills'],
  'Belarus': ['River', 'Plains', 'Hills', 'Forests'],
  'Moldova': ['River', 'Hills', 'Plains'],
  'Georgia': ['River', 'Mountain range', 'Coastline', 'Hills'],
  'Armenia': ['River', 'Mountain range', 'Hills'],
  'Azerbaijan': ['River', 'Mountain range', 'Coastline', 'Hills'],
  'Turkey': ['River', 'Mountain range', 'Coastline', 'Hills']
};

// Climate validation data
const countryClimates = {
  'Netherlands': 'Temperate',
  'Denmark': 'Temperate',
  'Belgium': 'Temperate',
  'Luxembourg': 'Temperate',
  'Switzerland': 'Temperate',
  'Austria': 'Temperate',
  'Germany': 'Temperate',
  'France': 'Temperate',
  'Italy': 'Mediterranean',
  'Spain': 'Mediterranean',
  'Portugal': 'Mediterranean',
  'United Kingdom': 'Temperate',
  'Ireland': 'Temperate',
  'Norway': 'Temperate',
  'Sweden': 'Temperate',
  'Finland': 'Temperate',
  'Iceland': 'Subarctic',
  'Poland': 'Temperate',
  'Czech Republic': 'Temperate',
  'Slovakia': 'Temperate',
  'Hungary': 'Temperate',
  'Slovenia': 'Temperate',
  'Croatia': 'Mediterranean',
  'Romania': 'Temperate',
  'Bulgaria': 'Temperate',
  'Greece': 'Mediterranean',
  'Cyprus': 'Mediterranean',
  'Malta': 'Mediterranean',
  'Monaco': 'Mediterranean',
  'San Marino': 'Temperate',
  'Vatican City': 'Mediterranean',
  'Andorra': 'Temperate',
  'Liechtenstein': 'Temperate',
  'Russia': 'Temperate',
  'Ukraine': 'Temperate',
  'Belarus': 'Temperate',
  'Moldova': 'Temperate',
  'Georgia': 'Temperate',
  'Armenia': 'Temperate',
  'Azerbaijan': 'Temperate',
  'Turkey': 'Temperate'
};

// Function to validate and fix geographic features
function validateGeographicFeatures(city) {
  const country = city.country;
  const validFeatures = countryGeographicFeatures[country] || ['River', 'Coastline', 'Hills'];
  
  // Remove invalid features and add valid ones if missing
  let validatedFeatures = city.geographicFeatures
    .filter(feature => validFeatures.includes(feature))
    .concat(validFeatures.filter(feature => !city.geographicFeatures.includes(feature)));
  
  // Special cases for countries with distinctive features
  if (country === 'Norway' && !validatedFeatures.includes('Fjords')) {
    validatedFeatures = validatedFeatures.filter(f => f !== 'Coastline').concat(['Fjords']);
  }
  if (country === 'Iceland' && !validatedFeatures.includes('Volcanoes')) {
    validatedFeatures = validatedFeatures.filter(f => f !== 'Mountain range').concat(['Volcanoes']);
  }
  
  validatedFeatures = validatedFeatures.slice(0, 3); // Keep max 3 features
  
  return validatedFeatures;
}

// Function to validate climate
function validateClimate(city) {
  return countryClimates[city.country] || 'Temperate';
}

// Function to validate population (rough sanity checks)
function validatePopulation(city) {
  const name = city.name;
  const country = city.country;
  
  // Known major cities with rough population estimates
  const majorCityPopulations = {
    'London': 9000000,
    'Paris': 11000000,
    'Berlin': 3700000,
    'Madrid': 3200000,
    'Rome': 2800000,
    'Amsterdam': 900000,
    'Vienna': 1900000,
    'Prague': 1300000,
    'Warsaw': 1800000,
    'Stockholm': 1000000,
    'Oslo': 700000,
    'Copenhagen': 800000,
    'Helsinki': 650000,
    'Brussels': 1200000,
    'Zurich': 400000,
    'Budapest': 1700000,
    'Bucharest': 1900000,
    'Sofia': 1300000,
    'Zagreb': 800000,
    'Ljubljana': 280000,
    'Bratislava': 430000,
    'Vilnius': 540000,
    'Riga': 600000,
    'Tallinn': 430000,
    'Dublin': 1200000,
    'Lisbon': 550000,
    'Athens': 3200000,
    'Nicosia': 200000,
    'Valletta': 6000,
    'Luxembourg': 120000,
    'Monaco': 38000,
    'San Marino': 33000,
    'Vatican City': 800,
    'Andorra la Vella': 22000,
    'Liechtenstein': 38000,
    'Iceland': 370000,
    'Moscow': 12000000,
    'Saint Petersburg': 5400000,
    'Kiev': 3000000,
    'Minsk': 2000000,
    'Chisinau': 700000,
    'Tbilisi': 1100000,
    'Yerevan': 1100000,
    'Baku': 2300000,
    'Ankara': 5500000,
    'Istanbul': 15000000
  };
  
  return majorCityPopulations[name] || city.population;
}

// Function to validate region (basic checks)
function validateRegion(city) {
  const country = city.country;
  const name = city.name;
  
  // Some basic region validations
  const regionMappings = {
    'Netherlands': ['North Holland', 'South Holland', 'Utrecht', 'Central'],
    'Germany': ['Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Central'],
    'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Central'],
    'Italy': ['Lazio', 'Lombardy', 'Tuscany', 'Central'],
    'Spain': ['Catalonia', 'Madrid', 'Andalusia', 'Central'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Russia': ['Moscow Oblast', 'Leningrad Oblast', 'Central'],
    'Turkey': ['Marmara', 'Central Anatolia', 'Aegean', 'Central']
  };
  
  const validRegions = regionMappings[country];
  if (validRegions && !validRegions.includes(city.region)) {
    return validRegions[0]; // Use first valid region
  }
  
  return city.region;
}

// Process each city
const validatedCities = citiesData.map(city => {
  const validated = {
    ...city,
    geographicFeatures: validateGeographicFeatures(city),
    climate: validateClimate(city),
    population: validatePopulation(city),
    region: validateRegion(city)
  };
  
  return validated;
});

// Write back to file
fs.writeFileSync(filePath, JSON.stringify(validatedCities, null, 2));

console.log('✅ Validated and corrected city data in enhanced-cities.json');
console.log(`Processed ${validatedCities.length} cities`);

// Show some examples of corrections
console.log('\n📋 Examples of corrections made:');
const examples = [
  { name: 'Amsterdam', country: 'Netherlands' },
  { name: 'Zurich', country: 'Switzerland' },
  { name: 'Monaco', country: 'Monaco' },
  { name: 'Vatican City', country: 'Vatican City' }
];

examples.forEach(example => {
  const city = validatedCities.find(c => c.name === example.name);
  if (city) {
    console.log(`\n${city.name} (${city.country}):`);
    console.log(`  Climate: ${city.climate}`);
    console.log(`  Geographic Features: ${city.geographicFeatures.join(', ')}`);
    console.log(`  Population: ${city.population.toLocaleString()}`);
  }
});

// Report any major issues found
console.log('\n🔍 Validation Summary:');
const issues = [];

validatedCities.forEach(city => {
  // Check for remaining issues
  if (city.country === 'Netherlands' && city.geographicFeatures.includes('Mountain range')) {
    issues.push(`${city.name}: Still has "Mountain range" despite being in Netherlands`);
  }
  if (city.country === 'Iceland' && !city.geographicFeatures.includes('Volcanoes')) {
    issues.push(`${city.name}: Missing "Volcanoes" for Iceland`);
  }
  if (city.country === 'Norway' && !city.geographicFeatures.includes('Fjords')) {
    issues.push(`${city.name}: Missing "Fjords" for Norway`);
  }
});

if (issues.length > 0) {
  console.log('\n⚠️  Remaining issues:');
  issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✅ No major validation issues found!');
}
