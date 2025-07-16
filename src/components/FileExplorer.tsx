import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { FACE_RECOGNITION_CONFIG } from '@/constants';
import {
  Folder,
  File,
  Image,
  Video,
  FileText,
  Download,
  Trash2,
  Eye,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileItem {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}

interface FileExplorerProps {
  bucket?: string;
  className?: string;
}

export function FileExplorer({
  bucket = 'documents',
  className
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  const { listFiles, deleteFile, getPublicUrl, uploading, error } = useSupabaseStorage();

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

  const loadFiles = async () => {
    try {
      const fileList = await listFiles(bucket, currentFolder);
      setFiles(fileList || []);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les fichiers",
        variant: "destructive"
      });
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.name.endsWith('/')) {
      // It's a folder
      setCurrentFolder(currentFolder + file.name);
    } else {
      // It's a file
      setSelectedFile(file);
      const ext = file.name.toLowerCase().split('.').pop();
      if (FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.images.some(format => 
        format.slice(1) === ext) ||
        FACE_RECOGNITION_CONFIG.SUPPORTED_FORMATS.videos.some(format => 
        format.slice(1) === ext)) {
        setViewerOpen(true);
      }
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const publicUrl = getPublicUrl(bucket, currentFolder + file.name);
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = file.name;
      link.click();
      
      toast({
        title: "Téléchargement",
        description: `${file.name} est en cours de téléchargement`,
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${file.name} ?`)) {
      try {
        const success = await deleteFile(bucket, currentFolder + file.name);
        if (success) {
          await loadFiles();
          toast({
            title: "Suppression",
            description: `${file.name} a été supprimé`,
          });
        }
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le fichier",
          variant: "destructive"
        });
      }
    }
  };

  const goBack = () => {
    const pathParts = currentFolder.split('/').filter(Boolean);
    pathParts.pop();
    setCurrentFolder(pathParts.length > 0 ? pathParts.join('/') + '/' : '');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    loadFiles();
  }, [bucket, currentFolder]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Explorateur de fichiers
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadFiles}
              disabled={uploading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Navigation */}
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
            {currentFolder && (
              <Button size="sm" variant="ghost" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              /{bucket}/{currentFolder}
            </span>
          </div>

          {/* File List */}
          {uploading && (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!uploading && !error && files.length === 0 && (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun fichier dans ce dossier</p>
            </div>
          )}

          {!uploading && files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {file.name.endsWith('/') ? (
                    <Folder className="w-5 h-5 text-blue-500" />
                  ) : (
                    getFileIcon(file.name)
                  )}
                  
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleFileClick(file)}
                  >
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(file.updated_at).toLocaleDateString()}
                      {file.metadata?.size && ` • ${formatFileSize(file.metadata.size)}`}
                    </p>
                  </div>

                  {!file.name.endsWith('/') && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFile(file)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      {viewerOpen && selectedFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-[90vh] w-full mx-4">
            <div className="bg-background rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">{selectedFile.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewerOpen(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4">
                {selectedFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                  <img
                    src={getPublicUrl(bucket, currentFolder + selectedFile.name)}
                    alt={selectedFile.name}
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                  />
                )}
                {selectedFile.name.toLowerCase().match(/\.(mp4|webm|ogg)$/i) && (
                  <video
                    src={getPublicUrl(bucket, currentFolder + selectedFile.name)}
                    controls
                    className="max-w-full max-h-[60vh] mx-auto"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}