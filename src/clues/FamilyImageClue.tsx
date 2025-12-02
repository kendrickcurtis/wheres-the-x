import type { ClueGenerator, ClueContext, ClueResult, DifficultyLevel, RenderContext } from './types';
import React, { useState, useEffect } from 'react';
import { decryptImageToDataURL } from '../utils/ImageDecryption';
import familyImagesIndex from '../data/family-images-index.json';
import { isFestivePuzzleDate, FESTIVE_PUZZLE_DATES } from '../utils/festivePuzzles';

// Early debug - this should show immediately when module loads
if (typeof window !== 'undefined') {
  console.log('🔍 [FamilyImageClue] Module loaded at', new Date().toISOString());
}

export class FamilyImageClue implements ClueGenerator {
  canGenerate(context: ClueContext): boolean {
    console.log('🔍 [FamilyImageClue.canGenerate] CALLED', {
      timestamp: new Date().toISOString(),
      city: context.targetCity?.name,
      isRedHerring: context.isRedHerring,
      redHerringCity: context.redHerringCity?.name,
      date: context.date,
      difficulty: context.difficulty,
      stopIndex: context.stopIndex
    });
    
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    console.log('🔍 [FamilyImageClue.canGenerate] Target city determined', {
      targetCityName: targetCity.name
    });
    
    // Check if we have a family image for this city and difficulty (or xmas for festive puzzles)
    const isFestive = context.date ? isFestivePuzzleDate(context.date) : false;
    const difficultyToCheck = isFestive ? 'xmas' : context.difficulty;
    
    console.log('🔍 [FamilyImageClue.canGenerate] Difficulty check', {
      isFestive,
      originalDifficulty: context.difficulty,
      difficultyToCheck,
      date: context.date
    });
    
    const hasImage = this.hasFamilyImage(targetCity.name, difficultyToCheck, context.difficulty);
    
    console.log('🔍 [FamilyImageClue.canGenerate] RESULT', {
      city: targetCity.name,
      isFestive,
      date: context.date,
      difficultyToCheck,
      stopIndex: context.stopIndex,
      hasImage,
      returning: hasImage
    });
    
    return hasImage;
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Use xmas difficulty for festive puzzles, otherwise use normal difficulty
    const isFestive = context.date ? isFestivePuzzleDate(context.date) : false;
    const difficultyToUse = isFestive ? 'xmas' : context.difficulty;
    
    console.log('🔍 [FamilyImageClue.generateClue] START', {
      city: targetCity.name,
      isFestive,
      date: context.date,
      difficultyToUse,
      stopIndex: context.stopIndex
    });
    
    // Get the family image URL
    const imageUrl = this.getFamilyImageUrl(
      targetCity.name, 
      difficultyToUse, 
      context.difficulty, 
      context.rng,
      context.date,
      context.stopIndex
    );
    
    console.log('🔍 [FamilyImageClue.generateClue] RESULT', {
      city: targetCity.name,
      imageUrl,
      hasImageUrl: !!imageUrl
    });
    
    if (!imageUrl) {
      console.warn('[FamilyImageClue.generateClue] No image URL returned for', targetCity.name);
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

  private hasFamilyImage(cityName: string, difficulty: string, fallbackDifficulty: DifficultyLevel): boolean {
    // Normalize city name to match the index format
    const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '');
    const difficultyStr = difficulty.toLowerCase();
    
    console.log('🔍 [FamilyImageClue.hasFamilyImage] Checking', {
      cityName,
      normalizedCityName,
      difficulty,
      difficultyStr,
      fallbackDifficulty
    });
    
    // Check if the city exists in the index and has images for this difficulty
    const idx: any = (familyImagesIndex as any).index;
    console.log('🔍 [FamilyImageClue.hasFamilyImage] Index structure check', {
      hasFamilyImagesIndex: !!familyImagesIndex,
      hasIndex: !!idx,
      indexType: typeof idx,
      sampleKeys: idx ? Object.keys(idx).slice(0, 5) : []
    });
    const hasImages = !!(idx && idx[normalizedCityName] && idx[normalizedCityName][difficultyStr] && idx[normalizedCityName][difficultyStr].length > 0);
    
    console.log('🔍 [FamilyImageClue.hasFamilyImage] Initial check', {
      hasIndex: !!idx,
      cityInIndex: !!idx?.[normalizedCityName],
      difficultyInCity: !!idx?.[normalizedCityName]?.[difficultyStr],
      indices: idx?.[normalizedCityName]?.[difficultyStr],
      hasImages
    });
    
    // If no images for requested difficulty and it's xmas, fall back to normal difficulty
    if (!hasImages && difficultyStr === 'xmas') {
      const fallbackStr = fallbackDifficulty.toLowerCase();
      const fallbackHasImages = !!(idx && idx[normalizedCityName] && idx[normalizedCityName][fallbackStr] && idx[normalizedCityName][fallbackStr].length > 0);
      console.log('🔍 [FamilyImageClue.hasFamilyImage] Xmas fallback check', {
        fallbackStr,
        fallbackHasImages
      });
      return fallbackHasImages;
    }
    
    console.log('🔍 [FamilyImageClue.hasFamilyImage] Final result:', hasImages);
    return hasImages;
  }

  private getFamilyImageUrl(
    cityName: string, 
    difficulty: string, 
    fallbackDifficulty: DifficultyLevel, 
    rng: () => number,
    date?: string,
    stopIndex?: number
  ): string | null {
    // Normalize city name to match the index format
    const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '');
    const difficultyStr = difficulty.toLowerCase();
    
    console.log('🔍 [FamilyImageClue.getFamilyImageUrl] START', {
      cityName,
      normalizedCityName,
      difficulty,
      difficultyStr,
      date,
      stopIndex
    });
    
    // Get available image indices for this city/difficulty
    const idx: any = (familyImagesIndex as any).index ?? (familyImagesIndex as any).default?.index;
    let availableIndices = idx?.[normalizedCityName]?.[difficultyStr] as number[] | undefined;
    
    console.log('[FamilyImageClue.getFamilyImageUrl] Initial lookup', {
      normalizedCityName,
      difficultyStr,
      availableIndices,
      hasIndex: !!idx,
      cityInIndex: !!idx?.[normalizedCityName],
      difficultyInCity: !!idx?.[normalizedCityName]?.[difficultyStr]
    });
    
    // If no xmas images available, fall back to normal difficulty
    if ((!availableIndices || availableIndices.length === 0) && difficultyStr === 'xmas') {
      const fallbackStr = fallbackDifficulty.toLowerCase();
      availableIndices = idx?.[normalizedCityName]?.[fallbackStr] as number[] | undefined;
      console.log('[FamilyImageClue.getFamilyImageUrl] Fallback to', fallbackStr, 'result:', availableIndices);
    }
    
    if (!availableIndices || availableIndices.length === 0) {
      console.warn('[FamilyImageClue.getFamilyImageUrl] No available indices for', normalizedCityName, difficultyStr);
      return null;
    }
    
    // For Dully at start location (stopIndex 0) in festive puzzles, use specific numbered image
    let selectedIndex: number;
    if (normalizedCityName === 'dully' && stopIndex === 0 && date && isFestivePuzzleDate(date)) {
      // Map puzzle date to image index: 3rd = 0, 9th = 1, 15th = 2, 20th = 3
      const puzzleIndex = FESTIVE_PUZZLE_DATES.indexOf(date as any);
      console.log('[FamilyImageClue.getFamilyImageUrl] Dully festive selection', {
        date,
        puzzleIndex,
        availableIndices,
        availableIndicesLength: availableIndices.length
      });
      
      if (puzzleIndex >= 0 && puzzleIndex < availableIndices.length) {
        // availableIndices contains the actual image numbers [0, 1, 2, 3]
        // Use the index at position puzzleIndex
        selectedIndex = availableIndices[puzzleIndex];
        console.log('[FamilyImageClue.getFamilyImageUrl] Using puzzle-specific index', selectedIndex);
      } else if (availableIndices.length > 0) {
        // Fallback to first available if puzzle index is out of range
        selectedIndex = availableIndices[0];
        console.log('[FamilyImageClue.getFamilyImageUrl] Fallback to first available', selectedIndex);
      } else {
        console.warn('[FamilyImageClue.getFamilyImageUrl] No images available for Dully');
        return null; // No images available
      }
    } else {
      // For other cities or non-festive puzzles, randomly select
      selectedIndex = availableIndices[Math.floor(rng() * availableIndices.length)];
      console.log('[FamilyImageClue.getFamilyImageUrl] Random selection', selectedIndex);
    }
    
    // Use the difficulty that actually has images (xmas if available, otherwise fallback)
    const actualDifficulty = (difficultyStr === 'xmas' && availableIndices && availableIndices.length > 0) ? 'xmas' : fallbackDifficulty.toLowerCase();
    const fileName = this.createFileName(normalizedCityName, actualDifficulty, selectedIndex);
    
    console.log('[FamilyImageClue.getFamilyImageUrl] Final', {
      selectedIndex,
      actualDifficulty,
      fileName
    });
    
    // Return the path to the family image with correct base URL
    const baseUrl = import.meta.env.BASE_URL || '/';
    const fullUrl = `${baseUrl}data/familyImages/${fileName}`;
    console.log('[FamilyImageClue.getFamilyImageUrl] Full URL', fullUrl);
    return fullUrl;
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
