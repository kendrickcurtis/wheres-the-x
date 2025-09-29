// Service for fetching real images from various APIs
export interface ImageSearchResult {
  url: string;
  title: string;
  source: string;
}

export class ImageService {
  private static readonly WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
  private static readonly UNSPLASH_API = 'https://api.unsplash.com';

  /**
   * Search for images on Wikimedia Commons
   * Free, no API key required
   */
  static async searchWikimediaImages(query: string, limit: number = 1): Promise<ImageSearchResult[]> {
    try {
      console.log(`🔍 Searching Wikimedia for: "${query}"`);
      
      // Simplify the search query - remove the complex exclusions for now
      const searchQuery = encodeURIComponent(query);
      const url = `${this.WIKIMEDIA_API}?action=query&format=json&list=search&srsearch=${searchQuery}&srnamespace=6&srlimit=${limit * 5}&origin=*`;
      
      console.log(`📡 API URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📊 API Response:`, data);
      
      if (!data.query?.search) {
        console.log(`❌ No search results found for: "${query}"`);
        return [];
      }
      
      console.log(`✅ Found ${data.query.search.length} search results`);
      
      const results: ImageSearchResult[] = [];
      
      for (const item of data.query.search) {
        console.log(`🔍 Processing result: ${item.title}`);
        
        // Filter out non-image file types
        const fileName = item.title.toLowerCase();
        if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
            fileName.endsWith('.txt') || fileName.endsWith('.svg')) {
          console.log(`🚫 Skipping non-image file: ${item.title}`);
          continue;
        }
        
        // Get image info to get the actual URL
        const imageInfo = await this.getWikimediaImageInfo(item.title);
        if (imageInfo) {
          console.log(`✅ Got image info for: ${item.title}`);
          results.push({
            url: imageInfo.url,
            title: item.title,
            source: 'Wikimedia Commons'
          });
          
          // Stop when we have enough results
          if (results.length >= limit) {
            break;
          }
        } else {
          console.log(`❌ No image info for: ${item.title}`);
        }
      }
      
      console.log(`📸 Final results: ${results.length} images found`);
      return results;
    } catch (error) {
      console.error('Wikimedia search error:', error);
      return [];
    }
  }

  /**
   * Get image information and URL from Wikimedia
   */
  private static async getWikimediaImageInfo(title: string): Promise<{ url: string } | null> {
    try {
      const encodedTitle = encodeURIComponent(title);
      const url = `${this.WIKIMEDIA_API}?action=query&format=json&titles=${encodedTitle}&prop=imageinfo&iiprop=url&origin=*`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const pages = data.query?.pages;
      if (!pages) return null;
      
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      
      if (page.imageinfo?.[0]?.url) {
        // Use Wikimedia's thumbnail service to avoid CORS issues
        const originalUrl = page.imageinfo[0].url;
        // Construct thumbnail URL using Wikimedia's thumbnail service
        const fileName = title.split(':').pop() || title;
        const thumbnailUrl = `https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(fileName)}&w=300`;
        console.log(`🖼️ Original: ${originalUrl} -> Thumbnail: ${thumbnailUrl}`);
        return { url: thumbnailUrl };
      }
      
      return null;
    } catch (error) {
      console.error('Wikimedia image info error:', error);
      return null;
    }
  }

  /**
   * Search for images on Unsplash (requires API key)
   * Uncomment and configure if you want to use Unsplash
   */
  /*
  static async searchUnsplashImages(query: string, apiKey: string, limit: number = 1): Promise<ImageSearchResult[]> {
    try {
      const searchQuery = encodeURIComponent(query);
      const url = `${this.UNSPLASH_API}/search/photos?query=${searchQuery}&per_page=${limit}&client_id=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.results?.map((photo: any) => ({
        url: photo.urls.regular,
        title: photo.description || photo.alt_description || query,
        source: 'Unsplash'
      })) || [];
    } catch (error) {
      console.error('Unsplash search error:', error);
      return [];
    }
  }
  */

  /**
   * Fallback to placeholder if no real images found
   */
  static getPlaceholderImage(text: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): string {
    const baseUrl = 'https://via.placeholder.com';
    const colors = {
      EASY: '2E7D32',    // Green for landmarks
      MEDIUM: 'E65100',  // Orange for cuisines/traditions  
      HARD: '424242'     // Gray for street scenes
    };
    
    return `${baseUrl}/400x300/${colors[difficulty]}/FFFFFF?text=${encodeURIComponent(text)}&font-size=16`;
  }
}
