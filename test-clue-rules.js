// Simple test script to verify clue generation rules
import { ClueGeneratorOrchestrator } from './src/clues/ClueGenerator.js';

// Mock cities data
const mockCities = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany' },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, country: 'Spain' },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, country: 'Italy' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738, country: 'Austria' },
  { name: 'Prague', lat: 50.0755, lng: 14.4378, country: 'Czech Republic' },
  { name: 'Warsaw', lat: 52.2297, lng: 21.0122, country: 'Poland' },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402, country: 'Hungary' }
];

// Mock RNG for consistent testing
const mockRng = () => 0.5;

async function testClueRules() {
  console.log('🧪 Testing Clue Generation Rules...\n');
  
  const clueGenerator = new ClueGeneratorOrchestrator(mockRng);
  const finalCity = mockCities[4]; // Rome
  
  // Test 1: Start location should have exactly 1 clue
  console.log('Test 1: Start location (stopIndex 0)');
  const startClues = await clueGenerator.generateCluesForLocation(
    mockCities[0], // Paris (start)
    undefined, // no previous city
    finalCity, // Rome (final)
    0, // start location
    mockCities
  );
  
  console.log(`✅ Start location has ${startClues.length} clue(s) (expected: 1)`);
  if (startClues.length !== 1) {
    console.log('❌ FAIL: Start location should have exactly 1 clue');
    return false;
  }
  
  // Test 2: Middle stops should have exactly 3 clues with different types
  console.log('\nTest 2: Middle stops (stopIndex 1-3)');
  for (let stopIndex = 1; stopIndex <= 3; stopIndex++) {
    const clues = await clueGenerator.generateCluesForLocation(
      mockCities[stopIndex], // current city
      mockCities[stopIndex - 1], // previous city
      finalCity, // Rome (final)
      stopIndex,
      mockCities
    );
    
    const clueTypes = clues.map(clue => clue.type);
    const uniqueTypes = new Set(clueTypes);
    
    console.log(`Stop ${stopIndex}: ${clues.length} clues, types: [${clueTypes.join(', ')}]`);
    
    if (clues.length !== 3) {
      console.log(`❌ FAIL: Stop ${stopIndex} should have exactly 3 clues`);
      return false;
    }
    
    if (uniqueTypes.size !== 3) {
      console.log(`❌ FAIL: Stop ${stopIndex} should have 3 different clue types`);
      return false;
    }
    
    // Check clue distribution
    const currentLocationClues = clues.filter(clue => 
      clue.targetCityName === mockCities[stopIndex].name && !clue.isRedHerring
    );
    const finalDestinationClues = clues.filter(clue => 
      clue.targetCityName === finalCity.name && !clue.isRedHerring
    );
    const redHerringClues = clues.filter(clue => clue.isRedHerring);
    
    if (currentLocationClues.length !== 1 || finalDestinationClues.length !== 1 || redHerringClues.length !== 1) {
      console.log(`❌ FAIL: Stop ${stopIndex} should have 1 current location, 1 final destination, and 1 red herring clue`);
      return false;
    }
  }
  
  // Test 3: Final destination should have exactly 1 clue
  console.log('\nTest 3: Final destination (stopIndex 4)');
  const finalClues = await clueGenerator.generateCluesForLocation(
    finalCity, // Rome (final)
    mockCities[3], // previous city
    finalCity, // Rome (final)
    4, // final destination
    mockCities
  );
  
  console.log(`✅ Final destination has ${finalClues.length} clue(s) (expected: 1)`);
  if (finalClues.length !== 1) {
    console.log('❌ FAIL: Final destination should have exactly 1 clue');
    return false;
  }
  
  // Test 4: Final destination clues should be unique across the puzzle
  console.log('\nTest 4: Final destination clue uniqueness');
  const allFinalDestinationClues = [];
  
  // Collect all final destination clues from all stops
  for (let stopIndex = 0; stopIndex <= 4; stopIndex++) {
    const clues = await clueGenerator.generateCluesForLocation(
      mockCities[stopIndex],
      stopIndex > 0 ? mockCities[stopIndex - 1] : undefined,
      finalCity, // Rome (final)
      stopIndex,
      mockCities
    );
    
    const finalDestinationClues = clues.filter(clue => 
      clue.targetCityName === finalCity.name && !clue.isRedHerring
    );
    
    finalDestinationClues.forEach(clue => {
      allFinalDestinationClues.push({
        stopIndex,
        type: clue.type,
        text: clue.text.substring(0, 50) + '...'
      });
    });
  }
  
  console.log('Final destination clues found:');
  allFinalDestinationClues.forEach(clue => {
    console.log(`  Stop ${clue.stopIndex}: ${clue.type} - ${clue.text}`);
  });
  
  const finalDestinationTypes = allFinalDestinationClues.map(clue => clue.type);
  const uniqueFinalTypes = new Set(finalDestinationTypes);
  
  console.log(`\nFinal destination clue types: [${finalDestinationTypes.join(', ')}]`);
  console.log(`Unique final destination clue types: ${uniqueFinalTypes.size}`);
  
  if (uniqueFinalTypes.size !== finalDestinationTypes.length) {
    console.log('❌ FAIL: Final destination clue types should be unique across the puzzle');
    console.log('Duplicate types found:', finalDestinationTypes.filter((type, index) => finalDestinationTypes.indexOf(type) !== index));
    return false;
  }
  
  console.log('\n✅ ALL TESTS PASSED! Clue generation rules are working correctly.');
  return true;
}

// Run the tests
testClueRules().catch(console.error);
