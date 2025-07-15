import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
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
  Search,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { Input } from './ui/input';
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
  className?: string;
}

export function FileExplorer({ className }: FileExplorerProps) {
  const [currentBucket, setCurrentBucket] = useState<string>('faces_known');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { listFiles, deleteFile, getPublicUrl, loading, error } = useSupabaseStorage();

  const buckets = Object.values(FACE_RECOGNITION_CONFIG.STORAGE_BUCKETS);

  const loadFiles = async () => {
    const fileList = await listFiles(currentBucket, currentFolder);
    setFiles(fileList || []);
  };

  useEffect(() => {
    loadFiles();
  }, [currentBucket, currentFolder]);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'heic'].includes(ext || '')) {
      return <Image className="w-5 h-5" />;
    }
    if (['mp4', 'hevc', 'mov', 'avi'].includes(ext || '')) {
      return <Video className="w-5 h-5" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const url = getPublicUrl(currentBucket, file.name);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      
      toast({
        title: "Téléchargement initié",
        description: `${file.name} en cours de téléchargement`,
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
    if (confirm(`Supprimer ${file.name} ?`)) {
      const success = await deleteFile(currentBucket, file.name);
      if (success) {
        await loadFiles();
        toast({
          title: "Fichier supprimé",
          description: `${file.name} a été supprimé`,
        });
      }
    }
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    const url = getPublicUrl(currentBucket, selectedFile.name);
    const ext = selectedFile.name.toLowerCase().split('.').pop();

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return (
        <div className="max-w-full max-h-96 overflow-hidden rounded-lg">
          <img src={url} alt={selectedFile.name} className="w-full h-auto" />
        </div>
      );
    }

    if (['mp4', 'mov', 'avi'].includes(ext || '')) {
      return (
        <div className="max-w-full max-h-96 overflow-hidden rounded-lg">
          <video controls className="w-full h-auto">
            <source src={url} type={`video/${ext}`} />
          </video>
        </div>
      );
    }

    if (ext === 'pdf') {
      return (
        <div className="w-full h-96">
          <iframe src={url} className="w-full h-full rounded-lg" />
        </div>
      );
    }

    return (
      <div className="p-4 bg-muted rounded-lg text-center">
        <File className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aperçu non disponible</p>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Explorateur de fichiers</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bucket Selection */}
      <div className="flex flex-wrap gap-2">
        {buckets.map(bucket => (
          <Button
            key={bucket}
            variant={currentBucket === bucket ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCurrentBucket(bucket);
              setCurrentFolder('');
            }}
          >
            <Folder className="w-4 h-4 mr-1" />
            {bucket.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des fichiers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolder('')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <span>/</span>
          <span>{currentFolder}</span>
        </div>
      )}

      {/* Files */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Erreur: {error}</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-8">
          <Folder className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun fichier trouvé</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  {getFileIcon(file.name)}
                  <span className="text-xs font-medium truncate w-full" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileClick(file)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(file)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <Card key={file.name} className="cursor-pointer hover:bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.name)}
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {new Date(file.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileClick(file)}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{selectedFile.name}</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedFile)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
            <div className="p-4">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}