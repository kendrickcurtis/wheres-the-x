/**
 * Image decryption utilities for family images
 * Uses AES-256-GCM encryption compatible with the encryption script
 */

export interface DecryptionResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

/**
 * Derive a key from password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Decrypt an encrypted image buffer
 */
export async function decryptImageBuffer(
  encryptedBuffer: ArrayBuffer, 
  password: string
): Promise<DecryptionResult> {
  try {
    console.log('🔓 Starting decryption...');
    console.log('📦 Buffer size:', encryptedBuffer.byteLength);
    console.log('🔑 Password length:', password.length);
    
    // Extract components from the encrypted buffer
    // Format: salt (16 bytes) + iv (12 bytes) + authTag (16 bytes) + encrypted data
    const salt = encryptedBuffer.slice(0, 16);
    const iv = encryptedBuffer.slice(16, 28);
    const authTag = encryptedBuffer.slice(28, 44);
    const encryptedData = encryptedBuffer.slice(44);
    
    console.log('🧂 Salt length:', salt.byteLength);
    console.log('🔢 IV length:', iv.byteLength);
    console.log('🏷️ AuthTag length:', authTag.byteLength);
    console.log('📄 Encrypted data length:', encryptedData.byteLength);
    
    // Derive the key
    console.log('🔑 Deriving key...');
    const key = await deriveKey(password, new Uint8Array(salt));
    console.log('✅ Key derived successfully');
    
    // Decrypt the data
    // For AES-GCM, the authTag should be appended to the ciphertext
    const ciphertextWithTag = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    ciphertextWithTag.set(new Uint8Array(encryptedData), 0);
    ciphertextWithTag.set(new Uint8Array(authTag), encryptedData.byteLength);
    
    console.log('🔓 Attempting decryption...');
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        tagLength: 128 // 16 bytes = 128 bits
      },
      key,
      ciphertextWithTag
    );
    
    console.log('✅ Decryption successful!');
    return {
      success: true,
      data: decryptedData
    };
    
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decryption error'
    };
  }
}

/**
 * Decrypt an encrypted image file and return as a data URL
 */
export async function decryptImageToDataURL(
  encryptedBuffer: ArrayBuffer, 
  password: string,
  mimeType: string = 'image/jpeg'
): Promise<DecryptionResult> {
  const result = await decryptImageBuffer(encryptedBuffer, password);
  
  if (!result.success || !result.data) {
    return result;
  }
  
  try {
    // Convert decrypted data to blob and create data URL
    const blob = new Blob([result.data], { type: mimeType });
    const dataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    return {
      success: true,
      data: dataURL as any // Type assertion for data URL string
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create data URL'
    };
  }
}

/**
 * Check if a password is valid by attempting to decrypt a test file
 */
export async function validatePassword(password: string): Promise<boolean> {
  // This would need to be implemented with a known test file
  // For now, we'll just check if the password is not empty
  return password.length > 0;
}
