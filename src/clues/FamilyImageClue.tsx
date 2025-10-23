import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import React, { useState, useEffect } from 'react';
import { decryptImageToDataURL } from '../utils/ImageDecryption';
import familyImagesIndex from '../data/family-images-index.json';

export class FamilyImageClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Check if we have a family image for this city and difficulty
    return this.hasFamilyImage(targetCity.name, context.difficulty);
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get the family image URL
    const imageUrl = this.getFamilyImageUrl(targetCity.name, context.difficulty, context.rng);
    
    if (!imageUrl) {
      return null;
    }
    
    return {
      id: `family-image-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: '', // No fallback text - this is an image clue
      type: 'family-image',
      imageUrl: imageUrl,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }

  private hasFamilyImage(cityName: string, difficulty: DifficultyLevel): boolean {
    // Normalize city name to match the index format
    const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '');
    const difficultyStr = difficulty.toLowerCase();
    
    // Check if the city exists in the index and has images for this difficulty
    const idx: any = (familyImagesIndex as any).index ?? (familyImagesIndex as any).default?.index;
    return !!(idx && idx[normalizedCityName] && idx[normalizedCityName][difficultyStr] && idx[normalizedCityName][difficultyStr].length > 0);
  }

  private getFamilyImageUrl(cityName: string, difficulty: DifficultyLevel, rng: () => number): string | null {
    // Normalize city name to match the index format
    const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '');
    const difficultyStr = difficulty.toLowerCase();
    
    // Get available image indices for this city/difficulty
    const idx: any = (familyImagesIndex as any).index ?? (familyImagesIndex as any).default?.index;
    const availableIndices = idx?.[normalizedCityName]?.[difficultyStr] as number[] | undefined;
    
    if (!availableIndices || availableIndices.length === 0) {
      return null;
    }
    
    // Randomly select an index from available ones
    const randomIndex = availableIndices[Math.floor(rng() * availableIndices.length)];
    const fileName = this.createFileName(normalizedCityName, difficultyStr, randomIndex);
    
    // Return the path to the family image with correct base URL
    const baseUrl = import.meta.env.BASE_URL || '/';
    return `${baseUrl}data/familyImages/${fileName}`;
  }

  private createFileName(cityName: string, difficulty: string, index: number): string {
    // City name and difficulty are already normalized when passed to this method
    return `${cityName}-${difficulty}${index}.jpg`;
  }


  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    if (!clue.imageUrl) {
      return null;
    }
    
    return <FamilyImageRenderer clue={clue} context={context} />;
  }
}

// React component to handle image decryption
function FamilyImageRenderer({ clue, context }: { clue: ClueResult, context: RenderContext }) {
  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const decryptImage = async () => {
      if (!clue.imageUrl) {
        return;
      }
      
      setIsDecrypting(true);
      setError(null);
      
      try {
        // Get password from localStorage
        const password = localStorage.getItem('familyImagePassword');
        
        if (!password) {
          setError('Password required to view family images');
          setIsDecrypting(false);
          return;
        }
        
        // Fetch the encrypted image
        const response = await fetch(clue.imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const encryptedBuffer = await response.arrayBuffer();
        
        // Decrypt the image
        const result = await decryptImageToDataURL(encryptedBuffer, password, 'image/jpeg');
        
        if (result.success && result.data) {
          setDecryptedImageUrl(result.data as string);
        } else {
          setError(result.error || 'Failed to decrypt image');
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsDecrypting(false);
      }
    };
    
    decryptImage();
  }, [clue.imageUrl]);

  if (isDecrypting) {
    return (
      <div style={{
        margin: '0',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: context.isInModal ? 'auto' : '120px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '2px solid #ddd'
      }}>
        <span style={{ color: '#666' }}>Decrypting image...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        margin: '0',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: context.isInModal ? 'auto' : '120px',
        backgroundColor: '#ffe6e6',
        borderRadius: '8px',
        border: '2px solid #ff9999'
      }}>
        <span style={{ color: '#cc0000', textAlign: 'center' }}>
          {error}
        </span>
      </div>
    );
  }

  if (!decryptedImageUrl) {
    return null;
  }
  
  return (
    <div style={{
      margin: '0',
      padding: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: context.isInModal ? 'auto' : '100%',
      overflow: 'hidden'
    }}>
      <img 
        src={decryptedImageUrl} 
        alt="Family image" 
        onClick={() => context.onImageClick?.(decryptedImageUrl, "Family image")}
        style={{ 
          width: '100%', 
          height: context.isInModal ? 'auto' : '120px',
          maxWidth: '100%',
          maxHeight: context.isInModal ? '300px' : '120px',
          objectFit: 'cover',
          borderRadius: '8px',
          border: '2px solid #ddd',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          display: 'block',
          margin: '0',
          padding: '0'
        }}
      />
    </div>
  );
}
