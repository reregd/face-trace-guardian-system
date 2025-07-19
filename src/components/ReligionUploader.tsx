import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Upload, AlertCircle, CheckCircle, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ReligionUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setMessage('');
      } else {
        setMessage('❌ Veuillez sélectionner un fichier image');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    try {
      const { data, error } = await supabase.storage
        .from('religion')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            setProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (error) {
        setMessage(`❌ Erreur d'upload: ${error.message}`);
        toast({
          title: "Erreur d'upload",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setMessage('✅ Image uploadée avec succès');
        setFile(null);
        setProgress(100);
        toast({
          title: "Upload réussi",
          description: "L'image va être automatiquement indexée pour la reconnaissance faciale",
        });
        
        // Reset after success
        setTimeout(() => {
          setProgress(0);
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error}`);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Image className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold">Upload dans le bucket Religion</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Fichier sélectionné: {file.name}</span>
            <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Upload en cours...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full"
          variant={file ? 'default' : 'secondary'}
        >
          {uploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Envoyer l'image
            </>
          )}
        </Button>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.includes('❌') 
              ? 'bg-destructive/10 text-destructive border border-destructive/20' 
              : 'bg-accent/10 text-accent border border-accent/20'
          }`}>
            {message.includes('❌') ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {message}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <p><strong>Note:</strong> Les images uploadées sont automatiquement analysées pour la détection faciale.</p>
        <p>L'indexation se fait en arrière-plan via les Edge Functions Supabase.</p>
      </div>
    </Card>
  );
}