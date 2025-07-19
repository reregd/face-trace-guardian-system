import { supabase } from '@/integrations/supabase/client';

export interface FaceMatch {
  id: string;
  similarity: number;
  path: string;
  name?: string;
}

export async function compareFaceEmbedding(embedding: number[]): Promise<FaceMatch | null> {
  try {
    // Appel à la fonction search_similar_faces de Supabase
    const { data, error } = await supabase.rpc('search_similar_faces', {
      input_embedding: embedding,
      similarity_threshold: 0.35,
      max_results: 1
    });

    if (error) {
      console.error('Error comparing face:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const match = data[0];
    return {
      id: match.face_id || match.id,
      similarity: match.similarity,
      path: match.image_url || match.path || '',
      name: match.name || 'Inconnu'
    };
  } catch (error) {
    console.error('Face comparison error:', error);
    return null;
  }
}

export async function uploadDetectionImage(imageBlob: Blob, matchId: string = 'unknown'): Promise<string | null> {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `detection-${timestamp}-${matchId}.jpg`;
    
    const bucket = matchId === 'unknown' ? 'faces_unknown' : 'faces_known';
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('Detection image upload error:', error);
    return null;
  }
}