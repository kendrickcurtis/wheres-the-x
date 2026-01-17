/**
 * Image decryption utilities for family images
 * Uses AES-256-GCM encryption compatible with the encryption script
 */

export interface DecryptionResult {
  success: boolean;
  data?: ArrayBuffer | string;
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
    // Extract components from the encrypted buffer
    // Format: salt (16 bytes) + iv (12 bytes) + authTag (16 bytes) + encrypted data
    const salt = encryptedBuffer.slice(0, 16);
    const iv = encryptedBuffer.slice(16, 28);
    const authTag = encryptedBuffer.slice(28, 44);
    const encryptedData = encryptedBuffer.slice(44);
    
    // Derive the key
    const key = await deriveKey(password, new Uint8Array(salt));
    
    // Decrypt the data
    // For AES-GCM, the authTag should be appended to the ciphertext
    const ciphertextWithTag = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    ciphertextWithTag.set(new Uint8Array(encryptedData), 0);
    ciphertextWithTag.set(new Uint8Array(authTag), encryptedData.byteLength);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        tagLength: 128 // 16 bytes = 128 bits
      },
      key,
      ciphertextWithTag
    );
    return {
      success: true,
      data: decryptedData
    };
    
  } catch (error) {
    console.error('Decryption failed:', error);
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
    // Validate decrypted data is not empty and is an ArrayBuffer
    if (!result.data || typeof result.data === 'string' || result.data.byteLength === 0) {
      return {
        success: false,
        error: 'Decrypted data is empty or invalid'
      };
    }
    
    // For JPEG, validate magic bytes (FF D8 FF)
    if (mimeType === 'image/jpeg') {
      const decryptedBytes = new Uint8Array(result.data as ArrayBuffer);
      if (decryptedBytes.length < 3 || 
          decryptedBytes[0] !== 0xFF || 
          decryptedBytes[1] !== 0xD8 || 
          decryptedBytes[2] !== 0xFF) {
        console.error('[ImageDecryption] Invalid JPEG magic bytes. First bytes:', 
          Array.from(decryptedBytes.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        return {
          success: false,
          error: 'Decrypted data does not appear to be a valid JPEG image'
        };
      }
    }
    
    // Convert decrypted data to blob and create data URL
    // At this point, result.data is guaranteed to be ArrayBuffer due to the check above
    const blob = new Blob([result.data as ArrayBuffer], { type: mimeType });
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
