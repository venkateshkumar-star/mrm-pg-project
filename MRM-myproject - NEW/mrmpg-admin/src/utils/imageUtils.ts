import { AuthManager } from './authUtils';
import { useState, useEffect } from 'react';

interface ImageCache {
  [key: string]: string;
}

class ImageUtility {
  private static cache: ImageCache = {};
  private static baseURL = import.meta.env.VITE_APP_BASE_URL;

  static async getImage(imagePath: string, useCache: boolean = true): Promise<string> {
    if (!imagePath) {
      throw new Error('Image path is required');
    }

    // Return cached version if available and useCache is true
    if (useCache && this.cache[imagePath]) {
      return this.cache[imagePath];
    }

    try {
      const authHeaders = AuthManager.getAuthHeader();
      
      const response = await fetch(`${this.baseURL}${imagePath}`, {
        method: 'GET',
        headers: authHeaders as HeadersInit,
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthManager.clearAuthData();
          window.location.href = '/login';
          throw new Error('Authentication expired');
        }
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Get the image as blob
      const blob = await response.blob();
      
      // Create object URL
      const objectURL = URL.createObjectURL(blob);
      
      // Cache the object URL if caching is enabled
      if (useCache) {
        this.cache[imagePath] = objectURL;
      }

      return objectURL;
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }

  static getImageSync(imagePath: string): string {
    if (!imagePath) {
      return this.getPlaceholderImage();
    }

    // Return cached version if available
    if (this.cache[imagePath]) {
      return this.cache[imagePath];
    }

    // Trigger async loading in background
    this.getImage(imagePath).catch(error => {
      console.error('Background image loading failed:', error);
    });

    // Return placeholder for now
    return this.getPlaceholderImage();
  }

  static clearCache(imagePath?: string): void {
    if (imagePath) {
      if (this.cache[imagePath]) {
        URL.revokeObjectURL(this.cache[imagePath]);
        delete this.cache[imagePath];
      }
    } else {
      // Clear all cached images
      Object.values(this.cache).forEach(url => URL.revokeObjectURL(url));
      this.cache = {};
    }
  }

 
  private static getPlaceholderImage(): string {

    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
  }

 
  static async preloadImages(imagePaths: string[]): Promise<void> {
    const promises = imagePaths.map(path => 
      this.getImage(path).catch(error => {
        console.warn(`Failed to preload image ${path}:`, error);
        return null;
      })
    );
    
    await Promise.allSettled(promises);
  }


  static getCachedImage(imagePath: string): string | null {
    return this.cache[imagePath] || null;
  }
}


export function useImage(imagePath: string): { imageUrl: string | null; loading: boolean; error: string | null } {
  const [state, setState] = useState<{
    imageUrl: string | null;
    loading: boolean;
    error: string | null;
  }>({
    imageUrl: ImageUtility.getCachedImage(imagePath) || null,
    loading: !ImageUtility.getCachedImage(imagePath) && !!imagePath,
    error: null
  });

  useEffect(() => {
    if (!imagePath) {
      setState({ imageUrl: null, loading: false, error: null });
      return;
    }

    const cachedUrl = ImageUtility.getCachedImage(imagePath);
    if (cachedUrl) {
      setState({ imageUrl: cachedUrl, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    ImageUtility.getImage(imagePath)
      .then(url => {
        setState({ imageUrl: url, loading: false, error: null });
      })
      .catch(error => {
        setState({ imageUrl: null, loading: false, error: error.message });
      });
  }, [imagePath]);

  return state;
}

// Export the utility functions
export const getImage = ImageUtility.getImage.bind(ImageUtility);
export const getImageSync = ImageUtility.getImageSync.bind(ImageUtility);
export const clearImageCache = ImageUtility.clearCache.bind(ImageUtility);
export const preloadImages = ImageUtility.preloadImages.bind(ImageUtility);

export default ImageUtility;
