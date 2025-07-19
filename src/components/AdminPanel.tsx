import React from 'react';
import { ReligionUploader } from './ReligionUploader';
import { FacesAdminViewer } from './FacesAdminViewer';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Settings, 
  Upload, 
  Users, 
  Database,
  Activity,
  Shield
} from 'lucide-react';

export function AdminPanel() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Administration Reconnaissance Faciale
            </h1>
            <p className="text-muted-foreground">
              Gestion des images, indexation automatique et supervision
            </p>
          </div>
        </div>
        <Badge className="bg-accent text-accent-foreground">
          <Activity className="w-3 h-3 mr-1" />
          Système Actif
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload & Indexation
          </TabsTrigger>
          <TabsTrigger value="faces" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Gestion des Visages
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload et Indexation Automatique
            </h2>
            <p className="text-muted-foreground mb-6">
              Uploadez des images dans le bucket religion/ pour alimenter la base de reconnaissance faciale.
              Chaque image est automatiquement analysée et indexée via les Edge Functions Supabase.
            </p>
            <ReligionUploader />
          </Card>
        </TabsContent>

        <TabsContent value="faces" className="space-y-6">
          <FacesAdminViewer />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration du Système
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-medium">Paramètres de Détection</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Seuil de similarité</span>
                    <Badge variant="outline">35%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Intervalle de détection</span>
                    <Badge variant="outline">3 secondes</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Max détections par visage</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Buckets de Stockage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">religion/</span>
                    <Badge className="bg-primary text-primary-foreground">Base de données</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">faces_known/</span>
                    <Badge className="bg-accent text-accent-foreground">Reconnus</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">faces_unknown/</span>
                    <Badge className="bg-warning text-warning-foreground">Inconnus</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Informations Techniques
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Face-API.js pour la détection et l'extraction de caractéristiques</p>
                <p>• Supabase Edge Functions pour l'indexation automatique</p>
                <p>• PostgreSQL avec extension pgvector pour la recherche de similarité</p>
                <p>• RLS (Row Level Security) activé pour la sécurité des données</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}