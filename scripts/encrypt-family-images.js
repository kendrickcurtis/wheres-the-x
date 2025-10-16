#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Encrypt family images with AES-256-GCM
 * Usage: node scripts/encrypt-family-images.js <input-directory> <password>
 */

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function encryptBuffer(buffer, password) {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine salt + iv + authTag + encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: node scripts/encrypt-family-images.js <input-directory> <password>');
    console.error('');
    console.error('Example: node scripts/encrypt-family-images.js ./my-images "my-secret-password"');
    process.exit(1);
  }
  
  const [inputDir, password] = args;
  
  // Validate input directory
  if (!fs.existsSync(inputDir)) {
    console.error(`Error: Input directory "${inputDir}" does not exist`);
    process.exit(1);
  }
  
  if (!fs.statSync(inputDir).isDirectory()) {
    console.error(`Error: "${inputDir}" is not a directory`);
    process.exit(1);
  }
  
  // Validate password
  if (!password || password.length < 1) {
    console.error('Error: Password cannot be empty');
    process.exit(1);
  }
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'data', 'familyImages');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all image files from input directory
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const files = fs.readdirSync(inputDir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
  
  if (files.length === 0) {
    console.error(`No image files found in "${inputDir}"`);
    console.error(`Supported formats: ${imageExtensions.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Found ${files.length} image files to encrypt:`);
  files.forEach(file => console.log(`  - ${file}`));
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each file
  files.forEach(file => {
    try {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      
      console.log(`Encrypting: ${file}`);
      
      // Read the image file
      const imageBuffer = fs.readFileSync(inputPath);
      
      // Encrypt the image
      const encryptedBuffer = encryptBuffer(imageBuffer, password);
      
      // Write the encrypted file
      fs.writeFileSync(outputPath, encryptedBuffer);
      
      console.log(`  ✓ Encrypted and saved to: ${outputPath}`);
      successCount++;
      
    } catch (error) {
      console.error(`  ✗ Error encrypting ${file}: ${error.message}`);
      errorCount++;
    }
  });
  
  console.log('');
  console.log(`Encryption complete!`);
  console.log(`  Successfully encrypted: ${successCount} files`);
  if (errorCount > 0) {
    console.log(`  Failed: ${errorCount} files`);
  }
  console.log(`  Output directory: ${outputDir}`);
  console.log('');
  console.log('Note: The original files were not modified. You can now delete them if desired.');
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { encryptBuffer, deriveKey };
