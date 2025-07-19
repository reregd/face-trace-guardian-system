import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { 
  Users, 
  Tag, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Eye,
  Calendar,
  Database 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FaceRecord {
  id: number;
  image_url: string;
  name: string | null;
  user_id: string | null;
  metadata: any;
  created_at: string;
  embedding: number[];
}

export function FacesAdminViewer() {
  const [faces, setFaces] = useState<FaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadFaces();
  }, []);

  const loadFaces = async () => {
    try {
      const { data, error } = await supabase
        .from('face_embeddings')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error loading faces:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les visages",
          variant: "destructive"
        });
      } else {
        setFaces(data || []);
      }
    } catch (error) {
      console.error('Faces loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (id: number, newName: string) => {
    try {
      const { error } = await supabase
        .from('face_embeddings')
        .update({ name: newName.trim() || null })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le nom",
          variant: "destructive"
        });
      } else {
        setFaces(prev => prev.map(face => 
          face.id === id ? { ...face, name: newName.trim() || null } : face
        ));
        setEditingId(null);
        setEditName('');
        toast({
          title: "Succès",
          description: "Nom mis à jour avec succès"
        });
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce visage ?')) return;

    try {
      const { error } = await supabase
        .from('face_embeddings')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le visage",
          variant: "destructive"
        });
      } else {
        setFaces(prev => prev.filter(face => face.id !== id));
        toast({
          title: "Supprimé",
          description: "Visage supprimé avec succès"
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const startEdit = (face: FaceRecord) => {
    setEditingId(face.id);
    setEditName(face.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `https://yxsgyhbfyyuayvuoobua.supabase.co/storage/v1/object/public/religion/${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">Gestion des Visages Indexés</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            {faces.length} visages
          </Badge>
          <Button onClick={loadFaces} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Faces Grid */}
      {faces.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Aucun visage indexé trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">
            Uploadez des images dans le bucket religion/ pour commencer
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faces.map((face) => (
            <Card key={face.id} className="p-4 space-y-4">
              {/* Face Image */}
              <div className="flex justify-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={getImageUrl(face.image_url)} 
                    alt={face.name || 'Visage inconnu'} 
                    className="object-cover"
                  />
                  <AvatarFallback>
                    <Users className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Face Info */}
              <div className="space-y-3">
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    ID: {face.id}
                  </Badge>
                </div>

                {/* Name Editing */}
                {editingId === face.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nom de la personne..."
                      className="text-center"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateName(face.id, editName)}
                        className="flex-1"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Sauver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="flex-1"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="font-medium">
                      {face.name || 'Nom non défini'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(face)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {face.name ? 'Modifier' : 'Nommer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(face.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Ajouté: {new Date(face.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Embedding: {face.embedding?.length || 0} dimensions
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}