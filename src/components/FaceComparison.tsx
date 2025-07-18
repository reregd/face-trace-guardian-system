import React, { useState } from 'react';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FaceComparisonProps {
  capturedFace: {
    imageData: string;
    box: { x: number; y: number; width: number; height: number };
    embeddings: number[];
  };
  matchedFace: {
    id: number;
    name: string;
    imageUrl: string;
    similarity: number;
    folderPath: string;
  };
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function FaceComparison({ 
  capturedFace, 
  matchedFace, 
  onConfirm, 
  onReject, 
  onClose 
}: FaceComparisonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `confirmed_${timestamp}.jpg`;
      
      // Get the folder path from the matched face
      const fullPath = `${matchedFace.folderPath}/${filename}`;

      // Convert data URL to blob
      const response = await fetch(capturedFace.imageData);
      const blob = await response.blob();

      // Upload to the same folder as the matched face
      const { error: uploadError } = await supabase.storage
        .from('religion')
        .upload(fullPath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      toast({
        title: "Image confirmée",
        description: `Sauvegardée dans ${fullPath}`,
      });

      onConfirm();
    } catch (error) {
      console.error('Error confirming match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card max-w-4xl w-full rounded-lg shadow-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-center">
            Visage détecté - Ressemblance: {(matchedFace.similarity * 100).toFixed(1)}%
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Captured Face */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">Image capturée</h3>
              <div className="relative inline-block">
                <img 
                  src={capturedFace.imageData} 
                  alt="Visage capturé" 
                  className="max-w-full h-auto rounded-lg border-2 border-primary"
                />
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                  LIVE
                </div>
              </div>
            </div>

            {/* Matched Face */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">Image en base</h3>
              <div className="relative inline-block">
                <img 
                  src={matchedFace.imageUrl} 
                  alt={matchedFace.name}
                  className="max-w-full h-auto rounded-lg border-2 border-accent"
                />
                <div className="absolute bottom-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded text-xs">
                  {matchedFace.name}
                </div>
              </div>
            </div>
          </div>

          {/* Similarity Score */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span className="font-mono text-lg">
                Ressemblance estimée: <strong>{(matchedFace.similarity * 100).toFixed(1)}%</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isProcessing ? 'Sauvegarde...' : 'Confirmer'}
            </Button>
            
            <Button
              onClick={onReject}
              variant="destructive"
              disabled={isProcessing}
              className="px-6 py-2"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
            >
              Fermer
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-sm text-muted-foreground text-center mt-4">
            Si vous confirmez, l'image sera sauvegardée dans le dossier: {matchedFace.folderPath}
          </p>
        </div>
      </div>
    </div>
  );
}