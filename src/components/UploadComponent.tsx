import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { FACE_RECOGNITION_CONFIG } from '@/constants';
import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UploadComponentProps {
  bucket?: string;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
}

export function UploadComponent({
  bucket = 'documents',
  allowedTypes = [...FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.images, 
                  ...FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.videos, 
                  ...FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.documents],
  maxFileSize = 50, // 50MB
  className
}: UploadComponentProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, uploading } = useSupabaseStorage();

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    
    if (FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.images.some(format => 
      format.slice(1) === ext)) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.videos.some(format => 
      format.slice(1) === ext)) {
      return <Video className="w-5 h-5 text-green-500" />;
    }
    if (FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.documents.some(format => 
      format.slice(1) === ext)) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Fichier trop volumineux (max ${maxFileSize}MB)`;
    }

    // Check file type
    const ext = '.' + file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(ext)) {
      return `Type de fichier non supporté (${ext})`;
    }

    return null;
  };

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploadFiles: UploadFile[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      newUploadFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      });
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    if (uploadFile.status !== 'pending') return;

    setUploadFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ));

    try {
      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}_${uploadFile.file.name}`;

      const result = await uploadImage(bucket, uploadFile.file, filename);

      if (result) {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));

        toast({
          title: "Upload réussi",
          description: `${uploadFile.file.name} a été téléchargé`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ));

      toast({
        title: "Erreur d'upload",
        description: `Impossible de télécharger ${uploadFile.file.name}`,
        variant: "destructive"
      });
    }
  };

  const uploadAllPending = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await uploadSingleFile(file);
    }
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => 
      f.status !== 'success' && f.status !== 'error'
    ));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de fichiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Glissez vos fichiers ici ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Formats supportés: {allowedTypes.join(', ')}<br />
              Taille maximum: {maxFileSize}MB par fichier
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Sélectionner des fichiers
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
            />
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Fichiers en attente</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={uploadAllPending}
                    disabled={uploading || !uploadFiles.some(f => f.status === 'pending')}
                  >
                    Upload tous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearCompleted}
                  >
                    Nettoyer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {uploadFiles.map((uploadFile) => (
                  <div key={uploadFile.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getFileIcon(uploadFile.file.name)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{uploadFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="mt-1" />
                      )}
                      
                      {uploadFile.error && (
                        <p className="text-sm text-destructive mt-1">{uploadFile.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {uploadFile.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => uploadSingleFile(uploadFile)}
                          disabled={uploading}
                        >
                          Upload
                        </Button>
                      )}
                      
                      {uploadFile.status === 'uploading' && (
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      )}
                      
                      {uploadFile.status === 'success' && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}