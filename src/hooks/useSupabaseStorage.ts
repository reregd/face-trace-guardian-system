import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FACE_RECOGNITION_CONFIG } from '@/constants';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export function useSupabaseStorage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    bucket: string,
    file: File | Blob,
    filename: string
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setError(null);

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        path: data.path,
        publicUrl
      };
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadFromDataURL = async (
    bucket: string,
    dataUrl: string,
    filename: string
  ): Promise<UploadResult | null> => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      return await uploadImage(bucket, blob, filename);
    } catch (err) {
      console.error('Data URL upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  };

  const listFiles = async (bucket: string, folder?: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder || '', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('List files error:', err);
      setError(err instanceof Error ? err.message : 'Failed to list files');
      return [];
    }
  };

  const deleteFile = async (bucket: string, path: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Delete file error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      return false;
    }
  };

  const moveFile = async (
    fromBucket: string,
    toBucket: string,
    filePath: string,
    newFileName?: string
  ) => {
    try {
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(fromBucket)
        .download(filePath);

      if (downloadError) throw downloadError;

      // Upload to new bucket
      const fileName = newFileName || filePath.split('/').pop() || 'moved_file';
      const uploadResult = await uploadImage(toBucket, fileData, fileName);

      if (!uploadResult) return false;

      // Delete from original bucket
      await deleteFile(fromBucket, filePath);

      return uploadResult;
    } catch (err) {
      console.error('Move file error:', err);
      setError(err instanceof Error ? err.message : 'Failed to move file');
      return false;
    }
  };

  const getPublicUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  return {
    uploadImage,
    uploadFromDataURL,
    listFiles,
    deleteFile,
    moveFile,
    getPublicUrl,
    uploading,
    error
  };
}