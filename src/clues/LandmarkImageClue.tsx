import type { DifficultyLevel, ClueContext, ClueResult, RenderContext } from './types';
import { BaseImageClue } from './BaseImageClue.tsx';
import enhancedCitiesData from '../data/enhanced-cities.json';
import React from 'react';

export class LandmarkImageClue extends BaseImageClue {
  getImageType(): string {
    return 'landmark-image';
  }

  hasRelevantData(enhancedCity: any): boolean {
    return !!(enhancedCity.landmarks && enhancedCity.landmarks.length > 0);
  }

  getImageDescriptions(
    city: { name: string; country: string }, 
    _difficulty: DifficultyLevel, 
    enhancedCity: any, 
    rng: () => number
  ): string[] {
    if (!enhancedCity?.landmarks || enhancedCity.landmarks.length === 0) {
      return [`Famous landmark in ${city.name}`];
    }

    // Prioritize more distinctive landmarks over generic ones
    const landmarks = enhancedCity.landmarks;
    
    // Filter out generic landmarks that aren't very distinctive
    const genericTerms = ['old town', 'medieval town', 'historic center', 'city center', 'downtown'];
    const distinctiveLandmarks = landmarks.filter((landmark: string) => 
      !genericTerms.some(term => landmark.toLowerCase().includes(term))
    );
    
    // Use distinctive landmarks if available, otherwise fall back to all landmarks
    const availableLandmarks = distinctiveLandmarks.length > 0 ? distinctiveLandmarks : landmarks;
    
    // Return 2 landmarks for dual image display
    if (availableLandmarks.length >= 2) {
      // Shuffle and pick 2 different landmarks
      const shuffled = [...availableLandmarks].sort(() => rng() - 0.5);
      const landmark1 = shuffled[0];
      const landmark2 = shuffled[1];
      return [
        `Image of ${landmark1} in ${city.name}`,
        `Image of ${landmark2} in ${city.name}`
      ];
    } else if (availableLandmarks.length === 1) {
      // Only one landmark, use it twice
      const landmark = availableLandmarks[0];
      return [
        `Image of ${landmark} in ${city.name}`,
        `Image of ${landmark} in ${city.name}`
      ];
    } else {
      // Fallback to generic
      return [
        `Image of famous landmark in ${city.name}`,
        `Image of historic landmark in ${city.name}`
      ];
    }
  }

  async generateClue(context: ClueContext): Promise<ClueResult | null> {
    const targetCity = context.isRedHerring ? context.redHerringCity! : context.targetCity;
    
    // Get enhanced city data for more specific image clues
    const enhancedCity = enhancedCitiesData.find(city => 
      city.name === targetCity.name && city.country === targetCity.country
    );
    
    // Get 2 image descriptions
    const imageDescriptions = this.getImageDescriptions(targetCity, context.difficulty, enhancedCity, context.rng);
    
    // Fetch images for both descriptions
    const imagePromises = imageDescriptions.map(desc => 
      this.getImageUrlWithDescription(targetCity, desc)
    );
    const imageResults = await Promise.all(imagePromises);
    
    // Check if we got at least one image
    const validImages = imageResults.filter(result => result.url !== null);
    if (validImages.length === 0) {
      return null;
    }
    
    // Extract URLs and create alt texts
    const imageUrls = imageResults.map(result => result.url).filter((url): url is string => url !== null);
    const imageAltTexts = imageDescriptions.map(desc => {
      const landmark = desc.replace('Image of ', '').replace(` in ${targetCity.name}`, '').trim();
      return landmark || 'Landmark image';
    });
    
    // Generate clue text based on the first description
    const clueText = this.generateClueTextFromDescription(imageDescriptions[0]);
    
    return {
      id: `${this.getImageType()}-${context.stopIndex}-${targetCity.name}-${context.isRedHerring ? 'red' : 'normal'}`,
      text: clueText,
      type: this.getImageType() as any,
      imageUrl: imageUrls[0], // Keep for backward compatibility
      imageUrls: imageUrls, // New field for multiple images
      imageAltTexts: imageAltTexts,
      difficulty: context.difficulty,
      isRedHerring: context.isRedHerring || false,
      targetCityName: targetCity.name
    };
  }


  render(clue: ClueResult, context: RenderContext): React.ReactNode {
    // Use imageUrls if available (for 2 images), otherwise fall back to imageUrl
    const imageUrls = clue.imageUrls || (clue.imageUrl ? [clue.imageUrl] : []);
    const imageAltTexts = clue.imageAltTexts || imageUrls.map(() => 'Clue image');
    
    if (imageUrls.length === 0) return null;
    
    // For landmark-image, show 2 images side by side
    if (imageUrls.length >= 2) {
      return (
        <div style={{
          margin: '0',
          padding: '0',
          display: 'flex',
          gap: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: context.isInModal ? 'auto' : '100%',
          overflow: 'hidden'
        }}>
          {imageUrls.slice(0, 2).map((url, index) => (
            <img 
              key={index}
              src={url} 
              alt={imageAltTexts[index] || 'Clue image'} 
              onClick={() => context.onImageClick?.(url, imageAltTexts[index] || 'Clue image')}
              style={{ 
                width: 'calc(50% - 2px)', 
                height: context.isMobile ? '112px' : (context.isInModal ? 'auto' : '48px'),
                maxWidth: 'calc(50% - 2px)',
                maxHeight: context.isMobile ? '112px' : (context.isInModal ? '120px' : '48px'),
                objectFit: 'cover',
                borderRadius: '3px',
                border: '1px solid #ddd',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                display: 'block',
                margin: '0',
                padding: '0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          ))}
        </div>
      );
    }
    
    // Fallback to single image if only one available
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
          src={imageUrls[0]} 
          alt={imageAltTexts[0] || 'Clue image'} 
          onClick={() => context.onImageClick?.(imageUrls[0], imageAltTexts[0] || 'Clue image')}
          style={{ 
            width: '100%', 
            height: context.isMobile ? '112px' : (context.isInModal ? 'auto' : '48px'),
            maxWidth: '100%',
            maxHeight: context.isMobile ? '112px' : (context.isInModal ? '120px' : '48px'),
            objectFit: 'cover',
            borderRadius: '3px',
            border: '1px solid #ddd',
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
}
