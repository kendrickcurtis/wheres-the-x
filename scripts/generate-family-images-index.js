#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate an index of available family images at build time
 * This creates a JSON file that the browser can use to check which images are available
 */

function main() {
  const familyImagesDir = path.join(__dirname, '..', 'public', 'data', 'familyImages');
  const outputFile = path.join(__dirname, '..', 'src', 'data', 'family-images-index.json');
  
  if (!fs.existsSync(familyImagesDir)) {
    console.error(`Family images directory not found: ${familyImagesDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(familyImagesDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
  });
  
  // Parse filenames to extract city, difficulty, and index
  const index = {};
  
  imageFiles.forEach(file => {
    // Expected format: {city}-{difficulty}{index}.{ext}
    const baseName = path.basename(file, path.extname(file));
    const match = baseName.match(/^(.+)-([a-z]+)(\d+)$/);
    
    if (match) {
      const [, city, difficulty, indexStr] = match;
      const imageIndex = parseInt(indexStr, 10);
      
      if (!index[city]) {
        index[city] = {};
      }
      
      if (!index[city][difficulty]) {
        index[city][difficulty] = [];
      }
      
      index[city][difficulty].push(imageIndex);
    } else {
      console.warn(`Warning: Could not parse filename: ${file}`);
    }
  });
  
  // Sort indices for each city/difficulty combination
  Object.keys(index).forEach(city => {
    Object.keys(index[city]).forEach(difficulty => {
      index[city][difficulty].sort((a, b) => a - b);
    });
  });
  
  // Write the index file
  const indexData = {
    generatedAt: new Date().toISOString(),
    totalImages: imageFiles.length,
    cities: Object.keys(index).sort(),
    index
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(indexData, null, 2));
  
  console.log(`Generated family images index:`);
  console.log(`  Total images: ${imageFiles.length}`);
  console.log(`  Cities: ${Object.keys(index).length}`);
  console.log(`  Output: ${outputFile}`);
  console.log(`  Cities: ${Object.keys(index).sort().join(', ')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
