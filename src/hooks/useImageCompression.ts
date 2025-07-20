import { useCallback } from 'react';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export function useImageCompression() {
  const compressImage = useCallback(async (
    file: File,
    options: CompressionOptions = {}
  ): Promise<Blob> => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      maxSizeKB = 500
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to meet size requirement
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = blob.size / 1024;
              
              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                resolve(blob);
              } else {
                // Reduce quality and try again
                tryCompress(currentQuality - 0.1);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        tryCompress(quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  return {
    compressImage,
    getImageDimensions
  };
}