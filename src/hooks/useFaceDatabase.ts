import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// TensorFlow.js will be imported dynamically to avoid build issues
import { FACE_RECOGNITION_CONFIG } from '@/constants';

export interface FaceData {
  id?: number;
  name: string;
  embeddings: number[];
  image_path?: string;
  metadata?: any;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface FaceMatch {
  face: FaceData;
  confidence: number;
  distance: number;
}

export function useFaceDatabase() {
  const [faces, setFaces] = useState<FaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('faces')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFaces((data || []) as FaceData[]);
    } catch (err) {
      console.error('Load faces error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load faces');
    } finally {
      setLoading(false);
    }
  };

  const addFace = async (faceData: Omit<FaceData, 'id' | 'created_at' | 'updated_at'>): Promise<FaceData | null> => {
    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('faces')
        .insert([faceData])
        .select()
        .single();

      if (insertError) throw insertError;

      setFaces(prev => [data as FaceData, ...prev]);
      return data as FaceData;
    } catch (err) {
      console.error('Add face error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add face');
      return null;
    }
  };

  const updateFace = async (id: number, updates: Partial<FaceData>): Promise<boolean> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('faces')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setFaces(prev => prev.map(face => 
        face.id === id ? { ...face, ...updates } : face
      ));

      return true;
    } catch (err) {
      console.error('Update face error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update face');
      return false;
    }
  };

  const deleteFace = async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('faces')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (deleteError) throw deleteError;

      setFaces(prev => prev.filter(face => face.id !== id));
      return true;
    } catch (err) {
      console.error('Delete face error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete face');
      return false;
    }
  };

  // Extract face embeddings from image data
  const extractFaceEmbeddings = async (imageData: ImageData): Promise<number[] | null> => {
    try {
      // For now, we'll create a simplified feature vector without TensorFlow
      // In production, you would use a pre-trained face recognition model
      // like FaceNet, ArcFace, or similar with proper TensorFlow.js integration
      
      // Create a simplified hash-based embedding from image data
      const { data, width, height } = imageData;
      const embeddings: number[] = [];
      
      // Sample pixels at regular intervals to create a feature vector
      const step = Math.max(1, Math.floor(data.length / 512)); // Sample 512 points
      
      for (let i = 0; i < data.length; i += step) {
        const r = data[i] || 0;
        const g = data[i + 1] || 0;
        const b = data[i + 2] || 0;
        
        // Convert to grayscale and normalize
        const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        embeddings.push(gray);
      }
      
      // Normalize to exactly 128 dimensions
      const normalized = embeddings.slice(0, 128);
      while (normalized.length < 128) {
        normalized.push(0);
      }
      
      return normalized;
    } catch (err) {
      console.error('Embedding extraction error:', err);
      return null;
    }
  };

  // Calculate cosine similarity between two embedding vectors
  const calculateSimilarity = (embedding1: number[], embedding2: number[]): number => {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  };

  // Find best match for given embeddings
  const findMatch = async (queryEmbeddings: number[]): Promise<FaceMatch | null> => {
    if (faces.length === 0) {
      return null;
    }

    let bestMatch: FaceMatch | null = null;
    let highestSimilarity = 0;

    for (const face of faces) {
      if (!face.embeddings || face.embeddings.length === 0) {
        continue;
      }

      const similarity = calculateSimilarity(queryEmbeddings, face.embeddings);
      
      if (similarity > highestSimilarity && similarity >= FACE_RECOGNITION_CONFIG.MATCH_CONFIDENCE_THRESHOLD) {
        highestSimilarity = similarity;
        bestMatch = {
          face,
          confidence: similarity,
          distance: 1 - similarity
        };
      }
    }

    return bestMatch;
  };

  // Background matching process for unknown faces
  const startBackgroundMatching = async (
    faceId: string,
    embeddings: number[],
    logId: number
  ) => {
    const startTime = Date.now();
    const endTime = startTime + FACE_RECOGNITION_CONFIG.BACKGROUND_SEARCH_DURATION;

    const checkForMatch = async () => {
      try {
        // Reload faces in case new ones were added
        await loadFaces();
        
        const match = await findMatch(embeddings);
        
        if (match) {
          // Log the background match found
          console.log('Background match found:', match);
          return true;
        }

        // Continue searching if time hasn't expired
        if (Date.now() < endTime) {
          setTimeout(checkForMatch, 30000); // Check every 30 seconds
        }
        
        return false;
      } catch (err) {
        console.error('Background matching error:', err);
        return false;
      }
    };

    // Start the background search
    setTimeout(checkForMatch, 30000); // Wait 30 seconds before first check
  };

  // Load faces on mount
  useEffect(() => {
    loadFaces();
  }, []);

  return {
    faces,
    loading,
    error,
    loadFaces,
    addFace,
    updateFace,
    deleteFace,
    extractFaceEmbeddings,
    findMatch,
    startBackgroundMatching
  };
}