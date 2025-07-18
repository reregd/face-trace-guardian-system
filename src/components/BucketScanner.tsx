import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Scan, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScanResult {
  success: boolean;
  message: string;
  total_files: number;
  processed_faces: number;
  faces?: any[];
}

export function BucketScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  const startBucketScan = async () => {
    setIsScanning(true);
    
    try {
      // Call the edge function to scan bucket
      const { data, error } = await supabase.functions.invoke('scan-bucket-for-faces', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      setLastScan(data);
      
      toast({
        title: "Scan terminé",
        description: `${data.processed_faces} nouveaux visages indexés sur ${data.total_files} fichiers`,
      });

    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Erreur de scan",
        description: "Impossible de scanner le bucket religion",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5" />
          Scanner le Bucket Religion
        </CardTitle>
        <CardDescription>
          Analyse automatique des images stockées pour générer la base de reconnaissance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={startBucketScan} 
          disabled={isScanning}
          className="w-full"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Scan en cours...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4 mr-2" />
              Démarrer le scan
            </>
          )}
        </Button>

        {lastScan && (
          <div className={`p-4 rounded-lg border ${
            lastScan.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastScan.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium">
                {lastScan.success ? 'Scan réussi' : 'Erreur de scan'}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {lastScan.message}
            </p>
            
            {lastScan.success && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Fichiers totaux:</span>
                  <span className="ml-1">{lastScan.total_files}</span>
                </div>
                <div>
                  <span className="font-medium">Visages traités:</span>
                  <span className="ml-1">{lastScan.processed_faces}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Cette fonction scanne toutes les images du bucket "religion" et génère automatiquement des embeddings pour la reconnaissance faciale.</p>
          <p className="mt-1">Les images sont organisées par dossier = nom de la personne</p>
        </div>
      </CardContent>
    </Card>
  );
}