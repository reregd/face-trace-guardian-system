import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Upload, FileImage, Trash2, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as faceapi from '@vladmandic/face-api';

interface BatchImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: {
    facesDetected: number;
    emotions?: string;
    age?: number;
    gender?: string;
  };
  error?: string;
}

export function BatchProcessor() {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: BatchImage[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter(img => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setProgress(0);
  };

  const processImage = async (image: BatchImage): Promise<BatchImage> => {
    try {
      // Create image element
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = image.preview;
      });

      // Detect faces with emotions and age/gender
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
        .withAgeAndGender();

      if (detections.length === 0) {
        return {
          ...image,
          status: 'completed',
          result: { facesDetected: 0 }
        };
      }

      const firstFace = detections[0];
      const dominantEmotion = Object.entries(firstFace.expressions)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];

      // Upload to Supabase
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx?.drawImage(img, 0, 0);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      const fileName = `batch-${Date.now()}-${image.file.name}`;
      await supabase.storage.from('religion').upload(fileName, blob);

      return {
        ...image,
        status: 'completed',
        result: {
          facesDetected: detections.length,
          emotions: dominantEmotion,
          age: Math.round(firstFace.age),
          gender: firstFace.gender
        }
      };
    } catch (error) {
      return {
        ...image,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const processBatch = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    setProgress(0);

    const pendingImages = images.filter(img => img.status === 'pending');
    
    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i];
      
      // Update status to processing
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'processing' } : img
      ));

      // Process image
      const result = await processImage(image);
      
      // Update with result
      setImages(prev => prev.map(img => 
        img.id === image.id ? result : img
      ));

      // Update progress
      setProgress(((i + 1) / pendingImages.length) * 100);
    }

    setProcessing(false);
    toast({
      title: "Traitement terminé",
      description: `${pendingImages.length} images traitées avec succès`
    });
  };

  const getStatusIcon = (status: BatchImage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileImage className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileImage className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">Traitement par Lot</h3>
        </div>
        <Badge variant="outline">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={processing}
              className="hidden"
              id="batch-upload"
            />
            <label
              htmlFor="batch-upload"
              className="flex items-center justify-center gap-2 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Glissez-déposez ou cliquez pour sélectionner plusieurs images
              </span>
            </label>
          </div>
        </div>

        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Traitement en cours...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="flex gap-2">
              <Button
                onClick={processBatch}
                disabled={processing || images.every(img => img.status !== 'pending')}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Traiter toutes les images
              </Button>
              <Button
                onClick={clearAll}
                disabled={processing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Tout effacer
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {images.map((image) => (
                <Card key={image.id} className="p-4 space-y-3">
                  <div className="relative">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getStatusIcon(image.status)}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(image.id)}
                        disabled={processing}
                        className="w-6 h-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-medium truncate">{image.file.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {image.status}
                    </Badge>
                  </div>

                  {image.result && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Visages: {image.result.facesDetected}</p>
                      {image.result.emotions && (
                        <p>Émotion: {image.result.emotions}</p>
                      )}
                      {image.result.age && (
                        <p>Âge: {image.result.age} ans</p>
                      )}
                      {image.result.gender && (
                        <p>Genre: {image.result.gender}</p>
                      )}
                    </div>
                  )}

                  {image.error && (
                    <p className="text-xs text-red-500">{image.error}</p>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}