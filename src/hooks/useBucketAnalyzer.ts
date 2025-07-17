import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as faceapi from '@vladmandic/face-api';

interface AnalysisResult {
  processed: number;
  faces_found: number;
  errors: string[];
}

export function useBucketAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analyzeBucket = async (bucketName: string): Promise<AnalysisResult> => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    const result: AnalysisResult = {
      processed: 0,
      faces_found: 0,
      errors: []
    };

    try {
      // List all files in the bucket recursively
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { 
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        throw listError;
      }

      if (!files || files.length === 0) {
        console.log('No files found in bucket');
        return result;
      }

      // Filter image files
      const imageFiles = files.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|webp)$/i)
      );

      console.log(`Found ${imageFiles.length} image files to analyze`);

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setProgress((i / imageFiles.length) * 100);

        try {
          // Download the image
          const { data: imageBlob, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(file.name);

          if (downloadError) {
            result.errors.push(`Failed to download ${file.name}: ${downloadError.message}`);
            continue;
          }

          // Convert blob to image element
          const imageUrl = URL.createObjectURL(imageBlob);
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
          });

          // Detect faces in the image
          const detections = await faceapi
            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          // Clean up
          URL.revokeObjectURL(imageUrl);

          if (detections.length > 0) {
            result.faces_found += detections.length;

            // Store each detected face
            for (const detection of detections) {
              const embeddings = Array.from(detection.descriptor);
              
              // Generate a name based on the file and face index
              const faceName = `${file.name.replace(/\.[^/.]+$/, '')}_face_${Date.now()}`;

              // Store in faces table
              const { error: insertError } = await supabase
                .from('faces')
                .insert({
                  name: faceName,
                  embeddings,
                  image_path: file.name,
                  status: 'active',
                  metadata: {
                    source: 'bucket_analysis',
                    bucket: bucketName,
                    detection_confidence: detection.detection.score || 0
                  }
                });

              if (insertError) {
                result.errors.push(`Failed to store face from ${file.name}: ${insertError.message}`);
              }
            }
          }

          result.processed++;

        } catch (fileError) {
          result.errors.push(`Error processing ${file.name}: ${fileError}`);
        }
      }

      setProgress(100);
      console.log(`Analysis complete: ${result.processed} files processed, ${result.faces_found} faces found`);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }

    return result;
  };

  return {
    analyzeBucket,
    isAnalyzing,
    progress,
    error
  };
}